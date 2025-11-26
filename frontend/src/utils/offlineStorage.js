/**
 * Offline Storage Utility
 * Handles IndexedDB operations for offline data storage
 */

const DB_NAME = 'n2revcon_db';
const DB_VERSION = 1;

let db = null;

/**
 * Initialize IndexedDB
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      // Create object stores
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('revenue')) {
        db.createObjectStore('revenue', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('expenses')) {
        db.createObjectStore('expenses', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('billing')) {
        db.createObjectStore('billing', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('collections')) {
        db.createObjectStore('collections', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('pendingSync')) {
        const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
};

/**
 * Save data to IndexedDB
 */
export const saveToDB = (storeName, data) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get data from IndexedDB
 */
export const getFromDB = (storeName, key) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = key ? store.get(key) : store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Delete data from IndexedDB
 */
export const deleteFromDB = (storeName, key) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Add to pending sync queue
 */
export const addToSyncQueue = (type, data, endpoint, method = 'POST') => {
  return saveToDB('pendingSync', {
    type,
    data,
    endpoint,
    method,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get pending sync items
 */
export const getPendingSync = () => {
  return getFromDB('pendingSync');
};

/**
 * Clear pending sync item
 */
export const clearPendingSync = (id) => {
  return deleteFromDB('pendingSync', id);
};

/**
 * Check if online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Sync pending data when online
 */
export const syncPendingData = async (api) => {
  if (!isOnline()) {
    return;
  }

  try {
    const pendingItems = await getPendingSync();
    if (!pendingItems || pendingItems.length === 0) {
      return;
    }

    for (const item of pendingItems) {
      try {
        let response;
        switch (item.method) {
          case 'POST':
            response = await api.post(item.endpoint, item.data);
            break;
          case 'PUT':
            response = await api.put(item.endpoint, item.data);
            break;
          case 'DELETE':
            response = await api.delete(item.endpoint);
            break;
          default:
            continue;
        }

        if (response && response.status >= 200 && response.status < 300) {
          await clearPendingSync(item.id);
        }
      } catch (error) {
        console.error('Sync error for item:', item, error);
        // Keep item in queue for retry
      }
    }
  } catch (error) {
    console.error('Error syncing pending data:', error);
  }
};

