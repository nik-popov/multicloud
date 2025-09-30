
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type VideoCardProps = {
  src: string;
  onClick?: () => void;
  isLiked?: boolean;
  isHistoryCard?: boolean;
  overlay?: ReactNode;
  shouldAutoPlay?: boolean;
  playOnHover?: boolean;
};

export function VideoCard({
  src,
  onClick,
  isLiked = false,
  isHistoryCard = false,
  overlay,
  shouldAutoPlay = true,
  playOnHover = false,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);
  const hasAttemptedHistoryAutoplayRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const pauseTimeoutRef = useRef<number | null>(null);

  const cancelScheduledPause = useCallback(() => {
    if (pauseTimeoutRef.current) {
      window.clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  }, []);

  const playImmediately = useCallback(() => {
    cancelScheduledPause();
    const video = videoRef.current;
    if (!video) return;
    if (isPlayingRef.current || !video.paused) return;
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
  }, [cancelScheduledPause]);

  const schedulePause = useCallback((delay: number) => {
    cancelScheduledPause();
    const video = videoRef.current;
    if (!video) return;
    if (!isPlayingRef.current || video.paused) return;
    pauseTimeoutRef.current = window.setTimeout(() => {
      isPlayingRef.current = false;
      video.pause();
      pauseTimeoutRef.current = null;
    }, delay);
  }, [cancelScheduledPause]);

  const handleVisibilityChange = useCallback((entry: IntersectionObserverEntry) => {
    if (!shouldAutoPlay || playOnHover) {
      return;
    }

    const ratio = entry.intersectionRatio;
    const rootTop = entry.rootBounds?.top ?? 0;
    const rootHeight = entry.rootBounds?.height ?? window.innerHeight;
    const rootBottom = rootTop + rootHeight;
    const { top, bottom } = entry.boundingClientRect;
    const completelyOutOfView = bottom <= rootTop || top >= rootBottom || !entry.isIntersecting;

    if (completelyOutOfView || ratio <= 0.08) {
      schedulePause(160);
      return;
    }

    if (ratio >= 0.55) {
      playImmediately();
      return;
    }

    if (ratio <= 0.2) {
      schedulePause(120);
    } else {
      cancelScheduledPause();
    }
  }, [cancelScheduledPause, playImmediately, playOnHover, schedulePause, shouldAutoPlay]);

  useEffect(() => {
    if (!shouldAutoPlay || playOnHover) {
      return;
    }

    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          handleVisibilityChange(entry);
        }
      },
      {
        threshold: [0, 0.08, 0.2, 0.55, 0.75],
        rootMargin: '5% 0px 15% 0px',
      }
    );

    observer.observe(container);

    return () => {
      cancelScheduledPause();
      observer.disconnect();
      isPlayingRef.current = false;
      video.pause();
    };
  }, [cancelScheduledPause, handleVisibilityChange, playOnHover, shouldAutoPlay]);

  useEffect(() => {
    if (!isHistoryCard || !shouldAutoPlay || playOnHover) return;
    if (hasAttemptedHistoryAutoplayRef.current) return;

    requestAnimationFrame(() => {
      playImmediately();
    });
  }, [isHistoryCard, playImmediately, playOnHover, shouldAutoPlay]);

  useEffect(() => {
    setIsReady(false);
    hasAttemptedHistoryAutoplayRef.current = false;
    cancelScheduledPause();
    const video = videoRef.current;
    if (video) {
      video.pause();
      isPlayingRef.current = false;
      if (!shouldAutoPlay || playOnHover) {
        video.currentTime = 0;
      }
    }
  }, [cancelScheduledPause, playOnHover, shouldAutoPlay, src]);

  const handlePointerEnter = useCallback(() => {
    if (!playOnHover) return;
    playImmediately();
  }, [playImmediately, playOnHover]);

  const handlePointerLeave = useCallback(() => {
    if (!playOnHover) return;
    schedulePause(80);
  }, [playOnHover, schedulePause]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative group flex items-center justify-center"
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handlePointerEnter}
      onBlur={handlePointerLeave}
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
