'use client';
import { cn } from '@/lib/utils';
import { VideoPlayer } from './video-player';

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
                    "gap-4",
                    isGridView 
                    ? "grid"
                    : "flex flex-col items-center"
                )}
                style={isGridView ? { gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` } : {}}
            >
            {urls.map((url, index) => (
                <div key={index} className={cn(!isGridView && "w-full max-w-sm mx-auto")}>
                    <VideoPlayer  
                        src={url} 
                        onClick={() => onSelectVideo(url)} 
                        isFocusView={!isGridView}
                    />
                </div>
            ))}
            </div>
        </div>
    );
}
