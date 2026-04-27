import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';
import '../db/app_database.dart';

enum SyncStatus { idle, pushing, pulling, synced, error, offline }

class SyncState {
  final SyncStatus status;
  final int lastSyncAt;
  final int pendingCount;
  final int conflictCount;
  final String? error;
  final bool isOnline;

  SyncState({
    this.status = SyncStatus.idle,
    this.lastSyncAt = 0,
    this.pendingCount = 0,
    this.conflictCount = 0,
    this.error,
    this.isOnline = true,
  });

  SyncState copyWith({
    SyncStatus? status,
    int? lastSyncAt,
    int? pendingCount,
    int? conflictCount,
    String? error,
    bool? isOnline,
  }) =>
      SyncState(
        status: status ?? this.status,
        lastSyncAt: lastSyncAt ?? this.lastSyncAt,
        pendingCount: pendingCount ?? this.pendingCount,
        conflictCount: conflictCount ?? this.conflictCount,
        error: error ?? this.error,
        isOnline: isOnline ?? this.isOnline,
      );
}

class SyncService {
  static String _apiUrl = 'http://localhost:3001';
  static String? _token;
  static SyncState _state = SyncState();
  static Timer? _syncTimer;
  static final _controller = StreamController<SyncState>.broadcast();
  static String? _deviceId;
  static const _syncTables = [
    'products',
    'categories',
    'orders',
    'order_items',
    'customers',
    'suppliers',
    'payments',
    'expenses',
    'employees',
    'prescriptions',
  ];

  static Stream<SyncState> get stateStream => _controller.stream;
  static SyncState get state => _state;

  static void setApiUrl(String url) {
    _apiUrl = url.replaceAll(RegExp(r'/+$'), '');
  }

  static String getApiUrl() => _apiUrl;

  static void _emit(SyncState s) {
    _state = s;
    _controller.add(s);
  }

  // ===== Auth =====

