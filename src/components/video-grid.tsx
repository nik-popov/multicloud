'use client';
import { cn } from '@/lib/utils';
import { VideoPlayer } from './video-player';
import { ChevronDown } from 'lucide-react';

type VideoGridProps = {
    urls: string[];
    view: 'grid' | 'focus';
    onSelectVideo: (url: string) => void;
    gridCols?: number;
};

export function VideoGrid({ urls, view, onSelectVideo, gridCols = 4 }: VideoGridProps) {
    const isGridView = view === 'grid';

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
            {urls.map((url) => (
                <div 
                    key={url} 
                    id={`video-wrapper-${url}`}
                    className={cn(
                        "transition-opacity duration-500 w-full",
                        !isGridView && "max-w-md w-full mx-auto snap-start h-screen flex items-center justify-center",
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
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-white pointer-events-none z-10">
                    <span className="text-sm uppercase tracking-widest">Scroll</span>
                    <ChevronDown className="animate-bounce h-6 w-6" />
                </div>
            )}
        </div>
    );
}
