import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../services/sync_service.dart';
import '../db/app_database.dart';
import 'login_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _apiUrlController = TextEditingController();
  String? _lastSyncAt;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _apiUrlController.text = SyncService.getApiUrl();
    _loadLastSync();
  }

  Future<void> _loadLastSync() async {
    final ls = await AppDatabase.getSyncMeta('last_sync_at');
    if (mounted) {
      setState(() => _lastSyncAt = ls);
    }
  }

  @override
  void dispose() {
    _apiUrlController.dispose();
    super.dispose();
  }

  String _formatLastSync(String? ts) {
    if (ts == null || ts == '0') return 'لم تتم بعد';
    final date = DateTime.fromMillisecondsSinceEpoch(int.parse(ts) * 1000);
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('الإعدادات العامة', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
        const SizedBox(height: 24),

        // Sync card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.cloud, color: Color(0xFF064e3b)),
                    SizedBox(width: 8),
                    Text('المزامنة والسيرفر', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 16),
                StreamBuilder<SyncState>(
                  stream: SyncService.stateStream,
                  initialData: SyncService.state,
                  builder: (context, snapshot) {
                    final state = snapshot.data ?? SyncState();
                    return Column(
                      children: [
                        _InfoRow(label: 'الحالة', value: _syncStatusLabel(state)),
                        _InfoRow(label: 'آخر مزامنة', value: _formatLastSync(_lastSyncAt)),
                        _InfoRow(label: 'الاتصال', value: state.isOnline ? 'متصل ✅' : 'غير متصل ❌'),
                        if (state.conflictCount > 0)
                          _InfoRow(
                            label: 'التعارضات',
                            value: '${state.conflictCount} تعارض ⚠️',
                            valueColor: Colors.orange,
                          ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: state.isOnline ? () => SyncService.performFullSync() : null,
                            icon: const Icon(Icons.sync),
                            label: const Text('مزامنة الآن'),
                          ),
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _apiUrlController,
                  decoration: const InputDecoration(
                    labelText: 'عنوان السيرفر',
                    hintText: 'http://localhost:3001',
                    prefixIcon: Icon(Icons.dns_outlined),
                  ),
                  textDirection: TextDirection.ltr,
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () {
                      SyncService.setApiUrl(_apiUrlController.text);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('تم حفظ عنوان السيرفر'), behavior: SnackBarBehavior.floating),
                      );
                    },
                    child: const Text('حفظ عنوان السيرفر'),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Local DB card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.storage, color: Colors.indigo),
                    SizedBox(width: 8),
                    Text('قاعدة البيانات المحلية', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  'بياناتك محفوظة محلياً في SQLite وتبقى متاحة بدون إنترنت. عند الاتصال، تتم المزامنة تلقائياً.',
                  style: TextStyle(color: Colors.grey, fontSize: 14),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          // Export backup
                        },
                        icon: const Icon(Icons.upload_file),
                        label: const Text('تصدير نسخة احتياطية'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Logout
        Card(
          child: ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('تسجيل الخروج', style: TextStyle(color: Colors.red)),
            onTap: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('تسجيل الخروج'),
                  content: const Text('هل أنت متأكد من تسجيل الخروج؟'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
                    FilledButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      style: FilledButton.styleFrom(backgroundColor: Colors.red),
                      child: const Text('خروج'),
                    ),
                  ],
                ),
              );
              if (confirm == true && mounted) {
                await context.read<AppProvider>().logout();
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ),

        const SizedBox(height: 24),
        const Center(
          child: Text('v3.0.0 - Offline-First + Sync', style: TextStyle(color: Colors.grey, fontSize: 12)),
        ),
      ],
    );
  }

  String _syncStatusLabel(SyncState state) {
    if (!state.isOnline) return 'بدون إنترنت ❌';
    switch (state.status) {
      case SyncStatus.synced: return 'متزامن ✅';
      case SyncStatus.pushing: return 'جاري الرفع... ⬆️';
      case SyncStatus.pulling: return 'جاري التحميل... ⬇️';
      case SyncStatus.error: return 'خطأ ❌';
      default: return state.pendingCount > 0 ? '${state.pendingCount} تعديل معلق ⏳' : 'جاهز ✅';
    }
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  const _InfoRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: valueColor)),
        ],
      ),
    );
  }
}
