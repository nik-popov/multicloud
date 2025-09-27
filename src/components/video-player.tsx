'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';
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
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      if (videoWidth > videoHeight) {
        setAspectRatio('16/9');
      } else {
        setAspectRatio('9/16');
      }
    }
  };

  return (
    <div className="w-full relative group">
      <Card
        className={cn(
          'shadow-lg overflow-hidden transition-all duration-300 w-full rounded-2xl',
          isFocusView ? 'bg-black' : 'cursor-pointer hover:scale-105'
        )}
        onClick={!isFocusView ? onClick : undefined}
      >
        <CardContent className="p-0">
          <div
            className={cn(
              'relative w-full bg-black rounded-lg overflow-hidden',
              isFocusView ? 'h-full' : 'aspect-[9/16]'
            )}
            style={
              isFocusView ? { height: 'calc(100svh - 4rem)' } : {}
            }
            onMouseMove={isFocusView ? handleMouseMove : undefined}
          >
            <video
              ref={videoRef}
              src={src}
              className="w-full h-full object-contain"
              style={{ aspectRatio }}
              autoPlay
              loop
              muted
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
            />
          </div>
        </CardContent>
      </Card>
      {isFocusView && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white">
            <p className="font-bold">@creator</p>
            <p>Video description...</p>
          </div>
          <div className="w-full text-white space-y-2">
            <div className="flex items-center gap-4 text-sm">
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
                className="flex-1"
              />
              <span className="font-mono w-10 text-right">
                {playbackRate.toFixed(1)}x
              </span>
            </div>
          </div>
        </div>
      )}
      {isFocusView && (
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-red-500 hover:bg-white/10 transition-colors duration-200 drop-shadow-lg backdrop-blur-sm rounded-full w-12 h-12"
          >
            <Heart className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
