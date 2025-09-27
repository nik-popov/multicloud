'use client';
import {cn} from '@/lib/utils';
import {VideoPlayer} from './video-player';
import {ArrowLeft, ChevronDown} from 'lucide-react';
import {useMemo, useEffect, useRef} from 'react';
import {Card, CardHeader, CardTitle, CardContent} from './ui/card';
import {Button} from './ui/button';
import { Separator } from './ui/separator';

type VideoGridProps = {
  urls: string[];
  view?: 'grid' | 'focus';
  selectedUrl?: string | null;
  onSelectVideo?: (url: string) => void;
  gridCols?: number;
  history?: any[];
  loadBatch?: (urls: string[]) => void;
  onBackToGrid?: () => void;
  favorites: string[];
  onToggleFavorite: (url: string) => void;
};

export function VideoGrid({
  urls,
  view = 'grid',
  selectedUrl,
  onSelectVideo = () => {},
  gridCols = 4,
  history = [],
  loadBatch = () => {},
  onBackToGrid = () => {},
  favorites,
  onToggleFavorite,
}: VideoGridProps) {
  const isGridView = view === 'grid';
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const orderedUrls = useMemo(() => {
    if (!selectedUrl || isGridView) return urls;
    const newUrls = [...urls];
    const index = newUrls.indexOf(selectedUrl);
    if (index > -1) {
      const [item] = newUrls.splice(index, 1);
      newUrls.unshift(item);
    }
    return newUrls;
  }, [selectedUrl, urls, isGridView]);

  useEffect(() => {
    if (view === 'focus' && selectedUrl) {
      const element = document.getElementById(`video-wrapper-${selectedUrl}`);
      element?.scrollIntoView({behavior: 'smooth', block: 'start'});
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
  
  if (view === 'focus') {
    return (
      <div className="relative h-screen">
        <Button
            variant="secondary"
            onClick={onBackToGrid}
            className="fixed top-24 left-4 z-50"
            aria-label="Back to grid"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Grid
        </Button>
        <div
          ref={scrollContainerRef}
          data-focus-view-container
          className="flex flex-col items-center snap-y snap-mandatory h-full overflow-y-scroll"
        >
          {orderedUrls.map(url => (
            <div
              key={url}
              id={`video-wrapper-${url}`}
              className='snap-start h-full w-full flex items-center justify-center p-4'
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
            className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-white z-10 cursor-pointer"
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
        className='grid gap-6'
        style={{gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}}
      >
        {urls.map(url => (
          <div
            key={url}
            id={`video-wrapper-${url}`}
            className='w-full'
          >
            <VideoPlayer
              src={url}
              onClick={() => onSelectVideo(url)}
              isFocusView={false}
              isLiked={favorites.includes(url)}
              onToggleLike={() => onToggleFavorite(url)}
            />
          </div>
        ))}
      </div>
      {otherHistory.length > 0 && isGridView && (
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
