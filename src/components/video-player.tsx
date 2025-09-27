'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Heart, Library, MousePointer, Fullscreen, Play, Pause, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';
import { Slider } from './ui/slider';
import { Label } from './ui/label';

type VideoPlayerProps = {
  src: string;
  onClick?: () => void;
  isFocusView?: boolean;
  isLiked?: boolean;
  onToggleLike?: () => void;
  isHistoryCard?: boolean;
};

export function VideoPlayer({
  src,
  onClick,
  isFocusView = false,
  isLiked = false,
  onToggleLike = () => {},
  isHistoryCard = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('9/16');
  const [showHeart, setShowHeart] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(!isFocusView);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // Adjust threshold as needed
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    observerRef.current = observer;

    return () => {
      if (containerRef.current && observerRef.current) {
        observerRef.current.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible) {
        if(isFocusView) {
          if (isPlaying) videoRef.current.play().catch(()=>{});
          else videoRef.current.pause();
        } else {
           videoRef.current.play().catch(()=>{});
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVisible, isPlaying, isFocusView]);


  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !isFocusView) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    if (width === 0) return;
    const x = e.clientX - left;
    const percentage = x / width;
    const newTime = videoRef.current.duration * percentage;
    
    if (isFinite(newTime)) {
        videoRef.current.currentTime = newTime;
    }
  };

  const handlePlaybackRateChange = (value: number[]) => {
    const newRate = value[0];
    setPlaybackRate(newRate);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && isFocusView) {
      const { videoWidth, videoHeight } = videoRef.current;
      if (videoWidth > videoHeight) {
        setAspectRatio('16/9');
      } else {
        setAspectRatio('9/16');
      }
    }
  };
  
  const handleDoubleClick = () => {
    if (!isFocusView) return;
    onToggleLike();
    if (!isLiked) {
      setShowHeart(true);
      setTimeout(() => {
        setShowHeart(false);
      }, 1000);
    }
  };
  
  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleVideoClick = () => {
    if (!isFocusView) {
      onClick?.();
      return;
    }
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  if (isHistoryCard) {
    return (
       <div className="w-full h-full" ref={containerRef}>
         {isVisible && <video
            src={src}
            className='w-full h-full object-cover'
            autoPlay
            loop
            muted
            playsInline
         />}
       </div>
    );
  }
  
  const videoElement = (
    <Card
      className={cn(
        'shadow-lg overflow-hidden transition-all duration-300 rounded-2xl',
        isFocusView
          ? 'bg-black w-auto h-full'
          : 'cursor-pointer hover:scale-105 w-full bg-card h-full'
      )}
      style={{aspectRatio: isFocusView ? aspectRatio : '9/16'}}
      onClick={handleVideoClick}
      onDoubleClick={handleDoubleClick}
    >
      <CardContent className="p-0 h-full">
        <div
          className={cn(
            'relative w-full bg-black rounded-lg overflow-hidden h-full'
          )}
          onMouseMove={isFocusView ? handleMouseMove : undefined}
        >
          {isVisible && <video
            ref={videoRef}
            src={src}
            className={cn(
              'w-full h-full',
              isFocusView ? 'object-contain' : 'object-cover'
            )}
            autoPlay={isFocusView ? isPlaying : true}
            loop
            muted
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
          />}
          {!isPlaying && isFocusView && (
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
            {isLiked && !isFocusView && (
            <div className="absolute top-2 right-2 pointer-events-none">
              <Heart className="h-6 w-6 text-red-500 fill-red-500" />
            </div>
          )}
          {isFocusView && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center text-white/70 text-xs font-semibold animate-pulse group-hover:opacity-0 transition-opacity">
              <MousePointer className="h-4 w-4 mr-2" />
              <span>Move mouse to scrub video</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!isFocusView) {
    return (
      <div className="w-full h-full relative group flex items-center justify-center" ref={containerRef}>
        {videoElement}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full w-full" ref={containerRef}>
        <div className="w-[200px] flex-col items-center gap-4 hidden md:flex">
            <div className="w-full text-white space-y-2 p-4 bg-black/20 rounded-lg backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2 text-sm">
                    <Label
                    htmlFor="speed-control"
                    className="text-white/80 flex-shrink-0"
                    >
                    Speed
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
      
        <div className="w-full md:w-auto h-full flex items-center justify-center">
            {videoElement}
        </div>
      
        <div className="w-[200px] flex-col items-center gap-4 hidden md:flex">
          <div className="text-white space-y-2 p-4 bg-black/20 rounded-lg backdrop-blur-sm w-full">
            <p className="font-bold">@creatorname</p>
            <p className='text-sm text-white/80'>This is a sample video description. #awesome #video</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleLike}
            className="text-white hover:text-red-500 hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
          >
            <Heart className={cn("h-6 w-6", isLiked && "fill-red-500")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-primary hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
          >
            <Library className="h-6 w-6" />
          </Button>
            <Button
            variant="ghost"
            size="icon"
            onClick={handleFullscreen}
            className="text-white hover:text-primary hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
          >
            <Fullscreen className="h-6 w-6" />
          </Button>
        </div>
    </div>
  );
}
