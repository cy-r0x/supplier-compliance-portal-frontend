import type { ComplianceDocuments } from "./compliance";

const DB_NAME = "scp-compliance-portal";
const DB_VERSION = 1;
const STORE_NAME = "compliance-files";
const LEGACY_LOCAL_STORAGE_KEY = "scp-compliance-files";

type StoredFileRecord = {
  fileName: string;
  blob: Blob;
};

export type ComplianceFileRef = {
  fileName: string;
  url: string;
};

function storageKey(requestId: string, fieldKey: keyof ComplianceDocuments) {
  return `${requestId}::${fieldKey}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open compliance files database"));
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = run(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error("Compliance files database operation failed"));
      }),
  );
}

/** Drop legacy localStorage payloads that could exceed quota. */
export function clearLegacyComplianceFileStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
  } catch {
    // Ignore quota errors while clearing
  }
}

export async function saveComplianceFiles(
  requestId: string,
  files: Partial<Record<keyof ComplianceDocuments, File>>,
) {
  clearLegacyComplianceFileStorage();

  const entries = Object.entries(files).filter(
    (entry): entry is [keyof ComplianceDocuments, File] => Boolean(entry[1]),
  );

  if (entries.length === 0) return;

  await Promise.all(
    entries.map(([fieldKey, file]) => {
      const record: StoredFileRecord = { fileName: file.name, blob: file };
      return runTransaction("readwrite", (store) =>
        store.put(record, storageKey(requestId, fieldKey)),
      );
    }),
  );
}

export async function readComplianceFileUrls(
  requestId: string,
): Promise<Partial<Record<keyof ComplianceDocuments, ComplianceFileRef>>> {
  const db = await openDb();
  const prefix = `${requestId}::`;
  const result: Partial<Record<keyof ComplianceDocuments, ComplianceFileRef>> = {};

  const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to read compliance file keys"));
  });

  await Promise.all(
    keys
      .filter((key): key is string => typeof key === "string" && key.startsWith(prefix))
      .map(async (key) => {
        const fieldKey = key.slice(prefix.length) as keyof ComplianceDocuments;
        const record = await runTransaction<StoredFileRecord | undefined>(
          "readonly",
          (store) => store.get(key),
        );
        if (!record?.blob) return;
        result[fieldKey] = {
          fileName: record.fileName,
          url: URL.createObjectURL(record.blob),
        };
      }),
  );

  return result;
}
