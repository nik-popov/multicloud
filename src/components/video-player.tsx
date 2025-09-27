'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Heart, Library, MousePointer } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';
import { Slider } from './ui/slider';
import { Label } from './ui/label';

type VideoPlayerProps = {
  src: string;
  onClick?: () => void;
  isFocusView?: boolean;
};

export function VideoPlayer({
  src,
  onClick,
  isFocusView = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('9/16');

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !isFocusView) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const percentage = x / width;
    videoRef.current.currentTime = videoRef.current.duration * percentage;
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

  return (
    <div className="w-full relative group flex items-center justify-center">
      <Card
        className={cn(
          'shadow-lg overflow-hidden transition-all duration-300 rounded-2xl',
          isFocusView
            ? 'bg-black'
            : 'cursor-pointer hover:scale-105 w-full aspect-[9/16]'
        )}
        onClick={!isFocusView ? onClick : undefined}
      >
        <CardContent className="p-0 h-full">
          <div
            className={cn(
              'relative w-full bg-black rounded-lg overflow-hidden h-full'
            )}
            onMouseMove={isFocusView ? handleMouseMove : undefined}
          >
            <video
              ref={videoRef}
              src={src}
              className={cn(
                'w-full h-full',
                isFocusView ? 'object-contain' : 'object-cover'
              )}
              style={{
                aspectRatio: isFocusView
                  ? aspectRatio
                  : '9 / 16',
              }}
              autoPlay
              loop
              muted
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
            />
            {isFocusView && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center text-white/70 text-xs font-semibold animate-pulse">
                <MousePointer className="h-4 w-4 mr-2" />
                <span>Move mouse to scrub video</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isFocusView && (
        <div className="absolute right-[-220px] w-[200px] flex flex-col items-center gap-4 p-4">
          <div className="text-white space-y-2 p-4 bg-black/20 rounded-lg backdrop-blur-sm w-full">
            <p className="font-bold">@creator</p>
            <p className='text-sm text-white/80'>Video description...</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-red-500 hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
          >
            <Heart className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-primary hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
          >
            <Library className="h-6 w-6" />
          </Button>
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
      )}
    </div>
  );
}
