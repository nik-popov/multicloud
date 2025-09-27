import {
  Card,
  CardContent
} from '@/components/ui/card';

type VideoPlayerProps = {
  src: string;
};

export function VideoPlayer({
  src
}: VideoPlayerProps) {
  return (
    <Card className="shadow-lg overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[9/16] w-full">
          <video
            src={src}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </CardContent>
    </Card>
  );
}
