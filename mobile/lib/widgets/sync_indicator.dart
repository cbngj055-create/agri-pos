import 'package:flutter/material.dart';
import '../services/sync_service.dart';

class SyncIndicatorWidget extends StatelessWidget {
  const SyncIndicatorWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<SyncState>(
      stream: SyncService.stateStream,
      initialData: SyncService.state,
      builder: (context, snapshot) {
        final state = snapshot.data ?? SyncState();
        return _buildIndicator(context, state);
      },
    );
  }

  Widget _buildIndicator(BuildContext context, SyncState state) {
    final config = _getStatusConfig(state);

    return IconButton(
      onPressed: state.isOnline && config.canSync
          ? () => SyncService.performFullSync()
          : null,
      icon: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          config.icon,
          if (state.conflictCount > 0) ...[
            const SizedBox(width: 4),
            Badge(
              label: Text('${state.conflictCount}'),
              child: const Icon(Icons.warning_amber, size: 16, color: Colors.orange),
            ),
          ],
        ],
      ),
      tooltip: config.label,
    );
  }

  _StatusConfig _getStatusConfig(SyncState state) {
    if (!state.isOnline) {
      return _StatusConfig(
        icon: const Icon(Icons.cloud_off, color: Colors.white54, size: 20),
        label: 'بدون إنترنت',
        canSync: false,
      );
    }
    switch (state.status) {
      case SyncStatus.pushing:
        return _StatusConfig(
          icon: const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white70)),
          label: 'جاري الرفع...',
          canSync: false,
        );
      case SyncStatus.pulling:
        return _StatusConfig(
          icon: const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white70)),
          label: 'جاري التحميل...',
          canSync: false,
        );
      case SyncStatus.synced:
        return _StatusConfig(
          icon: const Icon(Icons.cloud_done, color: Colors.greenAccent, size: 20),
          label: 'متزامن',
          canSync: true,
        );
      case SyncStatus.error:
        return _StatusConfig(
          icon: const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
          label: 'خطأ في المزامنة',
          canSync: true,
        );
      default:
        if (state.pendingCount > 0) {
          return _StatusConfig(
            icon: Icon(Icons.cloud_upload, color: Colors.yellow.shade200, size: 20),
            label: '${state.pendingCount} تعديل معلق',
            canSync: true,
          );
        }
        return _StatusConfig(
          icon: const Icon(Icons.cloud_outlined, color: Colors.white54, size: 20),
          label: 'جاهز للمزامنة',
          canSync: true,
        );
    }
  }
}

class _StatusConfig {
  final Widget icon;
  final String label;
  final bool canSync;
  _StatusConfig({required this.icon, required this.label, required this.canSync});
}
