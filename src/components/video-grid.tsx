
'use client';
import {cn} from '@/lib/utils';
import {VideoPlayer} from './video-player';
import {ArrowLeft, ChevronDown, ChevronUp} from 'lucide-react';
import {useMemo, useEffect, useRef, useCallback, useState} from 'react';
import {Button} from './ui/button';
import { VideoCard } from './video-card';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';

type VideoGridProps = {
  urls: string[];
  selectedUrl?: string | null;
  onSelectVideo?: (url: string) => void;
  gridSize?: number;
  setGridSize?: (size: number) => void;
  history?: any[];
  loadBatch?: (urls: string[]) => void;
  onBackToGrid?: () => void;
  favorites: string[];
  onToggleFavorite: (url: string) => void;
  onFocusViewChange?: (isFocusView: boolean) => void;
  viewMode?: 'main' | 'favorites';
  isAutoScrolling: boolean;
  setIsAutoScrolling: (isAutoScrolling: boolean) => void;
  scrollSpeed: number;
  setScrollSpeed: (speed: number) => void;
};

const safeId = (id: string) => {
  return id.replace(/[^a-zA-Z0-9-_]/g, (match) => {
      return `_${match.charCodeAt(0).toString(16)}`;
  });
};

const gridColsMap: {[key: number]: string} = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
  7: 'lg:grid-cols-7',
  8: 'lg:grid-cols-8',
};


