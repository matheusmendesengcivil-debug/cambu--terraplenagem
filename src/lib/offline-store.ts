// IndexedDB storage for offline first operation and sync queue
const DB_NAME = 'cambui_gestao_db'
const DB_VERSION = 1

export interface OfflineRecord {
  id: string
  table: string
  action: 'insert' | 'update' | 'delete'
  data: any
  created_at: string
  synced: boolean
  retries?: number
}

export function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'))
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id' })
        store.createIndex('synced', 'synced', { unique: false })
        store.createIndex('table', 'table', { unique: false })
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function addOfflineQueue(
  table: string,
  action: 'insert' | 'update' | 'delete',
  data: any,
): Promise<string> {
  const db = await openOfflineDB()
  const id = data.id || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const record: OfflineRecord = {
    id,
    table,
    action,
    data: { ...data, id },
    created_at: new Date().toISOString(),
    synced: false,
    retries: 0,
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite')
    const store = tx.objectStore('sync_queue')
    const req = store.put(record)
    req.onsuccess = () => resolve(id)
    req.onerror = () => reject(req.error)
  })
}

export async function getPendingOfflineQueue(): Promise<OfflineRecord[]> {
  try {
    const db = await openOfflineDB()
    return new Promise((resolve) => {
      const tx = db.transaction('sync_queue', 'readonly')
      const store = tx.objectStore('sync_queue')
      const req = store.getAll()
      req.onsuccess = () => {
        const items: OfflineRecord[] = req.result || []
        resolve(items.filter((i) => !i.synced))
      }
      req.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

export async function markOfflineSynced(id: string): Promise<void> {
  try {
    const db = await openOfflineDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite')
      const store = tx.objectStore('sync_queue')
      const req = store.delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // ignore
  }
}

export async function setCachedData(key: string, data: any): Promise<void> {
  try {
    const db = await openOfflineDB()
    return new Promise((resolve) => {
      const tx = db.transaction('cache', 'readwrite')
      const store = tx.objectStore('cache')
      store.put({ key, data, updated_at: new Date().toISOString() })
      tx.oncomplete = () => resolve()
    })
  } catch {
    // fallback to localStorage
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(data))
    } catch {
      // ignore
    }
  }
}

export async function getCachedData<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openOfflineDB()
    return new Promise((resolve) => {
      const tx = db.transaction('cache', 'readonly')
      const store = tx.objectStore('cache')
      const req = store.get(key)
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data as T)
        } else {
          // try localStorage
          const local = localStorage.getItem(`cache_${key}`)
          resolve(local ? JSON.parse(local) : null)
        }
      }
      req.onerror = () => {
        const local = localStorage.getItem(`cache_${key}`)
        resolve(local ? JSON.parse(local) : null)
      }
    })
  } catch {
    const local = localStorage.getItem(`cache_${key}`)
    return local ? JSON.parse(local) : null
  }
}
