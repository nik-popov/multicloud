
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode, useRef, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type VideoCardProps = {
  src: string;
  onClick?: () => void;
  isLiked?: boolean;
  isHistoryCard?: boolean;
  overlay?: ReactNode;
};

export function VideoCard({
  src,
  onClick,
  isLiked = false,
  isHistoryCard = false,
  overlay,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);
  const hasAttemptedHistoryAutoplayRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const pauseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const handleVisibilityChange = (entry: IntersectionObserverEntry) => {
      const rootTop = entry.rootBounds?.top ?? 0;
      const rootHeight = entry.rootBounds?.height ?? window.innerHeight;
      const rootBottom = rootTop + rootHeight;
      const { top, bottom } = entry.boundingClientRect;
      const completelyOutOfView = bottom <= rootTop || top >= rootBottom || !entry.isIntersecting;

      if (!completelyOutOfView) {
        if (pauseTimeoutRef.current) {
          window.clearTimeout(pauseTimeoutRef.current);
          pauseTimeoutRef.current = null;
        }
        if (!isPlayingRef.current && video.paused) {
          isPlayingRef.current = true;
          requestAnimationFrame(() => {
            video
              .play()
              .then(() => {
                hasAttemptedHistoryAutoplayRef.current = true;
              })
              .catch(() => {
                isPlayingRef.current = false;
              });
          });
        }
      } else if (isPlayingRef.current && pauseTimeoutRef.current === null) {
        pauseTimeoutRef.current = window.setTimeout(() => {
          isPlayingRef.current = false;
          video.pause();
          pauseTimeoutRef.current = null;
        }, 120);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          handleVisibilityChange(entry);
        }
      },
      {
        threshold: [0, 0.2, 0.75],
        rootMargin: '0px 0px 10% 0px',
      }
    );

    observer.observe(container);

    return () => {
      if (pauseTimeoutRef.current) {
        window.clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      observer.disconnect();
      isPlayingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isHistoryCard) return;
    const video = videoRef.current;
    if (!video || hasAttemptedHistoryAutoplayRef.current) return;

    requestAnimationFrame(() => {
      if (pauseTimeoutRef.current) {
        window.clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      video
        .play()
        .then(() => {
          hasAttemptedHistoryAutoplayRef.current = true;
          isPlayingRef.current = true;
        })
        .catch(() => {
          isPlayingRef.current = false;
        });
    });
  }, [isHistoryCard]);

  useEffect(() => {
    setIsReady(false);
    hasAttemptedHistoryAutoplayRef.current = false;
  }, [src]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative group flex items-center justify-center"
      onClick={onClick}
    >
      <Card
        className={cn(
          'shadow-lg overflow-hidden transition-all duration-300 rounded-2xl w-full bg-card h-full cursor-pointer hover:scale-105'
        )}
        style={{ aspectRatio: '9/16' }}
      >
        <CardContent className="p-0 h-full">
          <div className="relative w-full bg-black rounded-lg overflow-hidden h-full">
            <video
              ref={videoRef}
              src={src}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                isReady ? 'opacity-100' : 'opacity-0'
              )}
              loop
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setIsReady(true)}
            />
            {!isReady && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}
            {isLiked && (
              <div className="absolute top-2 right-2 pointer-events-none">
                <Heart className="h-6 w-6 text-red-500 fill-red-500" />
              </div>
            )}
            {overlay ? <div className="absolute inset-0 pointer-events-none">{overlay}</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
