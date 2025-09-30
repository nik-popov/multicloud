'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ResolvedMediaItem } from '@/types/media';
import { VideoPlayer } from './video-player';
import { VideoCard } from './video-card';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';

const gridColsMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
};

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9-_]/g, match => `_${match.charCodeAt(0).toString(16)}`);

export type HistoryEntry = {
  timestamp: string;
  mediaIds: string[];
};

type VideoGridProps = {
  videos: ResolvedMediaItem[];
  selectedMediaId?: string | null;
  onSelectVideo?: (mediaId: string) => void;
  gridSize?: number;
  setGridSize?: (size: number) => void;
  history?: HistoryEntry[];
  loadBatch?: (mediaIds: string[]) => void;
  onBackToGrid?: () => void;
  favorites: string[];
  onToggleFavorite: (mediaId: string) => void;
  onFocusViewChange?: (isFocusView: boolean) => void;
  viewMode?: 'main' | 'favorites';
  isAutoScrolling: boolean;
  setIsAutoScrolling: (isAutoScrolling: boolean) => void;
  scrollSpeed: number;
  setScrollSpeed: (speed: number) => void;
  onSaveMedia?: (
    mediaId: string,
    updates: { title?: string; description?: string; trimStart?: number; trimEnd?: number | null }
  ) => void | Promise<void>;
};

