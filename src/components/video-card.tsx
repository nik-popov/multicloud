
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';

type VideoCardProps = {
  src: string;
  onClick?: () => void;
  isLiked?: boolean;
  isHistoryCard?: boolean;
};

export function VideoCard({
  src,
  onClick,
  isLiked = false,
  isHistoryCard = false,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
        }
      },
      {
        threshold: 0.8,
      }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);
  
  useEffect(() => {
    if (isHistoryCard && videoRef.current) {
       const playPromise = videoRef.current.play();
       if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented.
        });
       }
    }
  }, [isHistoryCard]);


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
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              autoPlay
            />
            {isLiked && (
              <div className="absolute top-2 right-2 pointer-events-none">
                <Heart className="h-6 w-6 text-red-500 fill-red-500" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
