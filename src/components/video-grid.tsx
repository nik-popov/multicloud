'use client';
import {cn} from '@/lib/utils';
import {VideoPlayer} from './video-player';
import {ChevronDown} from 'lucide-react';
import {useMemo, useEffect, useRef} from 'react';
import {Card, CardHeader, CardTitle, CardContent} from './ui/card';
import {Button} from './ui/button';

type VideoGridProps = {
  urls: string[];
  view: 'grid' | 'focus';
  selectedUrl: string | null;
  onSelectVideo: (url: string) => void;
  gridCols?: number;
  history: any[];
  loadBatch: (urls: string[]) => void;
};

export function VideoGrid({
  urls,
  view,
  selectedUrl,
  onSelectVideo,
  gridCols = 4,
  history = [],
  loadBatch,
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-8">Video Discoveries</h2>
      <div
        ref={scrollContainerRef}
        className={cn(
          'gap-6',
          isGridView
            ? 'grid'
            : 'flex flex-col items-center snap-y snap-mandatory h-screen overflow-y-scroll'
        )}
        style={
          isGridView
            ? {gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}
            : {}
        }
      >
        {(isGridView ? urls : orderedUrls).map(url => (
          <div
            key={url}
            id={`video-wrapper-${url}`}
            className={cn(
              'w-full',
              !isGridView &&
                'snap-start h-screen flex items-center justify-center'
            )}
          >
            <VideoPlayer
              src={url}
              onClick={() => onSelectVideo(url)}
              isFocusView={!isGridView}
            />
          </div>
        ))}
      </div>
      {otherHistory.length > 0 && isGridView && (
        <div className="mt-16">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Continue Browsing?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-muted-foreground">
                You've reached the end of this batch. Select another batch from
                your history to continue.
              </p>
              {otherHistory.slice(0, 5).map(batch => (
                <Button
                  key={batch.timestamp}
                  variant="secondary"
                  onClick={() => loadBatch(batch.urls)}
                >
                  {new Date(batch.timestamp).toLocaleString()} ({batch.urls.length}{' '}
                  videos)
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
      {!isGridView && urls.length > 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-white pointer-events-none z-10">
          <span className="text-sm uppercase tracking-widest">Scroll</span>
          <ChevronDown className="animate-bounce h-6 w-6" />
        </div>
      )}
    </div>
  );
}
