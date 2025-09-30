export type PostRecord = {
  id: string;
  userId: string;
  name: string;
  title: string;
  description: string;
  mediaIds: string[];
  createdAt: string;
};

export type CreatePostInput = {
  userId: string;
  name: string;
  title: string;
  description: string;
  mediaIds: string[];
};

const STORAGE_KEY = 'bulkshorts_posts_v1';

type PostStorage = Record<string, PostRecord[]>;

const BROWSER_ENV_ERROR = 'Post storage is only available in the browser environment';

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const getRandomId = () => (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function emitPostsChanged(userId: string) {
  if (!isBrowser()) return;
  const event = new CustomEvent('bulkshorts:posts', { detail: { userId } });
  window.dispatchEvent(event);
}

function readStorage(): PostStorage {
  if (!isBrowser()) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as PostStorage;
  } catch (error) {
    console.warn('Failed to read post storage', error);
    return {};
  }
}

function writeStorage(storage: PostStorage) {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.warn('Failed to write post storage', error);
  }
}

function sanitizeMediaIds(mediaIds: string[]): string[] {
  return Array.from(new Set(mediaIds.filter(id => typeof id === 'string' && id.trim().length > 0)));
}

function normalizeUserId(userId: string): string {
  return userId?.trim().toLowerCase() || 'guest';
}

export function createPost(input: CreatePostInput): PostRecord {
  if (!isBrowser()) {
    throw new Error(BROWSER_ENV_ERROR);
  }
  const userId = normalizeUserId(input.userId);
  const mediaIds = sanitizeMediaIds(input.mediaIds);
  if (!mediaIds.length) {
    throw new Error('A post requires at least one media item');
  }

  const storage = readStorage();
  const post: PostRecord = {
    id: getRandomId(),
    userId,
    name: input.name.trim(),
    title: input.title.trim(),
    description: input.description.trim(),
    mediaIds,
    createdAt: new Date().toISOString(),
  };

  const current = storage[userId] ?? [];
  storage[userId] = [post, ...current];
  writeStorage(storage);
  emitPostsChanged(userId);

  return post;
}

export function listPosts(userId: string): PostRecord[] {
  if (!isBrowser()) {
    return [];
  }
  const storage = readStorage();
  const normalized = normalizeUserId(userId);
  const posts = storage[normalized] ?? [];
  return [...posts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function deletePost(userId: string, postId: string): void {
  if (!isBrowser()) {
    return;
  }
  const storage = readStorage();
  const normalized = normalizeUserId(userId);
  const posts = storage[normalized] ?? [];
  const nextPosts = posts.filter(post => post.id !== postId);
  if (nextPosts.length === posts.length) return;
  storage[normalized] = nextPosts;
  writeStorage(storage);
  emitPostsChanged(normalized);
}

export function subscribeToPosts(userId: string, callback: () => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }
  const normalized = normalizeUserId(userId);
  const handler = (event: StorageEvent) => {
    if (event.key && event.key !== STORAGE_KEY) return;
    callback();
  };

  window.addEventListener('storage', handler);
  const customHandler = (event: Event) => {
    const detail = (event as CustomEvent<{ userId?: string }>).detail;
    if (detail && normalizeUserId(detail.userId ?? '') !== normalized) {
      return;
    }
    callback();
  };
  window.addEventListener('bulkshorts:posts', customHandler as EventListener);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('bulkshorts:posts', customHandler as EventListener);
  };
}
