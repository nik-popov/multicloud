'use client';

export type MediaSourceType = 'local' | 'remote';

export type MediaRecord = {
	id: string;
	source: MediaSourceType;
	title: string;
	description: string;
	trimStart: number;
	trimEnd: number | null;
	userId: string;
	originalUrl?: string;
	fileName?: string;
	mimeType?: string;
	fileSize?: number;
	createdAt: string;
	updatedAt: string;
};

export type MediaRecordWithBlob = MediaRecord & { blob?: Blob };

const DB_NAME = 'bulkshorts_media';
const DB_VERSION = 1;
const STORE_MEDIA = 'media';

function getIndexedDB(): IDBFactory {
	if (typeof window === 'undefined') {
		throw new Error('IndexedDB is only available in the browser environment');
	}
	return window.indexedDB;
}

function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = getIndexedDB().open(DB_NAME, DB_VERSION);

		request.onerror = () => {
			reject(request.error ?? new Error('Failed to open IndexedDB'));
		};

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_MEDIA)) {
				const store = db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
				store.createIndex('source', 'source', { unique: false });
				store.createIndex('originalUrl', 'originalUrl', { unique: false });
			}
		};
	});
}

async function withStore<T>(
	mode: IDBTransactionMode,
	callback: (store: IDBObjectStore) => Promise<T> | T
): Promise<T> {
	const db = await openDatabase();
	return new Promise<T>((resolve, reject) => {
		const transaction = db.transaction(STORE_MEDIA, mode);
		const store = transaction.objectStore(STORE_MEDIA);

		let callbackResult: Promise<T> | T;
		try {
			callbackResult = callback(store);
		} catch (error) {
			reject(error);
			return;
		}

		transaction.oncomplete = () => {
			if (callbackResult instanceof Promise) {
				callbackResult.then(resolve).catch(reject);
			} else {
				resolve(callbackResult);
			}
		};

		transaction.onerror = () => {
			reject(transaction.error ?? new Error('IndexedDB transaction failed'));
		};

		transaction.onabort = () => {
			reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
		};
	});
}

function nowISO() {
	return new Date().toISOString();
}

async function readRequest<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'));
	});
}

function ensureUserId(record: MediaRecordWithBlob | undefined): MediaRecordWithBlob | undefined {
	if (!record) return record;
	if (!record.userId) {
		record.userId = 'guest';
	}
	return record;
}

export async function saveLocalMedia(file: File, userId = 'guest'): Promise<MediaRecord> {
	const id = crypto.randomUUID();
	const baseRecord: MediaRecordWithBlob = {
		id,
		source: 'local',
		title: file.name,
		description: '',
		trimStart: 0,
		trimEnd: null,
		userId,
		fileName: file.name,
		mimeType: file.type,
		fileSize: file.size,
		createdAt: nowISO(),
		updatedAt: nowISO(),
		blob: file,
	};

	await withStore('readwrite', store => {
		store.put(baseRecord);
	});

	return baseRecord;
}

export async function saveRemoteMedia(url: string, userId = 'guest'): Promise<MediaRecord> {
	const normalizedUrl = url.trim();
	const existing = await findMediaByOriginalUrl(normalizedUrl, userId);
	if (existing) {
		return existing;
	}

	const record: MediaRecord = {
		id: crypto.randomUUID(),
		source: 'remote',
		title: normalizedUrl,
		description: '',
		trimStart: 0,
		trimEnd: null,
		userId,
		originalUrl: normalizedUrl,
		createdAt: nowISO(),
		updatedAt: nowISO(),
	};

	await withStore('readwrite', store => {
		store.put(record);
	});

	return record;
}

export async function updateMedia(
	id: string,
	updates: Partial<Pick<MediaRecord, 'title' | 'description' | 'trimStart' | 'trimEnd'>>
): Promise<MediaRecord | undefined> {
	return withStore('readwrite', async store => {
		const request = store.get(id);
		const current = ensureUserId((await readRequest(request)) as MediaRecordWithBlob | undefined);
		if (!current) return undefined;

		const next: MediaRecordWithBlob = {
			...current,
			...updates,
			updatedAt: nowISO(),
		};

		store.put(next);
		return next;
	});
}

export async function getMedia(id: string): Promise<MediaRecordWithBlob | undefined> {
	return withStore('readonly', async store => {
		const request = store.get(id);
		return ensureUserId((await readRequest(request)) as MediaRecordWithBlob | undefined);
	});
}

export async function getMediaBatch(ids: string[], userId?: string): Promise<MediaRecordWithBlob[]> {
	const results: MediaRecordWithBlob[] = [];
	for (const id of ids) {
		const record = await getMedia(id);
		if (!record) continue;
		const recordUserId = record.userId ?? 'guest';
		if (userId && recordUserId !== userId) continue;
		results.push(record);
	}
	return results;
}

export async function listAllMedia(): Promise<MediaRecordWithBlob[]> {
	return withStore('readonly', async store => {
		const request = store.getAll();
		const records = (await readRequest(request)) as MediaRecordWithBlob[];
		return records.map(record => ensureUserId(record)!).filter(Boolean);
	});
}

export async function getMediaSource(record: MediaRecordWithBlob): Promise<string> {
	if (record.source === 'remote') {
		return record.originalUrl ?? '';
	}

	const withBlob = record.blob ? record : await getMedia(record.id);
	if (!withBlob?.blob) {
		throw new Error('Local media blob not found');
	}

	return URL.createObjectURL(withBlob.blob);
}

export function revokeMediaSource(url: string) {
	if (url && url.startsWith('blob:')) {
		URL.revokeObjectURL(url);
	}
}

async function findMediaByOriginalUrl(url: string, userId: string): Promise<MediaRecord | undefined> {
	return withStore('readonly', async store => {
		const index = store.index('originalUrl');
		const request = index.getAll(url);
		const results = (await readRequest(request)) as MediaRecordWithBlob[];
		const match = results.find(record => (ensureUserId(record)?.userId ?? 'guest') === userId);
		return match;
	});
}