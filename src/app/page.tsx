'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoGrid, type HistoryEntry } from '@/components/video-grid';
import { useAuth } from '@/hooks/use-auth';
import {
  MediaRecordWithBlob,
  getMediaBatch,
  getMediaSource,
  revokeMediaSource,
  saveRemoteMedia,
  updateMedia,
} from '@/lib/media-store';
import { ResolvedMediaItem } from '@/types/media';

const HISTORY_KEY = 'bulkshorts_history_media';
const LEGACY_HISTORY_KEY = 'bulkshorts_history';
const FAVORITES_KEY = 'bulkshorts_favorites_media';

const isHttpUrl = (value: string) => /^https?:/i.test(value);

type MediaUpdates = Partial<Pick<MediaRecordWithBlob, 'title' | 'description' | 'trimStart' | 'trimEnd'>>;

function HomePageContent() {
  const [currentMedia, setCurrentMedia] = useState<ResolvedMediaItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavoritesState] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'main' | 'favorites'>('main');
  const [focusViewActive, setFocusViewActive] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(3);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, logout } = useAuth();
  const userId = user?.email ?? 'guest';

  const objectUrlCacheRef = useRef<Map<string, string>>(new Map());

  const applyCurrentMedia = useCallback((items: ResolvedMediaItem[]) => {
    setCurrentMedia(prev => {
      const nextIds = new Set(items.map(item => item.id));
      prev.forEach(item => {
        if (!nextIds.has(item.id)) {
          const cached = objectUrlCacheRef.current.get(item.id);
          if (cached) {
            revokeMediaSource(cached);
            objectUrlCacheRef.current.delete(item.id);
          }
        }
      });

      items.forEach(item => {
        if (item.src.startsWith('blob:')) {
          objectUrlCacheRef.current.set(item.id, item.src);
        }
      });

      return items;
    });
  }, []);

  useEffect(() => {
    const cache = objectUrlCacheRef.current;
    return () => {
      cache.forEach(url => revokeMediaSource(url));
      cache.clear();
    };
  }, []);

  const resolveMediaByIds = useCallback(async (ids: string[]): Promise<ResolvedMediaItem[]> => {
    if (!ids.length) return [];

    const uniqueIds = Array.from(new Set(ids));
    const records = await getMediaBatch(uniqueIds, userId);
    const resolved = await Promise.all(
      records.map(async record => {
        let src = objectUrlCacheRef.current.get(record.id);
        if (!src) {
          src = await getMediaSource(record);
          if (src.startsWith('blob:')) {
            objectUrlCacheRef.current.set(record.id, src);
          }
        }

        return {
          id: record.id,
          src,
          record,
        } satisfies ResolvedMediaItem;
      })
    );

    const ordering = new Map(uniqueIds.map((id, index) => [id, index] as const));
    resolved.sort((a, b) => (ordering.get(a.id)! - ordering.get(b.id)!));
    return resolved;
  }, [userId]);

  const persistHistory = useCallback((entries: HistoryEntry[]) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  }, []);

  const persistFavorites = useCallback((ids: string[]) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  }, []);

  const addHistoryEntry = useCallback(
    (mediaIds: string[]) => {
      const normalized = mediaIds.filter(Boolean);
      if (!normalized.length) return;

      setHistory(prev => {
        const isDuplicate = prev.some(entry => (
          entry.mediaIds.length === normalized.length &&
          entry.mediaIds.every((id, index) => id === normalized[index])
        ));

        if (isDuplicate) {
          return prev;
        }

        const next = [
          { timestamp: new Date().toISOString(), mediaIds: normalized },
          ...prev,
        ].slice(0, 50);
        persistHistory(next);
        return next;
      });
    },
    [persistHistory]
  );

  const handleMediaParams = useCallback(
    async (mediaIdsParam: string | null, urlsParam: string | null) => {
      try {
        if (mediaIdsParam) {
          const parsed = JSON.parse(decodeURIComponent(mediaIdsParam));
          if (Array.isArray(parsed) && parsed.every(value => typeof value === 'string')) {
            const ids = parsed.filter(Boolean);
            if (ids.length) {
              const resolved = await resolveMediaByIds(ids);
              applyCurrentMedia(resolved);
              setViewMode('main');
              setFocusViewActive(false);
              setSelectedMediaId(null);
              addHistoryEntry(ids);
            }
          }
          router.replace('/', undefined);
          return;
        }

        if (urlsParam) {
          const parsed = JSON.parse(decodeURIComponent(urlsParam));
          if (Array.isArray(parsed)) {
            const remoteUrls = parsed.filter(
              (value): value is string => typeof value === 'string' && isHttpUrl(value)
            );
            if (remoteUrls.length) {
              const records = await Promise.all(remoteUrls.map(url => saveRemoteMedia(url, userId)));
              const ids = records.map(record => record.id);
              if (ids.length) {
                const resolved = await resolveMediaByIds(ids);
                applyCurrentMedia(resolved);
                setViewMode('main');
                setFocusViewActive(false);
                setSelectedMediaId(null);
                addHistoryEntry(ids);
              }
            }
          }
          router.replace('/', undefined);
        }
      } catch (error) {
        console.error('Failed to process media parameters', error);
        router.replace('/', undefined);
      }
    },
    [addHistoryEntry, applyCurrentMedia, resolveMediaByIds, router, userId]
  );

  useEffect(() => {
    const mediaIdsParam = searchParams.get('mediaIds');
    const urlsParam = searchParams.get('urls');
    if (mediaIdsParam || urlsParam) {
      void handleMediaParams(mediaIdsParam, urlsParam);
    }
  }, [handleMediaParams, searchParams]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const storedFavorites = localStorage.getItem(FAVORITES_KEY);
        if (storedFavorites) {
          const parsed = JSON.parse(storedFavorites);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.filter((value: unknown): value is string => typeof value === 'string');
            if (isMounted) {
              setFavoritesState(sanitized);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load favorites from storage', error);
      }

      let parsedHistory: HistoryEntry[] = [];
      try {
        const storedHistory = localStorage.getItem(HISTORY_KEY);
        if (storedHistory) {
          const raw = JSON.parse(storedHistory);
          if (Array.isArray(raw)) {
            parsedHistory = raw.filter((entry: unknown): entry is HistoryEntry => {
              return (
                typeof entry === 'object' &&
                entry !== null &&
                typeof (entry as HistoryEntry).timestamp === 'string' &&
                Array.isArray((entry as HistoryEntry).mediaIds) &&
                (entry as HistoryEntry).mediaIds.every(id => typeof id === 'string')
              );
            });
          }
        }
      } catch (error) {
        console.error('Failed to load history from storage', error);
        parsedHistory = [];
      }

      if (!parsedHistory.length) {
        try {
          const legacyRaw = localStorage.getItem(LEGACY_HISTORY_KEY);
          if (legacyRaw) {
            const legacyEntries = JSON.parse(legacyRaw);
            if (Array.isArray(legacyEntries)) {
              const migrated: HistoryEntry[] = [];

              for (const entry of legacyEntries) {
                if (!entry || typeof entry !== 'object') continue;

                const urls = Array.isArray((entry as { urls?: unknown }).urls)
                  ? (entry as { urls: unknown[] }).urls.filter(
                      (value): value is string => typeof value === 'string' && isHttpUrl(value)
                    )
                  : [];
                if (!urls.length) continue;

                const records = await Promise.all(urls.map(url => saveRemoteMedia(url, userId)));
                const mediaIds = records.map(record => record.id);
                if (!mediaIds.length) continue;

                migrated.push({
                  timestamp:
                    typeof (entry as { timestamp?: unknown }).timestamp === 'string'
                      ? (entry as { timestamp: string }).timestamp
                      : new Date().toISOString(),
                  mediaIds,
                });
              }

              if (migrated.length) {
                parsedHistory = migrated;
                persistHistory(migrated);
                localStorage.removeItem(LEGACY_HISTORY_KEY);
              }
            }
          }
        } catch (error) {
          console.error('Failed to migrate legacy history', error);
        }
      }

      if (isMounted) {
        setHistory(parsedHistory);
      }

      if (isMounted && parsedHistory.length) {
        try {
          const resolved = await resolveMediaByIds(parsedHistory[0].mediaIds);
          if (isMounted) {
            applyCurrentMedia(resolved);
            setViewMode('main');
            setFocusViewActive(false);
            setSelectedMediaId(null);
          }
        } catch (error) {
          console.error('Failed to restore last viewed media batch', error);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [applyCurrentMedia, persistHistory, resolveMediaByIds, userId]);

  const handleToggleFavorite = useCallback(
    (mediaId: string) => {
      setFavoritesState(prev => {
        const nextFavorites = prev.includes(mediaId)
          ? prev.filter(id => id !== mediaId)
          : [...prev, mediaId];

        persistFavorites(nextFavorites);

        if (viewMode === 'favorites') {
          void (async () => {
            const resolved = await resolveMediaByIds(nextFavorites);
            applyCurrentMedia(resolved);
            if (!nextFavorites.includes(mediaId)) {
              setSelectedMediaId(current => (current === mediaId ? null : current));
            }
          })();
        }

        return nextFavorites;
      });
    },
    [applyCurrentMedia, persistFavorites, resolveMediaByIds, viewMode]
  );

  const loadBatchFromHistory = useCallback(
    async (mediaIds: string[]) => {
      const resolved = await resolveMediaByIds(mediaIds);
      applyCurrentMedia(resolved);
      setViewMode('main');
      setFocusViewActive(false);
      setSelectedMediaId(null);
    },
    [applyCurrentMedia, resolveMediaByIds]
  );

  const showFavorites = useCallback(async () => {
    if (!favorites.length) return;
    const resolved = await resolveMediaByIds(favorites);
    applyCurrentMedia(resolved);
    setViewMode('favorites');
    setFocusViewActive(false);
    setSelectedMediaId(null);
  }, [applyCurrentMedia, favorites, resolveMediaByIds]);

  const handleSelectVideoForFocus = useCallback((mediaId: string) => {
    setSelectedMediaId(mediaId);
  }, []);

  const handleBackToGrid = useCallback(() => {
    setSelectedMediaId(null);
  }, []);

  const handleSaveMediaEdits = useCallback(
    async (id: string, updates: MediaUpdates) => {
      try {
        const updated = await updateMedia(id, updates);
        if (!updated) return;

        let src = objectUrlCacheRef.current.get(id);
        if (!src) {
          src = await getMediaSource(updated as MediaRecordWithBlob);
          if (src.startsWith('blob:')) {
            objectUrlCacheRef.current.set(id, src);
          }
        }

        setCurrentMedia(prev =>
          prev.map(item => (item.id === id ? { id, src: src ?? item.src, record: { ...item.record, ...updated } } : item))
        );
      } catch (error) {
        console.error('Failed to save media edits', error);
      }
    },
    []
  );

  const renderHistoryButtons = useCallback(
    (items: HistoryEntry[], gridClasses = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4') => (
      <div className={gridClasses}>
        {items.map((batch, index) => (
          <button
            key={`${batch.timestamp}-${index}`}
            type="button"
            onClick={() => void loadBatchFromHistory(batch.mediaIds)}
            className="group relative overflow-hidden rounded-lg border bg-card/70 p-4 text-left shadow-lg transition-transform duration-300 ease-in-out hover:scale-105"
          >
            <span className="block text-sm font-semibold text-primary">
              {new Date(batch.timestamp).toLocaleDateString()}
            </span>
            <span className="block text-xs text-muted-foreground">
              {batch.mediaIds.length} videos
            </span>
          </button>
        ))}
      </div>
    ),
    [loadBatchFromHistory]
  );

  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full pt-20">
          <div className="text-center w-full max-w-md mx-auto space-y-4">
            <Loader2 className="mr-2 h-8 w-8 animate-spin inline-block" />
          </div>
        </div>
      );
    }

    const recommendedItems = history.slice(0, 6);

    if (currentMedia.length > 0) {
      const mediaForGrid =
        viewMode === 'favorites'
          ? currentMedia.filter(item => favorites.includes(item.id))
          : currentMedia;

      return (
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-12">
          <VideoGrid
            videos={mediaForGrid}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onFocusViewChange={setFocusViewActive}
            onSelectVideo={handleSelectVideoForFocus}
            selectedMediaId={selectedMediaId}
            onBackToGrid={handleBackToGrid}
            viewMode={viewMode}
            gridSize={gridSize}
            setGridSize={setGridSize}
            isAutoScrolling={isAutoScrolling}
            setIsAutoScrolling={setIsAutoScrolling}
            scrollSpeed={scrollSpeed}
            setScrollSpeed={setScrollSpeed}
            history={history}
            loadBatch={loadBatchFromHistory}
            onSaveMedia={handleSaveMediaEdits}
          />

          {recommendedItems.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Recommended</h2>
              {renderHistoryButtons(
                recommendedItems,
                'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4'
              )}
            </section>
          )}

          {history.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">History</h2>
              {renderHistoryButtons(history)}
            </section>
          )}
        </div>
      );
    }

    return (
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary">bulkshorts</h1>
          <p className="text-muted-foreground mt-2">
            The fastest way to discover and browse short-form video content.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search your history..." className="pl-10" />
        </div>

        {history.length === 0 && (
          <div className="rounded-lg border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            Your recent batches will appear here after you create or upload videos.
          </div>
        )}

        {recommendedItems.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Recommended</h2>
            {renderHistoryButtons(
              recommendedItems,
              'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'
            )}
          </section>
        )}

        {history.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-center">History</h2>
            {renderHistoryButtons(history)}
          </section>
        )}
      </div>
    );
  }, [
    currentMedia,
    favorites,
    gridSize,
    handleBackToGrid,
    handleSaveMediaEdits,
    handleSelectVideoForFocus,
    handleToggleFavorite,
    history,
    isAutoScrolling,
    isLoading,
    loadBatchFromHistory,
    renderHistoryButtons,
    scrollSpeed,
    selectedMediaId,
    viewMode,
  ]);

  const showFooter = !focusViewActive && currentMedia.length === 0;

  return (
    <div className="flex flex-col min-h-screen">
      {!focusViewActive && (
        <header className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold tracking-tight text-primary cursor-pointer">
              bulkshorts
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={showFavorites}
              disabled={favorites.length === 0}
            >
              <Heart className="mr-2" />
              Favorites ({favorites.length})
            </Button>
            {user && (
              <Button variant="outline" asChild>
                <Link href="/account">My Posts</Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/discover">Create Batch</Link>
            </Button>
            {authLoading ? (
              <Button variant="ghost" size="icon" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm text-muted-foreground">{user.email}</span>
                <Button variant="ghost" onClick={logout}>
                  Log Out
                </Button>
              </div>
            ) : (
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
            )}
          </div>
        </header>
      )}

      <main className="flex-grow">{renderContent()}</main>

      {showFooter && (
        <footer className="flex items-center justify-center p-4 border-t">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/discover">Create a New Batch</Link>
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  );
}
