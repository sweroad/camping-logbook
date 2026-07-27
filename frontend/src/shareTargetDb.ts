const DB_NAME = "camping-logbook-share-target";
const STORE_NAME = "batches";

interface SharedBatch {
  id: string;
  files: File[];
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeSharedFiles(id: string, files: File[]): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const batch: SharedBatch = { id, files, createdAt: Date.now() };
      tx.objectStore(STORE_NAME).put(batch);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function getSharedFiles(id: string): Promise<File[] | undefined> {
  const db = await openDb();
  try {
    const batch = await new Promise<SharedBatch | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result as SharedBatch | undefined);
      request.onerror = () => reject(request.error);
    });
    return batch?.files;
  } finally {
    db.close();
  }
}

export async function deleteSharedFiles(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
