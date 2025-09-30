export type PostMediaMeta = {
  id: string;
  title: string;
  description: string;
  subtitle: string;
  postFact: string;
};

export type PostRecord = {
  id: string;
  userId: string;
  name: string;
  title: string;
  description: string;
  mediaIds: string[];
  mediaMeta: PostMediaMeta[];
  createdAt: string;
};

export type CreatePostInput = {
  userId: string;
  name?: string;
  title?: string;
  description?: string;
  mediaIds: string[];
  mediaMeta?: PostMediaMeta[];
};

export type UpdatePostInput = Partial<Pick<PostRecord, 'name' | 'title' | 'description' | 'mediaMeta'>>;

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

function sanitizeMediaMeta(meta: PostMediaMeta[] | undefined, mediaIds: string[]): PostMediaMeta[] {
  if (!Array.isArray(meta)) return mediaIds.map(id => ({ id, title: '', description: '', subtitle: '', postFact: '' }));
  const allowedIds = new Set(mediaIds);
  const normalized = meta
    .filter(entry => entry && typeof entry === 'object' && allowedIds.has(entry.id))
    .map(entry => ({
      id: entry.id,
      title: entry.title?.trim() ?? '',
      description: entry.description?.trim() ?? '',
      subtitle: entry.subtitle?.trim() ?? '',
      postFact: entry.postFact?.trim() ?? '',
    }));

  const missingIds = mediaIds.filter(id => !normalized.some(entry => entry.id === id));
  return normalized.concat(missingIds.map(id => ({ id, title: '', description: '', subtitle: '', postFact: '' })));
}

function sanitizeText(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim() : '';
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
  const mediaMeta = sanitizeMediaMeta(input.mediaMeta, mediaIds);

  const name = sanitizeText(input.name);
  const title = sanitizeText(input.title);
  const description = sanitizeText(input.description);

  const post: PostRecord = {
    id: getRandomId(),
    userId,
    name,
    title,
    description,
    mediaIds,
    mediaMeta,
    createdAt: new Date().toISOString(),
  };

  const current = storage[userId] ?? [];
  storage[userId] = [post, ...current];
  writeStorage(storage);
  emitPostsChanged(userId);

  return post;
}

export function getPostDisplayLabel(post: Pick<PostRecord, 'title' | 'name'>, fallback = 'Untitled post'): string {
  const normalizedTitle = post.title.trim();
  if (normalizedTitle) {
    return normalizedTitle;
  }

  const normalizedName = post.name.trim();
  if (normalizedName) {
    return normalizedName;
  }

  return fallback;
}

export function listPosts(userId: string): PostRecord[] {
  if (!isBrowser()) {
    return [];
  }
  const storage = readStorage();
  const normalized = normalizeUserId(userId);
  const posts = storage[normalized] ?? [];
  return posts
    .map(post => ({
      ...post,
      mediaMeta: sanitizeMediaMeta(post.mediaMeta, post.mediaIds),
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
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

export function updatePost(userId: string, postId: string, updates: UpdatePostInput): PostRecord | null {
  if (!isBrowser()) {
    return null;
  }

  const storage = readStorage();
  const normalized = normalizeUserId(userId);
  const posts = storage[normalized] ?? [];
  const index = posts.findIndex(post => post.id === postId);
  if (index === -1) {
    return null;
  }

  const current = posts[index];
  const mediaMeta = updates.mediaMeta
    ? sanitizeMediaMeta(updates.mediaMeta, current.mediaIds)
    : current.mediaMeta;

  const nextPost: PostRecord = {
    ...current,
    name: updates.name !== undefined ? updates.name.trim() : current.name,
    title: updates.title !== undefined ? updates.title.trim() : current.title,
    description: updates.description !== undefined ? updates.description.trim() : current.description,
    mediaMeta,
  };

  posts[index] = nextPost;
  storage[normalized] = posts;
  writeStorage(storage);
  emitPostsChanged(normalized);
  return nextPost;
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
