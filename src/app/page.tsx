'use client';

import { UrlProcessor } from '@/components/url-processor';
import { Button } from '@/components/ui/button';
import { VideoGrid } from '@/components/video-grid';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [showProcessor, setShowProcessor] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [currentUrls, setCurrentUrls] = useState<string[] | undefined>(undefined);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'main' | 'favorites'>('main');

  useEffect(() => {
    const storedFavorites = localStorage.getItem('bulkshorts_favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  const handleToggleFavorite = (url: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(url)
        ? prev.filter(u => u !== url)
        : [...prev, url];
      localStorage.setItem('bulkshorts_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }

  const handleShowProcessor = () => {
    setShowProcessor(true);
    setCurrentUrls([]);
    setViewMode('main');
  };

  const handleNewBatch = () => {
    setShowProcessor(false);
    setCurrentUrls(undefined);
    setViewMode('main');
  };
  
  const loadBatchFromHistory = (urls: string[]) => {
    setCurrentUrls(urls);
    if (!showProcessor) {
      setShowProcessor(true);
    }
    setViewMode('main');
  }

  const showFavorites = () => {
    if (favorites.length > 0) {
      setCurrentUrls(favorites);
      setShowProcessor(true);
      setViewMode('favorites');
    }
  }

  const renderContent = () => {
    if (viewMode === 'favorites') {
      return (
        <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            <h2 className="text-3xl font-bold text-center mb-8">My Collection</h2>
            <VideoGrid
                urls={favorites}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
        </div>
      );
    }
    return (
      <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <UrlProcessor
          showForm={!showProcessor}
          onProcessStart={handleShowProcessor}
          setHistory={setHistory}
          history={history}
          initialUrls={currentUrls}
          loadBatch={loadBatchFromHistory}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    );
  }

  return (
      <div className="flex flex-col h-screen">
        <header className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              bulkshorts
            </h1>
            <Button variant="secondary" onClick={handleNewBatch}>
              New Batch
            </Button>
            <Button variant="outline" onClick={showFavorites} disabled={favorites.length === 0}>
                <Heart className="mr-2" />
                Collection ({favorites.length})
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground hidden sm:block">
              Sources:
            </p>
            <Button variant="outline" disabled>
              Reddit
            </Button>
            <Button variant="outline" disabled>
              X
            </Button>
            <Button variant="outline" disabled>
              IG
            </Button>
            <Button variant="outline" disabled>
              YouTube
            </Button>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto">
          {renderContent()}
        </main>
      </div>
  );
}
