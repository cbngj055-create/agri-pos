import {
  initDatabase,
  getDatabase,
  getPendingRows,
  getDeletedRows,
  markSynced,
  applyServerRow,
  applyServerDelete,
  getSyncMeta,
  setSyncMeta,
  saveDatabase,
  SYNC_TABLES,
} from '../db/database.js';

export type SyncStatus = 'idle' | 'pushing' | 'pulling' | 'synced' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: number;
  pendingCount: number;
  conflictCount: number;
  error: string | null;
  isOnline: boolean;
}

const API_BASE = () => getSyncMeta('api_url') || (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

export function setApiUrl(url: string) {
  setSyncMeta('api_url', url);
}

export function getApiUrl(): string {
  return getSyncMeta('api_url') || (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';
}

let syncTimer: ReturnType<typeof setInterval> | null = null;
let syncStateListeners: Array<(state: SyncState) => void> = [];
let currentState: SyncState = {
  status: 'idle',
  lastSyncAt: 0,
  pendingCount: 0,
  conflictCount: 0,
  error: null,
  isOnline: navigator.onLine,
};

// --- Network monitoring ---
function setupNetworkMonitoring() {
  window.addEventListener('online', () => {
    currentState.isOnline = true;
    notifyListeners();
    // Auto-sync when coming back online
    performFullSync();
  });

  window.addEventListener('offline', () => {
    currentState.isOnline = false;
    currentState.status = 'offline';
    notifyListeners();
  });
}

// --- State management ---
function notifyListeners() {
  currentState.pendingCount = countPending();
  currentState.conflictCount = countConflicts();
  currentState.lastSyncAt = parseInt(getSyncMeta('last_sync')) || 0;
  syncStateListeners.forEach(fn => fn({ ...currentState }));
}

export function subscribeToSyncState(listener: (state: SyncState) => void): () => void {
  syncStateListeners.push(listener);
  listener({ ...currentState });
  return () => {
    syncStateListeners = syncStateListeners.filter(fn => fn !== listener);
  };
}

function countPending(): number {
  const db = getDatabase();
  let count = 0;
  for (const table of SYNC_TABLES) {
    try {
      const result = db.exec(`SELECT COUNT(*) as cnt FROM ${table} WHERE sync_status = 'pending'`);
      if (result.length > 0) count += Number(result[0].values[0][0]);
    } catch { /* table might not exist yet */ }
  }
  return count;
}

function countConflicts(): number {
  const db = getDatabase();
  let count = 0;
  for (const table of SYNC_TABLES) {
    try {
      const result = db.exec(`SELECT COUNT(*) as cnt FROM ${table} WHERE sync_status = 'conflict'`);
      if (result.length > 0) count += Number(result[0].values[0][0]);
    } catch { /* table might not exist yet */ }
  }
  return count;
}

// --- API helpers ---
async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getSyncMeta('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE()}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API Error ${response.status}: ${body}`);
  }

  return response;
}

// --- Retry with exponential backoff ---
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 2000): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, err);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// --- Compression ---
function compressData(data: Record<string, any[]>): string {
  const json = JSON.stringify(data);
  try {
    return json; // In browser, we rely on HTTP compression (gzip)
    // For a real implementation, use pako or fflate for client-side compression
  } catch {
    return json;
  }
}

// --- PUSH ---
async function pushToServer(): Promise<{ pushed: number; conflicts: any[] }> {
  const deviceId = getSyncMeta('device_id') || 'unknown';
  const data: Record<string, any[]> = {};
  let totalPushed = 0;
  const allConflicts: any[] = [];

  // Gather pending rows
  for (const table of SYNC_TABLES) {
    try {
      const pending = getPendingRows(table);
      if (pending.length > 0) {
        data[table] = pending;
      }

      // Also gather soft-deleted rows that are pending
      const lastSync = parseInt(getSyncMeta('last_sync')) || 0;
      const deleted = getDeletedRows(table, lastSync);
      if (deleted.length > 0) {
        data[`_deleted_${table}`] = deleted;
      }
    } catch { /* skip */ }
  }

  if (Object.keys(data).length === 0) {
    return { pushed: 0, conflicts: [] };
  }

  const response = await withRetry(() =>
    apiRequest('/sync/push', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, data }),
    })
  );

  const result = await response.json();

  if (result.success) {
    // Mark pushed rows as synced
    for (const [tableName, info] of Object.entries(result.results || {}) as any[]) {
      if (info.pushed > 0 && data[tableName]) {
        const ids = data[tableName].map((row: any) => row.id);
        // Only mark non-deleted rows
        try {
          const db = getDatabase();
          const nonDeletedIds = data[tableName]
            .filter((row: any) => !row.deleted_at)
            .map((row: any) => row.id);
          markSynced(tableName, nonDeletedIds);
        } catch { /* skip */ }
      }

      if (info.conflicts && info.conflicts.length > 0) {
        allConflicts.push(...info.conflicts);
        // Mark conflicts locally
        for (const conflict of info.conflicts) {
          try {
            const db = getDatabase();
            db.run(`UPDATE ${tableName} SET sync_status = 'conflict' WHERE id = ?`, [conflict.id]);
          } catch { /* skip */ }
        }
      }
    }

    totalPushed = Object.values(result.results || {})
      .reduce((sum: number, info: any) => sum + (info.pushed || 0), 0) as number;

    saveDatabase();
  }

  return { pushed: totalPushed, conflicts: allConflicts };
}