export function VideoGrid({
  urls,
  selectedUrl,
  onSelectVideo = () => {},
  gridSize = 4,
  setGridSize = () => {},
  history = [],
  loadBatch = () => {},
  onBackToGrid = () => {},
  favorites,
  onToggleFavorite,
  onFocusViewChange,
  viewMode,
  isAutoScrolling,
  setIsAutoScrolling,
  scrollSpeed,
  setScrollSpeed,
}: VideoGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const view = selectedUrl ? 'focus' : 'grid';

  useEffect(() => {
    onFocusViewChange?.(view === 'focus');
  }, [view, onFocusViewChange]);

  const handleSelectVideo = (url: string) => {
    onSelectVideo(url);
  };

  const handleBackToGrid = () => {
    onBackToGrid();
  };
      
  const loadedTimestamps = useMemo(() => {
    const timestamps = new Set<string>();
    let currentUrlsIndex = 0;
    history.forEach(batch => {
      const batchUrls = batch.urls;
      if (currentUrlsIndex + batchUrls.length <= urls.length) {
        const sliceOfUrls = urls.slice(currentUrlsIndex, currentUrlsIndex + batchUrls.length);
        if (JSON.stringify(sliceOfUrls) === JSON.stringify(batchUrls)) {
          timestamps.add(batch.timestamp);
          currentUrlsIndex += batchUrls.length;
        }
      }
    });
    return timestamps;
  }, [urls, history]);


  const otherHistory = history.filter(
    batch => !loadedTimestamps.has(batch.timestamp)
  );
  
  const handleLoadNextBatch = useCallback(() => {
    if (otherHistory.length > 0) {
      loadBatch(otherHistory[0].urls);
    }
  }, [otherHistory, loadBatch]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && view === 'grid') {
          handleLoadNextBatch();
        }
      },
      { threshold: 1.0 }
    );

    const loader = loaderRef.current;
    if (loader) {
      observer.observe(loader);
    }

    return () => {
      if (loader) {
        observer.unobserve(loader);
      }
    };
  }, [handleLoadNextBatch, view]);

  const orderedUrls = useMemo(() => {
    if (!selectedUrl || view === 'grid') return urls;
    const currentUrls = viewMode === 'favorites' ? favorites : urls;
    const newUrls = [...currentUrls];
    const index = newUrls.indexOf(selectedUrl);
    if (index > -1) {
      const [item] = newUrls.splice(index, 1);
      newUrls.unshift(item);
    }
    return newUrls;
  }, [selectedUrl, urls, view, viewMode, favorites]);


  useEffect(() => {
    if (view === 'focus' && selectedUrl) {
      const targetElement = document.getElementById(`video-wrapper-${safeId(selectedUrl)}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    }
  }, [view, selectedUrl, orderedUrls]);

    useEffect(() => {
    const scrollAmount = scrollSpeed / 5;
    if (isAutoScrolling) {
      if (view === 'grid' && scrollContainerRef.current) {
        scrollIntervalRef.current = setInterval(() => {
          window.scrollBy({top: scrollAmount, behavior: 'smooth'});
        }, 50);
      } else if (view === 'focus' && scrollContainerRef.current) {
        scrollIntervalRef.current = setInterval(() => {
          scrollContainerRef.current?.scrollBy({top: scrollContainerRef.current.clientHeight, behavior: 'smooth'});
        }, 3000 / (scrollSpeed / 5)); // Adjust timing based on speed
      }
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    }
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, view, scrollSpeed, scrollContainerRef]);

  const handleScrollDown = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        top: scrollContainerRef.current.clientHeight,
        behavior: 'smooth',
      });
    }
  };
  
  const handleScrollUp = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        top: -scrollContainerRef.current.clientHeight,
        behavior: 'smooth',
      });
    }
  };

  const Controls = () => (
     <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <Label
              htmlFor="auto-scroll"
              className="text-sm font-medium"
            >
              Auto-Scroll
            </Label>
            <Switch
              id="auto-scroll"
              checked={isAutoScrolling}
              onCheckedChange={setIsAutoScrolling}
              aria-label="Toggle auto-scroll"
            />
          </div>
        </div>

        {view === 'grid' && (
          <div className="p-0 space-y-2">
            <div className="flex justify-between items-center gap-4">
              <Label htmlFor="grid-size" className="flex-shrink-0">
                Grid Size
              </Label>
              <span className="text-sm font-medium">{gridSize}</span>
            </div>
            <Slider
              id="grid-size"
              min={1}
              max={8}
              step={1}
              value={[gridSize]}
              onValueChange={value => setGridSize(value[0])}
            />
          </div>
        )}
        <div className="p-0 space-y-2">
          <div className="flex justify-between items-center gap-4">
            <Label
              htmlFor="scroll-speed"
              className="flex-shrink-0"
            >
              Scroll Speed
            </Label>
            <span className="text-sm font-medium">{scrollSpeed}</span>
          </div>
          <Slider
            id="scroll-speed"
            min={1}
            max={10}
            step={1}
            value={[scrollSpeed]}
            onValueChange={value => setScrollSpeed(value[0])}
          />
        </div>
      </div>
  );

  useEffect(() => {
    if (view === 'focus') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const index = orderedUrls.findIndex(
                (url) => `video-wrapper-${safeId(url)}` === entry.target.id
              );
              if (index !== -1) {
                setCurrentIndex(index);
              }
            }
          });
        },
        { threshold: 0.5 }
      );
  
      const videoElements = document.querySelectorAll('[data-video-wrapper]');
      videoElements.forEach((el) => observer.observe(el));
  
      return () => {
        videoElements.forEach((el) => observer.unobserve(el));
      };
    }
  }, [orderedUrls, view]);
  
  useEffect(() => {
    if (currentIndex >= orderedUrls.length && orderedUrls.length > 0) {
      setCurrentIndex(orderedUrls.length - 1);
    }
  }, [orderedUrls, currentIndex]);

  if (view === 'focus') {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="fixed top-4 left-4 z-[60] flex flex-col items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToGrid}
            aria-label="Back to grid"
            className="bg-black/30 text-white hover:bg-black/50 hover:text-white backdrop-blur-sm rounded-full w-12 h-12"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>
        <div
          ref={scrollContainerRef}
          data-focus-view-container
          className="flex flex-col items-center snap-y snap-mandatory h-full overflow-y-scroll"
        >
          {orderedUrls.map((url, index) => (
            <div
              key={url}
              id={`video-wrapper-${safeId(url)}`}
              data-video-wrapper
              className="snap-start h-full w-full flex items-center justify-center"
            >
              <VideoPlayer
                src={url}
                isLiked={favorites.includes(url)}
                onToggleLike={() => onToggleFavorite(url)}
                isInView={index === currentIndex}
                controls={
                  <Controls />
                }
                scrollControls={
                  <div className="flex flex-col items-center gap-4">
                    {orderedUrls.indexOf(url) > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleScrollUp}
                        className="text-white hover:text-primary bg-black/50 md:bg-transparent hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
                      >
                        <ChevronUp className="h-6 w-6" />
                      </Button>
                    )}
                     {orderedUrls.indexOf(url) < orderedUrls.length - 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleScrollDown}
                        className="text-white hover:text-primary bg-black/50 md:bg-transparent hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
                      >
                        <ChevronDown className="h-6 w-6" />
                      </Button>
                    )}
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {viewMode === 'favorites' ? (
        <h2 className="text-2xl font-bold text-center mb-8">My Favorites</h2>
      ) : null }
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          <div className="sticky top-4 h-min hidden md:block">
            <Card className="p-4 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <Controls />
              </CardContent>
            </Card>
          </div>
        <div
          ref={scrollContainerRef}
          className={cn("grid gap-4 md:gap-6", `grid-cols-2`, gridColsMap[gridSize])}
        >
          {urls.map(url => (
            <div key={url} id={`video-wrapper-${safeId(url)}`} className="w-full">
              <VideoCard
                src={url}
                onClick={() => handleSelectVideo(url)}
                isLiked={favorites.includes(url)}
              />
            </div>
          ))}
        </div>
      </div>
      {otherHistory.length > 0 && view === 'grid' && (
        <div ref={loaderRef} className="h-10" />
      )}
    </div>
  );
}
