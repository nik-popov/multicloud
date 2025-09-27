'use client';
import { VideoPlayer } from './video-player';

type VideoGridProps = {
    urls: string[];
};

export function VideoGrid({ urls }: VideoGridProps) {
    return (
        <div>
            <h2 className="text-2xl font-bold text-center mb-8">Video Discoveries</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {urls.map((url, index) => (
                <VideoPlayer key={index} src={url} />
            ))}
            </div>
        </div>
    );
}