// --- PULL ---
async function pullFromServer(): Promise<{ pulled: number }> {
  const lastSync = parseInt(getSyncMeta('last_sync')) || 0;

  const response = await withRetry(() =>
    apiRequest(`/sync/pull?last_sync=${lastSync}`)
  );

  const result = await response.json();
  const serverData = result.data || {};
  let pulledCount = 0;

  // Apply each table's data
  for (const [key, rows] of Object.entries(serverData) as any[]) {
    if (key.startsWith('_deleted_')) {
      // Handle deleted records
      const tableName = key.replace('_deleted_', '');
      for (const row of rows) {
        applyServerDelete(tableName, row.id, row.deleted_at, row.updated_at);
        pulledCount++;
      }
    } else {
      // Handle upsert records
      if (SYNC_TABLES.includes(key)) {
        for (const row of rows) {
          applyServerRow(key, row);
          pulledCount++;
        }
      }
    }
  }

  // Update last sync timestamp
  if (result.last_sync) {
    setSyncMeta('last_sync', String(result.last_sync));
  }

  saveDatabase();
  return { pulled: pulledCount };
}

// --- Full Sync ---
export async function performFullSync(): Promise<SyncState> {
  if (!currentState.isOnline) {
    currentState.status = 'offline';
    notifyListeners();
    return currentState;
  }

  const token = getSyncMeta('auth_token');
  if (!token) {
    currentState.status = 'idle';
    notifyListeners();
    return currentState;
  }

  try {
    // Step 1: Push local changes
    currentState.status = 'pushing';
    notifyListeners();

    const pushResult = await pushToServer();

    // Step 2: Pull server changes
    currentState.status = 'pulling';
    notifyListeners();

    const pullResult = await pullFromServer();

    // Done
    currentState.status = 'synced';
    currentState.error = null;
    notifyListeners();

    console.log(`✅ Sync complete: pushed ${pushResult.pushed}, pulled ${pullResult.pulled}, conflicts ${pushResult.conflicts.length}`);

    return currentState;
  } catch (err) {
    console.error('❌ Sync failed:', err);
    currentState.status = 'error';
    currentState.error = (err as Error).message;
    notifyListeners();
    return currentState;
  }
}

// --- Background Sync ---
export function startBackgroundSync(intervalMs = 30000): void {
  stopBackgroundSync();
  console.log(`🔄 Starting background sync every ${intervalMs / 1000}s`);

  syncTimer = setInterval(async () => {
    if (currentState.isOnline && getSyncMeta('auth_token')) {
      const pending = countPending();
      if (pending > 0 || currentState.status !== 'synced') {
        await performFullSync();
      }
    }
  }, intervalMs);

  // Also sync on visibility change (when user comes back to tab)
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

export function stopBackgroundSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && currentState.isOnline) {
    performFullSync();
  }
}

// --- Initialize sync system ---
export function initSyncSystem(): void {
  setupNetworkMonitoring();
  notifyListeners();

  // Start background sync if logged in
  if (getSyncMeta('auth_token')) {
    startBackgroundSync();
  }
}

// --- Force resolve conflict (accept server or local) ---
export function resolveConflict(table: string, id: string, acceptServer: boolean): void {
  const db = getDatabase();

  if (acceptServer) {
    // Mark as synced - next pull will overwrite with server data
    db.run(`UPDATE ${table} SET sync_status = 'synced' WHERE id = ?`, [id]);
  } else {
    // Keep local - mark as pending so it gets pushed again
    db.run(`UPDATE ${table} SET sync_status = 'pending' WHERE id = ?`, [id]);
  }

  saveDatabase();
  notifyListeners();
}

// --- Auth helpers ---
export async function login(email: string, password: string): Promise<{ token: string; user: any }> {
  await initDatabase();
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (result.token) {
    setSyncMeta('auth_token', result.token);
    setSyncMeta('user_id', result.user.id);
    setSyncMeta('store_id', result.user.storeId);

    // Generate device ID if not set
    if (!getSyncMeta('device_id')) {
      setSyncMeta('device_id', crypto.randomUUID());
    }

    startBackgroundSync();
    await performFullSync();
  }

  return result;
}

export async function register(username: string, email: string, password: string, storeName: string): Promise<{ token: string; user: any }> {
  await initDatabase();
  const response = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, storeName }),
  });

  const result = await response.json();

  if (result.token) {
    setSyncMeta('auth_token', result.token);
    setSyncMeta('user_id', result.user.id);
    setSyncMeta('store_id', result.user.storeId);
    setSyncMeta('device_id', crypto.randomUUID());

    startBackgroundSync();
    await performFullSync();
  }

  return result;
}

export function logout(): void {
  stopBackgroundSync();
  setSyncMeta('auth_token', '');
  setSyncMeta('user_id', '');
  setSyncMeta('store_id', '');
  currentState.status = 'idle';
  notifyListeners();
}
