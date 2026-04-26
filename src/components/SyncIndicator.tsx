import { useState, useEffect } from 'react';
import { subscribeToSyncState, performFullSync, SyncState, SyncStatus } from '../services/syncService.js';
import { Cloud, CloudOff, RefreshCw, Check, AlertTriangle, Loader2 } from 'lucide-react';

export default function SyncIndicator() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    lastSyncAt: 0,
    pendingCount: 0,
    conflictCount: 0,
    error: null,
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    const unsubscribe = subscribeToSyncState(setSyncState);
    return unsubscribe;
  }, []);

  const getStatusConfig = (): { icon: any; color: string; label: string; animate: boolean } => {
    switch (syncState.status) {
      case 'pushing':
      case 'pulling':
        return { icon: RefreshCw, color: 'text-blue-500', label: 'جاري المزامنة...', animate: true };
      case 'synced':
        return { icon: Check, color: 'text-green-500', label: 'متزامن', animate: false };
      case 'error':
        return { icon: AlertTriangle, color: 'text-red-500', label: 'خطأ في المزامنة', animate: false };
      case 'offline':
        return { icon: CloudOff, color: 'text-gray-400', label: 'بدون إنترنت', animate: false };
      default:
        if (!syncState.isOnline) {
          return { icon: CloudOff, color: 'text-gray-400', label: 'بدون إنترنت', animate: false };
        }
        if (syncState.pendingCount > 0) {
          return { icon: Cloud, color: 'text-yellow-500', label: `${syncState.pendingCount} تعديل معلق`, animate: false };
        }
        return { icon: Cloud, color: 'text-gray-300', label: 'جاهز للمزامنة', animate: false };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return 'لم تتم بعد';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => performFullSync()}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all
          ${syncState.status === 'pushing' || syncState.status === 'pulling' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}
          ${!syncState.isOnline ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={!syncState.isOnline || syncState.status === 'pushing' || syncState.status === 'pulling'}
        title={config.label}
      >
        <Icon
          size={16}
          className={`${config.color} ${config.animate ? 'animate-spin' : ''}`}
        />
        <span className="hidden sm:inline text-gray-600 text-xs">
          {config.label}
        </span>
      </button>

      {syncState.conflictCount > 0 && (
        <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs">
          <AlertTriangle size={12} />
          {syncState.conflictCount} تعارض
        </span>
      )}

      <span className="text-xs text-gray-400 hidden md:inline">
        آخر مزامنة: {formatLastSync(syncState.lastSyncAt)}
      </span>
    </div>
  );
}
