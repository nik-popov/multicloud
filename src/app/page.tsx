'use client';

import {Button} from '@/components/ui/button';
import {VideoGrid} from '@/components/video-grid';
import {Heart, Search} from 'lucide-react';
import Link from 'next/link';
import {useEffect, useState, Suspense, useCallback} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';

import {Input} from '@/components/ui/input';
import {VideoCard} from '@/components/video-card';
import {Loader2} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type HistoryItem = {
  timestamp: string;
  urls: string[];
};

function HomePageContent() {
  const [currentUrls, setCurrentUrls] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavoritesState] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'main' | 'favorites'>('main');
  const [focusViewActive, setFocusViewActive] = useState(false);
  const [selectedUrlForFocus, setSelectedUrlForFocus] = useState<string | null>(
    null
  );
  const [gridSize, setGridSize] = useState(3);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, logout } = useAuth();

  const handleUrlParam = useCallback((urlsParam: string | null) => {
    if (urlsParam) {
      try {
        const decodedUrls = JSON.parse(decodeURIComponent(urlsParam));
        setCurrentUrls(decodedUrls);
        if (decodedUrls.length > 0) {
          const newBatch: HistoryItem = {
            timestamp: new Date().toISOString(),
            urls: decodedUrls,
          };
          setHistory(prevHistory => {
            const isDuplicate = prevHistory.some(
              batch => JSON.stringify(batch.urls) === JSON.stringify(decodedUrls)
            );
            if (isDuplicate) {
              return prevHistory;
            }
            const updatedHistory = [newBatch, ...prevHistory].slice(0, 50);
            const persistentHistory = updatedHistory.filter(
              batch => !batch.urls.some(url => url.startsWith('blob:'))
            );
            localStorage.setItem('bulkshorts_history', JSON.stringify(persistentHistory));
            return updatedHistory;
          });
        }
        // Use replace to remove the query param from the URL without reloading
        router.replace('/', undefined);
      } catch (e) {
        console.error('Failed to parse URLs from query param', e);
        router.replace('/', undefined);
      }
    }
  }, [router]);


  // Effect for handling URL parameters
  useEffect(() => {
    const urlsParam = searchParams.get('urls');
    if (urlsParam) {
        handleUrlParam(urlsParam);
    }
  }, [searchParams, handleUrlParam]);

  // Effect for loading initial data from storage
  useEffect(() => {
    function loadInitialData() {
      try {
        const localFavorites = localStorage.getItem('bulkshorts_favorites');
        if (localFavorites) {
          const parsedFavorites = JSON.parse(localFavorites);
          if (Array.isArray(parsedFavorites)) {
            const sanitizedFavorites = parsedFavorites.filter(
              (fav: unknown): fav is string =>
                typeof fav === 'string' && !fav.startsWith('blob:')
            );
            setFavoritesState(sanitizedFavorites);
          } else {
            setFavoritesState([]);
          }
        } else {
          setFavoritesState([]);
        }
      } catch (error) {
        console.error('Failed to load favorites from storage', error);
        setFavoritesState([]);
      }

      try {
        const localHistory = localStorage.getItem('bulkshorts_history');
        if (localHistory) {
          const parsedHistory = JSON.parse(localHistory);
          if (Array.isArray(parsedHistory)) {
            setHistory(parsedHistory);
          } else {
            setHistory([]);
          }
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error('Failed to load history from storage', error);
        setHistory([]);
      }

      setIsLoading(false);
    }

    loadInitialData();
  }, []);

  const handleToggleFavorite = (url: string) => {
    setFavoritesState(prev => {
      const newFavorites = prev.includes(url)
        ? prev.filter(u => u !== url)
        : [...prev, url];

      const persistentFavorites = newFavorites.filter(fav => !fav.startsWith('blob:'));
      localStorage.setItem('bulkshorts_favorites', JSON.stringify(persistentFavorites));

      if (viewMode === 'favorites' && !newFavorites.includes(url)) {
        setCurrentUrls(newFavorites);
      }
      return newFavorites;
    });
  };

  const loadBatchFromHistory = (urls: string[]) => {
    setCurrentUrls(prevUrls => {
      if (JSON.stringify(prevUrls.slice(0, urls.length)) === JSON.stringify(urls)) {
        return prevUrls;
      }
      return [...urls, ...prevUrls]
    });
    setViewMode('main');
    setFocusViewActive(false);
    setSelectedUrlForFocus(null);
  };

  const showFavorites = () => {
    if (favorites.length > 0) {
      setCurrentUrls(favorites);
      setViewMode('favorites');
      setFocusViewActive(false);
      setSelectedUrlForFocus(null);
    }
  };

  const handleSelectVideoForFocus = (url: string) => {
    const urlsForFocus =
      viewMode === 'favorites' ? favorites : currentUrls ?? [];
    setCurrentUrls(urlsForFocus);
    setSelectedUrlForFocus(url);
  };

  const handleBackToGrid = () => {
    setSelectedUrlForFocus(null);
  };

  const renderContent = () => {
    if (isLoading) {
       return (
        <div className="flex flex-col items-center justify-center h-full pt-20">
          <div className="text-center w-full max-w-md mx-auto space-y-4">
            <Loader2 className="mr-2 h-8 w-8 animate-spin inline-block" />
          </div>
        </div>
      );
    }

    if (currentUrls.length > 0) {
      const urlsForGrid = viewMode === 'favorites' ? favorites : currentUrls;

      return (
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <VideoGrid
            urls={urlsForGrid}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onFocusViewChange={setFocusViewActive}
            onSelectVideo={handleSelectVideoForFocus}
            selectedUrl={selectedUrlForFocus}
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
          />
        </div>
      );
    }

    const recommendedItems = history.slice(0, 6);

    return (
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-primary">bulkshorts</h1>
            <p className="text-muted-foreground mt-2">The fastest way to discover and browse short-form video content.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search your history..." className="pl-10" />
        </div>

        {recommendedItems.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Recommended</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendedItems.map((batch, index) => (
                <div
                  key={`rec-${index}`}
                  className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105"
                  onClick={() => loadBatchFromHistory(batch.urls)}
                >
                  <div className="absolute inset-0 bg-black/50 transition-opacity duration-300 group-hover:bg-black/20 z-10" />
                  <div className="absolute bottom-0 left-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="font-bold text-white text-lg">
                      {new Date(batch.timestamp).toLocaleDateString()}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {batch.urls.length} videos
                    </p>
                  </div>
                  <VideoCard src={batch.urls[0]} isHistoryCard={true} />
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">History</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {history.map((batch, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105"
                  onClick={() => loadBatchFromHistory(batch.urls)}
                >
                  <div className="absolute inset-0 bg-black/50 transition-opacity duration-300 group-hover:bg-black/20 z-10" />
                  <div className="absolute bottom-0 left-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="font-bold text-white text-lg">
                      {new Date(batch.timestamp).toLocaleDateString()}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {batch.urls.length} videos
                    </p>
                  </div>
                  <VideoCard src={batch.urls[0]} isHistoryCard={true} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const showFooter = !focusViewActive && currentUrls.length === 0;

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
              Favorites {`(${favorites.length})`}
            </Button>
            <Button asChild>
                <Link href="/discover">Create Batch</Link>
            </Button>
            {authLoading ? (
              <Button variant="ghost" size="icon" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  {user.email}
                </span>
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
