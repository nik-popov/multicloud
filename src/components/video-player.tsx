import { Card, CardContent } from '@/components/ui/card';
import { Heart, Send } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

type VideoPlayerProps = {
  src: string;
  onClick?: () => void;
  isFocusView?: boolean;
};

export function VideoPlayer({ src, onClick, isFocusView = false }: VideoPlayerProps) {
  return (
    <div className="w-full relative">
      <Card
        className={cn(
          "shadow-lg overflow-hidden",
          !isFocusView && "cursor-pointer"
        )}
        onClick={!isFocusView ? onClick : undefined}
      >
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
      {isFocusView && (
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
           <div className="flex justify-end">
             <Button variant="ghost" size="icon" className="text-white hover:text-red-500 hover:bg-transparent transition-colors duration-200">
               <Heart className="h-8 w-8" />
             </Button>
           </div>
          <div className="flex items-center gap-2">
            <Input type="text" placeholder="Add a comment... 😃" className="bg-black/50 text-white border-white/20 placeholder:text-gray-300"/>
            <Button variant="ghost" size="icon" className="text-white hover:text-primary">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}