export function VideoGrid({
  videos,
  selectedMediaId,
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

  const view = selectedMediaId ? 'focus' : 'grid';

  useEffect(() => {
    onFocusViewChange?.(view === 'focus');
  }, [view, onFocusViewChange]);

  const videoIds = useMemo(() => videos.map(video => video.id), [videos]);

  const pendingHistory = useMemo(() => {
    if (!history.length || !videoIds.length) return history;
    const consumed = new Set<string>();
    let cursor = 0;

    history.forEach(batch => {
      const ids = batch.mediaIds;
      if (!ids.length) return;
      const slice = videoIds.slice(cursor, cursor + ids.length);
      if (slice.length === ids.length && slice.every((id, index) => id === ids[index])) {
        consumed.add(batch.timestamp);
        cursor += ids.length;
      }
    });

    return history.filter(batch => !consumed.has(batch.timestamp));
  }, [history, videoIds]);

  const handleSelectVideo = useCallback(
    (mediaId: string) => {
      onSelectVideo(mediaId);
    },
    [onSelectVideo]
  );

  const handleLoadNextBatch = useCallback(() => {
    if (pendingHistory.length > 0) {
      const next = pendingHistory[0]?.mediaIds ?? [];
      if (next.length) {
        loadBatch(next);
      }
    }
  }, [pendingHistory, loadBatch]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && view === 'grid') {
        handleLoadNextBatch();
      }
    });

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

  const orderedVideos = useMemo(() => {
    if (!selectedMediaId || view === 'grid') return videos;
    const reordered = [...videos];
    const index = reordered.findIndex(video => video.id === selectedMediaId);
    if (index > -1) {
      const [item] = reordered.splice(index, 1);
      reordered.unshift(item);
    }
    return reordered;
  }, [selectedMediaId, videos, view]);

  useEffect(() => {
    if (view === 'focus' && selectedMediaId) {
      const targetElement = document.getElementById(`video-wrapper-${safeId(selectedMediaId)}`);
      targetElement?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [view, selectedMediaId, orderedVideos]);

  useEffect(() => {
    const scrollAmount = scrollSpeed / 5;
    if (isAutoScrolling) {
      if (view === 'grid' && scrollContainerRef.current) {
        scrollIntervalRef.current = setInterval(() => {
          window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }, 50);
      } else if (view === 'focus' && scrollContainerRef.current) {
        scrollIntervalRef.current = setInterval(() => {
          scrollContainerRef.current?.scrollBy({
            top: scrollContainerRef.current.clientHeight,
            behavior: 'smooth',
          });
        }, Math.max(300, 3000 / Math.max(scrollSpeed / 5, 0.5)));
      }
    } else if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, view, scrollSpeed]);

  const handleScrollDown = useCallback(() => {
    scrollContainerRef.current?.scrollBy({
      top: scrollContainerRef.current.clientHeight,
      behavior: 'smooth',
    });
  }, []);

  const handleScrollUp = useCallback(() => {
    scrollContainerRef.current?.scrollBy({
      top: -scrollContainerRef.current.clientHeight,
      behavior: 'smooth',
    });
  }, []);

  const Controls = () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between w-full">
          <Label htmlFor="auto-scroll" className="text-sm font-medium">
            Auto-Scroll
          </Label>
          <Switch id="auto-scroll" checked={isAutoScrolling} onCheckedChange={setIsAutoScrolling} />
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
            max={6}
            step={1}
            value={[gridSize]}
            onValueChange={value => setGridSize(value[0])}
          />
        </div>
      )}
      <div className="p-0 space-y-2">
        <div className="flex justify-between items-center gap-4">
          <Label htmlFor="scroll-speed" className="flex-shrink-0">
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
    if (view !== 'focus') return undefined;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = orderedVideos.findIndex(video => `video-wrapper-${safeId(video.id)}` === entry.target.id);
          if (index !== -1) {
            setCurrentIndex(index);
          }
        }
      });
    }, { threshold: 0.5 });

    const videoElements = document.querySelectorAll('[data-video-wrapper]');
    videoElements.forEach(el => observer.observe(el));

    return () => {
      videoElements.forEach(el => observer.unobserve(el));
    };
  }, [orderedVideos, view]);

  useEffect(() => {
    if (currentIndex >= orderedVideos.length && orderedVideos.length > 0) {
      setCurrentIndex(orderedVideos.length - 1);
    }
  }, [orderedVideos, currentIndex]);

  if (view === 'focus') {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="fixed top-4 left-4 z-[60] flex flex-col items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackToGrid}
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
          {orderedVideos.map((video, index) => (
            <div
              key={video.id}
              id={`video-wrapper-${safeId(video.id)}`}
              data-video-wrapper
              className="snap-start h-full w-full flex items-center justify-center"
            >
              <VideoPlayer
                src={video.src}
                isLiked={favorites.includes(video.id)}
                onToggleLike={() => onToggleFavorite(video.id)}
                isInView={index === currentIndex}
                controls={<Controls />}
                scrollControls={
                  <div className="flex flex-col items-center gap-4">
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleScrollUp}
                        className="text-white hover:text-primary bg-black/50 md:bg-transparent hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
                      >
                        <ChevronUp className="h-6 w-6" />
                      </Button>
                    )}
                    {index < orderedVideos.length - 1 && (
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
      ) : null}
      <div className="lg:hidden mb-6">
        <Card className="p-4 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <Controls />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-8 items-start">
        <div
          ref={scrollContainerRef}
          className={cn('grid gap-4 md:gap-6', gridColsMap[gridSize] ?? gridColsMap[3])}
        >
          {videos.map((video, index) => {
            const hasMultipleRows = videos.length > gridSize;
            const shouldAutoPlay = !hasMultipleRows || index < videos.length - gridSize;

            return (
              <div key={video.id} id={`video-wrapper-${safeId(video.id)}`} className="w-full">
                <VideoCard
                  src={video.src}
                  onClick={() => handleSelectVideo(video.id)}
                  isLiked={favorites.includes(video.id)}
                  shouldAutoPlay={shouldAutoPlay}
                  playOnHover={!shouldAutoPlay}
                />
              </div>
            );
          })}
        </div>
        <div className="hidden lg:block">
          <Card className="p-4 bg-card/80 backdrop-blur-sm sticky top-4">
            <CardContent className="p-0">
              <Controls />
            </CardContent>
          </Card>
        </div>
      </div>
      {pendingHistory.length > 0 && view === 'grid' && <div ref={loaderRef} className="h-10" />}
    </div>
  );
}
