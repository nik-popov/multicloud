import {
  Card,
  CardContent
} from '@/components/ui/card';

type VideoPlayerProps = {
  src: string;
  onClick?: () => void;
};

export function VideoPlayer({
  src,
  onClick
}: VideoPlayerProps) {
  return (
    <Card className="shadow-lg overflow-hidden cursor-pointer" onClick={onClick}>
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
