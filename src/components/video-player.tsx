'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Heart, Send } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
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
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
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
    <div className="w-full relative">
      <Card
        className={cn(
          'shadow-lg overflow-hidden transition-all duration-300',
          !isFocusView && 'cursor-pointer hover:scale-105'
        )}
        onClick={!isFocusView ? onClick : undefined}
      >
        <CardContent className="p-0">
          <div
            className={cn(
              'relative w-full bg-black rounded-lg',
              isFocusView ? 'aspect-auto' : 'aspect-[9/16]'
            )}
            onMouseMove={handleMouseMove}
          >
            <video
              ref={videoRef}
              src={src}
              className={cn(
                'w-full h-full rounded-lg',
                isFocusView ? 'object-contain' : 'object-cover',
                isFocusView && aspectRatio === '16/9' && 'aspect-video',
                isFocusView && aspectRatio === '9/16' && 'aspect-[9/16]'
              )}
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
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-red-500 hover:bg-transparent transition-colors duration-200 drop-shadow-lg"
            >
              <Heart className="h-8 w-8" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="text"
              placeholder="Add a comment... 😃"
              className="bg-black/50 text-white border-white/20 placeholder:text-gray-300 focus:ring-primary"
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-primary drop-shadow-lg"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-4 max-w-xs mx-auto text-white">
            <div className="flex justify-between items-center text-sm">
                <Label htmlFor="speed-control" className="text-white/80">Speed</Label>
                <span>{playbackRate.toFixed(1)}x</span>
            </div>
            <Slider
              id="speed-control"
              min={0.5}
              max={2}
              step={0.1}
              value={[playbackRate]}
              onValueChange={handlePlaybackRateChange}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
