'use client';
import { cn } from '@/lib/utils';
import { VideoPlayer } from './video-player';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

type VideoGridProps = {
    urls: string[];
    view: 'grid' | 'focus';
    onSelectVideo: (url: string) => void;
    gridCols?: number;
};

export function VideoGrid({ urls, view, onSelectVideo, gridCols = 4 }: VideoGridProps) {
    const [renderedUrls, setRenderedUrls] = useState<string[]>([]);
    const isGridView = view === 'grid';

    useEffect(() => {
        if (isGridView) {
            setRenderedUrls([]);
            const timer = setInterval(() => {
                setRenderedUrls(prevUrls => {
                    const nextIndex = prevUrls.length;
                    if (nextIndex < urls.length) {
                        return [...prevUrls, urls[nextIndex]];
                    } else {
                        clearInterval(timer);
                        return prevUrls;
                    }
                });
            }, 150); 
            return () => clearInterval(timer);
        } else {
            setRenderedUrls(urls);
        }
    }, [urls, isGridView]);

    const displayUrls = isGridView ? renderedUrls : urls;

    return (
        <div>
            <h2 className="text-2xl font-bold text-center mb-8">Video Discoveries</h2>
            <div 
                className={cn(
                    "gap-6",
                    isGridView 
                    ? "grid"
                    : "flex flex-col items-center"
                )}
                style={isGridView ? { gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` } : {}}
            >
            {displayUrls.map((url, index) => (
                <div 
                    key={index} 
                    className={cn(
                        "transition-opacity duration-500",
                        !isGridView && "w-full max-w-2xl mx-auto snap-start h-screen flex items-center justify-center",
                        isGridView ? "opacity-100" : ""
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
            {!isGridView && urls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-white pointer-events-none">
                    <span className="text-sm uppercase tracking-widest">Scroll</span>
                    <ChevronDown className="animate-bounce h-6 w-6" />
                </div>
            )}
        </div>
    );
}
