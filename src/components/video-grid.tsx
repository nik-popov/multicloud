'use client';
import {cn} from '@/lib/utils';
import {VideoPlayer} from './video-player';
import {ArrowLeft, ChevronDown, ChevronUp} from 'lucide-react';
import {useMemo, useEffect, useRef} from 'react';
import {Button} from './ui/button';
import {Separator} from './ui/separator';

type VideoGridProps = {
  urls: string[];
  selectedUrl?: string | null;
  onSelectVideo?: (url: string) => void;
  gridCols?: number;
  history?: any[];
  loadBatch?: (urls: string[]) => void;
  onBackToGrid?: () => void;
  favorites: string[];
  onToggleFavorite: (url: string) => void;
  onFocusViewChange?: (isFocusView: boolean) => void;
  controls?: React.ReactNode;
};

export function VideoGrid({
  urls,
  selectedUrl,
  onSelectVideo = () => {},
  gridCols = 4,
  history = [],
  loadBatch = () => {},
  onBackToGrid = () => {},
  favorites,
  onToggleFavorite,
  onFocusViewChange,
  controls,
}: VideoGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const orderedUrls = useMemo(() => {
    if (!selectedUrl || view === 'grid') return urls;
    const newUrls = [...urls];
    const index = newUrls.indexOf(selectedUrl);
    if (index > -1) {
      const [item] = newUrls.splice(index, 1);
      newUrls.unshift(item);
    }
    return newUrls;
  }, [selectedUrl, urls, view]);

  useEffect(() => {
    if (view === 'focus' && selectedUrl) {
      // Give the DOM a moment to update before scrolling
      setTimeout(() => {
        const element = document.getElementById(`video-wrapper-${selectedUrl}`);
        element?.scrollIntoView({behavior: 'auto', block: 'start'});
      }, 0);
    }
  }, [view, selectedUrl]);

  const currentBatchTimestamp =
    history.find(batch => JSON.stringify(batch.urls) === JSON.stringify(urls))
      ?.timestamp;
  const otherHistory = history.filter(
    batch => batch.timestamp !== currentBatchTimestamp
  );

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

  if (view === 'focus') {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="fixed top-4 left-4 z-[60] flex flex-col gap-4">
          <Button
            variant="secondary"
            onClick={handleBackToGrid}
            aria-label="Back to grid"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Grid
          </Button>
          <div className="w-[200px]">{controls}</div>
        </div>
         {urls.length > 1 && (
          <div
            onClick={handleScrollUp}
            className="fixed top-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-white z-[60] cursor-pointer"
          >
            <ChevronUp className="animate-bounce h-6 w-6" />
            <span className="text-sm uppercase tracking-widest">Scroll</span>
          </div>
        )}
        <div
          ref={scrollContainerRef}
          data-focus-view-container
          className="flex flex-col items-center snap-y snap-mandatory h-full overflow-y-scroll"
        >
          {orderedUrls.map(url => (
            <div
              key={url}
              id={`video-wrapper-${url}`}
              className="snap-start h-full w-full flex items-center justify-center"
            >
              <VideoPlayer
                src={url}
                isFocusView={true}
                isLiked={favorites.includes(url)}
                onToggleLike={() => onToggleFavorite(url)}
              />
            </div>
          ))}
        </div>
        {urls.length > 1 && (
          <div
            onClick={handleScrollDown}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-white z-[60] cursor-pointer"
          >
            <span className="text-sm uppercase tracking-widest">Scroll</span>
            <ChevronDown className="animate-bounce h-6 w-6" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-8">Video Discoveries</h2>
      <div
        ref={scrollContainerRef}
        className="grid gap-6"
        style={{gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}}
      >
        {urls.map(url => (
          <div key={url} id={`video-wrapper-${url}`} className="w-full">
            <VideoPlayer
              src={url}
              onClick={() => handleSelectVideo(url)}
              isFocusView={false}
              isLiked={favorites.includes(url)}
              onToggleLike={() => onToggleFavorite(url)}
            />
          </div>
        ))}
      </div>
      {otherHistory.length > 0 && view === 'grid' && (
        <div className="mt-16 text-center">
          <Separator className="my-8" />
          <h3 className="text-xl font-semibold mb-2">
            Next Batch: {new Date(otherHistory[0].timestamp).toLocaleString()}
          </h3>
          <p className="text-muted-foreground mb-4">
            {otherHistory[0].urls.length} videos
          </p>
          <Button onClick={() => loadBatch(otherHistory[0].urls)}>
            Load Next Batch
          </Button>
        </div>
      )}
    </div>
  );
}
