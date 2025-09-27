
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Heart, Library, MousePointer, Fullscreen, Play, Pause, ChevronUp, Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type VideoPlayerProps = {
  src: string;
  isLiked?: boolean;
  onToggleLike?: () => void;
  controls?: React.ReactNode;
};

export function VideoPlayer({
  src,
  isLiked = false,
  onToggleLike = () => {},
  controls,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('9/16');
  const [showHeart, setShowHeart] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const placeholderImage = PlaceHolderImages.find(p => p.id === 'video-placeholder');


  useEffect(() => {
    if (videoRef.current) {
        // Start playing the video when the component mounts
        videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [src]);

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
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
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
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      if (videoWidth > videoHeight) {
        setAspectRatio('16/9');
      } else {
        setAspectRatio('9/16');
      }
      // ensure autoplay on load
      videoRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(!videoRef.current.paused);
    }
  };
  
  const handleDoubleClick = () => {
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

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  }

  const videoElement = (
    <Card
      className='bg-black w-auto h-full shadow-lg overflow-hidden transition-all duration-300 rounded-2xl'
      style={{aspectRatio: aspectRatio}}
      onClick={handleVideoClick}
      onDoubleClick={handleDoubleClick}
    >
      <CardContent className="p-0 h-full">
        <div
          className='relative w-full bg-black rounded-lg overflow-hidden h-full'
          onMouseMove={handleMouseMove}
        >
          <video
            ref={videoRef}
            src={src}
            className='w-full h-full object-contain'
            loop
            muted={isMuted}
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            poster={placeholderImage?.imageUrl}
          />
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
            <span>Move mouse to scrub video</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full h-full relative group flex items-center justify-center">
        <div className="flex items-center justify-center h-full w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 md:relative md:top-auto md:left-auto md:-translate-y-0 w-auto md:w-[200px] flex-col items-center gap-4 hidden md:flex z-10">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:text-primary bg-black/50 md:bg-transparent hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
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
        
          <div className="w-full md:w-auto h-full flex items-center justify-center">
              {videoElement}
          </div>
        
          <div className="absolute right-4 bottom-4 md:relative md:bottom-auto md:right-auto w-auto md:w-[200px] flex flex-col items-center gap-4">
            <div className="text-white space-y-2 p-4 bg-black/50 md:bg-black/20 rounded-lg backdrop-blur-sm w-full hidden md:block">
              <p className="font-bold">@creatorname</p>
              <p className='text-sm text-white/80'>This is a sample video description. #awesome #video</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleLike}
              className="text-white hover:text-red-500 bg-black/50 md:bg-white/10 hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
            >
              <Heart className={cn("h-6 w-6", isLiked && "fill-red-500")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMute}
              className="text-white hover:text-primary bg-black/50 md:bg-white/10 hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-primary bg-black/50 md:bg-white/10 hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
            >
              <Library className="h-6 w-6" />
            </Button>
              <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="text-white hover:text-primary bg-black/50 md:bg-white/10 hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
            >
              <Fullscreen className="h-6 w-6" />
            </Button>
          </div>
        </div>
    </div>
  );
}
