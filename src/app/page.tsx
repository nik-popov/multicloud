
'use client';

import { UrlProcessor } from '@/components/url-processor';
import { Button } from '@/components/ui/button';
import { VideoGrid } from '@/components/video-grid';
import { Heart, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';


export default function Home() {
  const [currentUrls, setCurrentUrls] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'main' | 'favorites'>('main');
  const [focusViewActive, setFocusViewActive] = useState(false);
  const [selectedUrlForFocus, setSelectedUrlForFocus] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [gridSize, setGridSize] = useState(3);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  useEffect(() => {
    const storedFavorites = localStorage.getItem('bulkshorts_favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
    const storedHistory = localStorage.getItem('bulkshorts_history');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  const handleToggleFavorite = (url: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(url)
        ? prev.filter(u => u !== url)
        : [...prev, url];
      localStorage.setItem('bulkshorts_favorites', JSON.stringify(newFavorites));
      if (viewMode === 'favorites' && !newFavorites.includes(url)) {
        setCurrentUrls(newFavorites);
      }
      return newFavorites;
    });
  }
  
  const handleProcessStart = () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setCurrentUrls([]);
    setViewMode('main');
    setSelectedUrlForFocus(null);
  };
  
  const handleProcessComplete = (processedUrls: string[]) => {
    setCurrentUrls(processedUrls);
    setIsProcessing(false);
    
    if (processedUrls.length > 0) {
      const newBatch = {
        timestamp: new Date().toISOString(),
        urls: processedUrls
      };
      const updatedHistory = [newBatch, ...history].slice(0, 50); // Limit history size
      setHistory(updatedHistory);
      localStorage.setItem('bulkshorts_history', JSON.stringify(updatedHistory));
    }
  };

  const handleNewBatch = () => {
    setCurrentUrls([]);
    setViewMode('main');
    setFocusViewActive(false);
    setSelectedUrlForFocus(null);
    setIsProcessing(false);
  };
  
  const loadBatchFromHistory = (urls: string[]) => {
    setCurrentUrls(prevUrls => [...prevUrls, ...urls]);
    setViewMode('main');
    setFocusViewActive(false);
    setSelectedUrlForFocus(null);
    setIsProcessing(false);
  }

  const showFavorites = () => {
    if (favorites.length > 0) {
      setCurrentUrls(favorites);
      setViewMode('favorites');
      setFocusViewActive(false);
      setSelectedUrlForFocus(null);
      setIsProcessing(false);
    }
  }

  const handleSelectVideoForFocus = (url: string) => {
    const urlsForFocus = viewMode === 'favorites' ? favorites : currentUrls ?? [];
    setCurrentUrls(urlsForFocus);
    setSelectedUrlForFocus(url);
  };
  
  const handleBackToGrid = () => {
    setSelectedUrlForFocus(null);
  }

  const renderContent = () => {
    if (isProcessing) {
      return (
        <UrlProcessor
            onProcessStart={handleProcessStart}
            onProcessComplete={handleProcessComplete}
            onProgress={setProcessingProgress}
            isProcessing={isProcessing}
            processingProgress={processingProgress}
            history={history}
            loadBatch={(urls: string[]) => {
              setCurrentUrls(urls);
              setIsProcessing(false);
            }}
          />
      );
    }

    if (currentUrls.length > 0) {
      const urlsForGrid = viewMode === 'favorites' ? favorites : currentUrls;

      return (
        <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            {viewMode === 'favorites' && <h2 className="text-3xl font-bold text-center mb-8">My Collection</h2>}
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

    return (
       <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <UrlProcessor
            onProcessStart={handleProcessStart}
            onProcessComplete={handleProcessComplete}
            onProgress={setProcessingProgress}
            isProcessing={isProcessing}
            processingProgress={processingProgress}
            history={history}
            loadBatch={(urls: string[]) => {
              setCurrentUrls(urls);
              setIsProcessing(false);
            }}
          />
       </div>
    );
  }

  return (
      <div className="flex flex-col h-screen">
        {!focusViewActive && (
          <header className="flex items-center justify-between p-4 border-b shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold tracking-tight text-primary cursor-pointer" onClick={handleNewBatch}>
                bulkshorts
              </h1>
            </div>
             <div className="flex items-center gap-2">
                {!isMobile && (
                  <Button variant="secondary" onClick={handleNewBatch}>
                    New Batch
                  </Button>
                )}
                <Button variant="outline" onClick={showFavorites} disabled={favorites.length === 0}>
                    <Heart className="mr-2" />
                    Collection ({favorites.length})
                </Button>
            </div>
          </header>
        )}

        <main className="flex-grow overflow-y-auto">
          {renderContent()}
        </main>
        
        {!focusViewActive && !isProcessing && currentUrls.length === 0 && (
          <footer className="flex items-center justify-center p-4 border-t shrink-0">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
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
          </footer>
        )}
      </div>
  );
}
