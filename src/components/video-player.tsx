'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Heart, MousePointer, Fullscreen, Play, Settings, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Skeleton } from './ui/skeleton';

type VideoPlayerProps = {
  src: string;
  isLiked?: boolean;
  onToggleLike?: () => void;
  controls?: React.ReactNode;
  scrollControls?: React.ReactNode;
  isInView?: boolean;
};

export function VideoPlayer({
  src,
  isLiked: initialIsLiked = false,
  onToggleLike = () => {},
  controls,
  scrollControls,
  isInView,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('9/16');
  const [showHeart, setShowHeart] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isReady, setIsReady] = useState(false);
  const scrubbingRef = useRef(false);
  const rafRef = useRef<number>();


  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  useEffect(() => {
    if (videoRef.current) {
      if (isInView) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isInView]);
  
  const attemptPlay = useCallback(() => {
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {
        // Autoplay was prevented. User needs to interact.
        setIsPlaying(false);
      });
    }
  }, []);

  useEffect(() => {
    // This effect is for when the video source changes.
    if (videoRef.current) {
        attemptPlay();
    }
  }, [src, attemptPlay]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  const updateCurrentTime = useCallback((clientX: number, target: HTMLElement) => {
    if (!videoRef.current) return;
    const { left, width } = target.getBoundingClientRect();
    if (width === 0) return;
    const clampedX = Math.min(Math.max(clientX - left, 0), width);
    const percentage = clampedX / width;
    const newTime = videoRef.current.duration * percentage;

    if (!Number.isFinite(newTime)) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
    });
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    scrubbingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateCurrentTime(event.clientX, event.currentTarget);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return;
    updateCurrentTime(event.clientX, event.currentTarget);
  };

  const stopScrubbing = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return;
    scrubbingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePlaybackRateChange = (value: number[]) => {
    const newRate = value[0];
    setPlaybackRate(newRate);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      if (videoWidth > videoHeight) {
        setAspectRatio('16/9');
      } else {
        setAspectRatio('9/16');
      }
      attemptPlay();
      setIsPlaying(!videoRef.current.paused);
      setIsReady(true);
    }
  };

  useEffect(() => {
    setIsReady(false);
    if (videoRef.current) {
      scrubbingRef.current = false;
    }
  }, [src]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
  
  const handleToggleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    onToggleLike();
    if (newLikedState) {
        setShowHeart(true);
        setTimeout(() => {
            setShowHeart(false);
        }, 1000);
    }
  };
  
  const handleDoubleClick = () => {
    handleToggleLike();
  };
  
  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  }

  const videoElement = (
    <Card
      className='bg-black w-full h-full shadow-lg overflow-hidden transition-all duration-300 rounded-2xl'
      style={{aspectRatio: aspectRatio}}
      onClick={handleVideoClick}
      onDoubleClick={handleDoubleClick}
    >
      <CardContent className="p-0 h-full">
        <div
          className='relative w-full bg-black rounded-lg overflow-hidden h-full'
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopScrubbing}
          onPointerLeave={stopScrubbing}
          onPointerCancel={stopScrubbing}
        >
          <video
            ref={videoRef}
            src={`${src}#t=0.1`}
            className={cn(
              'w-full h-full object-contain transition-opacity duration-300',
              isReady ? 'opacity-100' : 'opacity-0'
            )}
            loop
            muted={isMuted}
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            autoPlay
            preload="metadata"
            onLoadedData={() => setIsReady(true)}
          />
          {!isReady && <Skeleton className="absolute inset-0 rounded-none" />}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 rounded-full p-4">
                    <Play className="h-12 w-12 text-white fill-white" />
                </div>
            </div>
          )}
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="h-24 w-24 text-white/90 animate-in fade-in zoom-in-125 fill-red-500/80 duration-500" />
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 items-center justify-center text-white/70 text-xs font-semibold animate-pulse group-hover:opacity-0 transition-opacity hidden md:flex">
            <MousePointer className="h-4 w-4 mr-2" />
            <span>Click and drag to scrub video</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full h-full relative group flex items-center justify-center">
        <div className="flex flex-col md:flex-row items-center justify-center h-full w-full gap-4">
          <div className="w-full md:w-auto h-full flex items-center justify-center">
              {videoElement}
          </div>
        
          <div className="absolute right-4 bottom-4 md:static flex flex-row md:flex-col items-center gap-4">
            {scrollControls}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleLike}
              className="text-white hover:text-red-500 bg-black/50 hover:bg-black/50 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
            >
              <Heart className={cn("h-6 w-6", isLiked && "fill-red-500 text-red-500")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMute}
              className="text-white hover:text-primary bg-black/50 hover:bg-black/50 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="text-white hover:text-primary bg-black/50 hover:bg-black/50 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
            >
              <Fullscreen className="h-6 w-6" />
            </Button>
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:text-primary bg-black/50 hover:bg-black/50 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
                    >
                        <Settings className="h-6 w-6" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-auto bg-black/50 backdrop-blur-md border-white/20 text-white md:bg-card/80">
                    <div className="w-56 space-y-4">
                    {controls}
                    <div className="w-full text-white space-y-2">
                        <div className="flex flex-col items-center gap-2 text-sm">
                            <Label
                            htmlFor="speed-control"
                            className="text-white/80 flex-shrink-0"
                            >
                            Video Speed
                            </Label>
                            <Slider
                            id="speed-control"
                            min={0.5}
                            max={2}
                            step={0.1}
                            value={[playbackRate]}
                            onValueChange={handlePlaybackRateChange}
                            className="w-full"
                            />
                            <span className="font-mono text-xs">
                            {playbackRate.toFixed(1)}x
                            </span>
                        </div>
                    </div>
                    </div>
                </PopoverContent>
            </Popover>
          </div>
        </div>
    </div>
  );
}
