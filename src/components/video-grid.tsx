'use client';
import { cn } from '@/lib/utils';
import { VideoPlayer } from './video-player';

type VideoGridProps = {
    urls: string[];
    view: 'grid' | 'focus';
    onSelectVideo: (url: string) => void;
};

export function VideoGrid({ urls, view, onSelectVideo }: VideoGridProps) {
    const isGridView = view === 'grid';
    return (
        <div>
            <h2 className="text-2xl font-bold text-center mb-8">Video Discoveries</h2>
            <div className={cn(
                isGridView 
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                : "flex flex-col items-center gap-8"
            )}>
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