import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle } from 'lucide-react';
import Image from 'next/image';

export function VideoPlayer() {
  const placeholder = PlaceHolderImages.find(
    (img) => img.id === 'video-placeholder'
  );

  if (!placeholder) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg group">
          <Image
            src={placeholder.imageUrl}
            alt={placeholder.description}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={placeholder.imageHint}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
            <PlayCircle className="h-16 w-16 text-white/80 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
