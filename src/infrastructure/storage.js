import { DB_NAME, DB_VERSION, STORE, MAX_MESSAGES } from "../config.js";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecord(record) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  await trimDatabase();
}

export async function getAllRecords() {
  const db = await openDB();
  const records = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  records.sort((a, b) => a.timestamp - b.timestamp);
  return records;
}

export async function getHistory() {
  const records = await getAllRecords();
  return records.slice(-MAX_MESSAGES);
}

export async function trimDatabase() {
  const records = await getAllRecords();
  if (records.length <= MAX_MESSAGES) {
    return;
  }
  const excess = records.slice(0, records.length - MAX_MESSAGES);
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    excess.forEach((record) => store.delete(record.id));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