  static Future<void> login(String email, String password) async {
    final response = await _request('POST', '/auth/login', body: {
      'email': email,
      'password': password,
    });
    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      _token = data['token'];
      await AppDatabase.saveAuthData(
        token: data['token'],
        userId: data['user']['id'],
        storeId: data['user']['store_id'] ?? '',
        username: data['user']['username'] ?? '',
      );
    } else {
      throw Exception(data['error'] ?? 'فشل تسجيل الدخول');
    }
  }

  static Future<void> register(
      String username, String email, String password, String storeName) async {
    final response = await _request('POST', '/auth/register', body: {
      'username': username,
      'email': email,
      'password': password,
      'store_name': storeName,
    });
    final data = jsonDecode(response.body);
    if (response.statusCode == 201) {
      _token = data['token'];
      await AppDatabase.saveAuthData(
        token: data['token'],
        userId: data['user']['id'],
        storeId: data['store_id'] ?? '',
        username: username,
      );
    } else {
      throw Exception(data['error'] ?? 'فشل إنشاء الحساب');
    }
  }

  static Future<void> logout() async {
    _token = null;
    await AppDatabase.clearAuthData();
  }

  static Future<bool> isLoggedIn() async {
    _token = await AppDatabase.authToken;
    return _token != null;
  }

  // ===== Sync System =====

  static Future<void> initSyncSystem() async {
    _token = await AppDatabase.authToken;

    _deviceId = await AppDatabase.getSyncMeta('device_id');
    if (_deviceId == null || _deviceId!.isEmpty) {
      _deviceId = AppDatabase.generateId();
      await AppDatabase.setSyncMeta('device_id', _deviceId!);
    }

    // Monitor connectivity
    Connectivity().onConnectivityChanged.listen((results) {
      final online = results.any((r) => r != ConnectivityResult.none);
      _emit(_state.copyWith(
          isOnline: online,
          status: online ? SyncStatus.idle : SyncStatus.offline));
      if (online) performFullSync();
    });

    // Background sync every 30s
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_state.isOnline && _token != null) performFullSync();
    });
  }

  static Future<void> performFullSync() async {
    if (_token == null || !_state.isOnline) return;

    try {
      await _pushChanges();
      await _pullChanges();

      final pending = await _getTotalPending();
      final conflicts = await _getTotalConflicts();
      final lastSync = await AppDatabase.getSyncMeta('last_sync_at');

      _emit(_state.copyWith(
        status: SyncStatus.synced,
        pendingCount: pending,
        conflictCount: conflicts,
        lastSyncAt: int.tryParse(lastSync ?? '0') ?? 0,
        error: null,
      ));
    } catch (e) {
      _emit(_state.copyWith(status: SyncStatus.error, error: e.toString()));
    }
  }

  static Future<void> _pushChanges() async {
    _emit(_state.copyWith(status: SyncStatus.pushing));

    if (_deviceId == null || _deviceId!.isEmpty) {
      _deviceId = await AppDatabase.getSyncMeta('device_id');
      if (_deviceId == null || _deviceId!.isEmpty) {
        _deviceId = AppDatabase.generateId();
        await AppDatabase.setSyncMeta('device_id', _deviceId!);
      }
    }

    final Map<String, dynamic> data = {};

    for (final table in _syncTables) {
      final pending = await AppDatabase.getPending(table);
      if (pending.isEmpty) continue;

      data[table] = pending;
    }

    if (data.isEmpty) return;

    final response = await _request('POST', '/sync/push', body: {
      'device_id': _deviceId,
      'data': data,
    });

    if (response.statusCode == 200) {
      for (final entry in data.entries) {
        final table = entry.key;
        final rows = (entry.value as List).cast<Map<String, dynamic>>();
        for (final record in rows) {
          final id = record['id'];
          if (id is String && id.isNotEmpty) {
            await AppDatabase.markSynced(table, id);
          }
        }
      }
    }
  }

  static Future<void> _pullChanges() async {
    _emit(_state.copyWith(status: SyncStatus.pulling));

    final lastSync = await AppDatabase.getSyncMeta('last_sync') ??
        await AppDatabase.getSyncMeta('last_sync_at') ??
        '0';

    final response = await _request('GET', '/sync/pull?last_sync=$lastSync');
    if (response.statusCode != 200) return;

    final decoded = jsonDecode(response.body);
    final serverData = (decoded is Map && decoded['data'] is Map)
        ? Map<String, dynamic>.from(decoded['data'] as Map)
        : <String, dynamic>{};

    for (final entry in serverData.entries) {
      final key = entry.key;
      final rows = entry.value as List? ?? [];

      if (key.startsWith('_deleted_')) {
        final table = key.replaceFirst('_deleted_', '');
        for (final record in rows) {
          final map = Map<String, dynamic>.from(record as Map);
          final id = map['id'] as String?;
          final deletedAt = map['deleted_at'];
          final updatedAt = map['updated_at'];
          if (id == null) continue;
          if (deletedAt is int && updatedAt is int) {
            await AppDatabase.applyServerDelete(
                table, id, deletedAt, updatedAt);
          }
        }
        continue;
      }

      // Normal upserts
      for (final record in rows) {
        final map = Map<String, dynamic>.from(record as Map);
        final id = map['id'] as String?;
        if (id == null) continue;
        if (map['deleted_at'] != null) {
          final deletedAt = map['deleted_at'];
          final updatedAt = map['updated_at'];
          if (deletedAt is int && updatedAt is int) {
            await AppDatabase.applyServerDelete(key, id, deletedAt, updatedAt);
          }
        } else {
          await AppDatabase.applyServerData(key, map);
        }
      }
    }

    final lastSyncFromServer = decoded is Map ? decoded['last_sync'] : null;
    final newLastSync = (lastSyncFromServer is int)
        ? lastSyncFromServer
        : AppDatabase.timestamp();

    await AppDatabase.setSyncMeta('last_sync', newLastSync.toString());
    await AppDatabase.setSyncMeta('last_sync_at', newLastSync.toString());
  }

  static Future<int> _getTotalPending() async {
    int total = 0;
    for (final table in _syncTables) {
      total += await AppDatabase.getPendingCount(table);
    }
    return total;
  }

  static Future<int> _getTotalConflicts() async {
    if (AppDatabase.isWeb) return 0;
    final db = await AppDatabase.database;
    int total = 0;
    for (final table in _syncTables) {
      final result = await db!.rawQuery(
        "SELECT COUNT(*) as cnt FROM $table WHERE sync_status = 'conflict'",
      );
      total += result.first['cnt'] as int;
    }
    return total;
  }

  // ===== HTTP Helper with Retry =====

  static Future<http.Response> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    int retries = 3,
  }) async {
    int attempt = 0;
    while (attempt < retries) {
      try {
        final uri = Uri.parse('$_apiUrl$path');
        final headers = <String, String>{
          'Content-Type': 'application/json',
        };
        if (_token != null) headers['Authorization'] = 'Bearer $_token';

        late http.Response response;
        switch (method) {
          case 'GET':
            response = await http.get(uri, headers: headers);
            break;
          case 'POST':
            response =
                await http.post(uri, headers: headers, body: jsonEncode(body));
            break;
          default:
            throw Exception('Unsupported method: $method');
        }
        return response;
      } catch (e) {
        attempt++;
        if (attempt >= retries) rethrow;
        await Future.delayed(Duration(seconds: attempt * 2));
      }
    }
    throw Exception('Max retries exceeded');
  }

  static void dispose() {
    _syncTimer?.cancel();
    _controller.close();
  }
}
