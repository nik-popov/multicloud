'use client';

import {validateUrlAction} from '@/app/actions';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {Loader2, Upload} from 'lucide-react';
import {useEffect, useRef, useState, useTransition} from 'react';
import {VideoGrid} from './video-grid';
import {Slider} from './ui/slider';
import {Label} from './ui/label';
import {Switch} from './ui/switch';
import { useToast } from '@/hooks/use-toast';
import { VideoPlayer } from './video-player';

type UrlProcessorProps = {
  showForm: boolean;
  onProcessStart: () => void;
  setHistory: (history: any[]) => void;
  history: any[];
  initialUrls?: string[];
  loadBatch: (urls: string[]) => void;
  favorites: string[];
  onToggleFavorite: (url: string) => void;
};

export function UrlProcessor({ 
  showForm, 
  onProcessStart, 
  setHistory, 
  history, 
  initialUrls, 
  loadBatch, 
  favorites,
  onToggleFavorite
}: UrlProcessorProps) {
  const [urls, setUrls] = useState<string[]>(initialUrls || []);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'focus'>('grid');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(3);
  const [isPending, startTransition] = useTransition();
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(5);

  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast();

  const hasUrls = urls.length > 0;
  
  useEffect(() => {
    if (initialUrls) {
      setUrls(initialUrls);
    }
  }, [initialUrls]);

  useEffect(() => {
    const storedHistory = localStorage.getItem('bulkshorts_history');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, [setHistory]);

  const saveToHistory = (newUrls: string[]) => {
    if (newUrls.length === 0) return;
    const newBatch = {
      timestamp: new Date().toISOString(),
      urls: newUrls
    };
    const storedHistory = localStorage.getItem('bulkshorts_history') || '[]';
    const updatedHistory = [newBatch, ...JSON.parse(storedHistory)].slice(0, 50); // Limit history size
    localStorage.setItem('bulkshorts_history', JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
  }

  useEffect(() => {
    if (showForm) {
      setUrls([]);
      setError(null);
      setView('grid');
      setSelectedUrl(null);
    }
  }, [showForm]);


  useEffect(() => {
    const scrollAmount = scrollSpeed / 5;
    if (isAutoScrolling) {
      if (view === 'grid') {
        scrollIntervalRef.current = setInterval(() => {
          window.scrollBy({top: scrollAmount, behavior: 'smooth'});
        }, 50);
      } else if (view === 'focus') {
        scrollIntervalRef.current = setInterval(() => {
          const container = document.querySelector('[data-focus-view-container]');
          container?.scrollBy({top: container.clientHeight, behavior: 'smooth'});
        }, 3000 / (scrollSpeed / 5)); // Adjust timing based on speed
      }
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    }
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, view, scrollSpeed]);

  const processUrls = (urlsToValidate: string[]) => {
    if (!urlsToValidate || urlsToValidate.length === 0) {
      setError('Please enter at least one URL or select files.');
      return;
    }
    
    onProcessStart();
    setUrls([]);
    setError(null);
    const validUrls: string[] = [];
    
    startTransition(async () => {
      const allUrls = [];
      for (const url of urlsToValidate) {
        const result = await validateUrlAction(url);
        if (result.validUrl) {
          allUrls.push(result.validUrl);
          setUrls(prev => [...prev, result.validUrl!]);
          validUrls.push(result.validUrl);
        }
        if (result.error) {
          setError(prev => (prev ? `${prev}\n${result.error}` : result.error));
        }
      }
      saveToHistory(allUrls);
    });
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const urlsToValidate = (formData.get('urls') as string)
      ?.split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    processUrls(urlsToValidate);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
    if(videoFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No video files selected',
        description: 'Please select valid video files.',
      });
      return;
    }

    const objectUrls = videoFiles.map(file => URL.createObjectURL(file));
    if (textareaRef.current) {
      const existingUrls = textareaRef.current.value.split('\n').filter(Boolean);
      textareaRef.current.value = [...existingUrls, ...objectUrls].join('\n');
    }
    toast({
      title: 'Files added!',
      description: `${videoFiles.length} video files have been added to the text area.`
    })
  }
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  }

  const handleSelectVideo = (url: string) => {
    setSelectedUrl(url);
    setView('focus');
  };

  const handleBackToGrid = () => {
    setView('grid');
    setSelectedUrl(null);
  };
  
  const Controls = () => (
     <div className="flex flex-col gap-4 sticky top-24 h-min">
        <Card className="p-4 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0 flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full">
              <Label
                htmlFor="auto-scroll"
                className="text-sm font-medium"
              >
                Auto-Scroll
              </Label>
              <Switch
                id="auto-scroll"
                checked={isAutoScrolling}
                onCheckedChange={setIsAutoScrolling}
                aria-label="Toggle auto-scroll"
              />
            </div>
          </CardContent>
        </Card>
        {view === 'grid' && (
          <Card className="p-4 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0 space-y-2">
              <div className="flex justify-between items-center gap-4">
                <Label htmlFor="grid-size" className="flex-shrink-0">
                  Grid Size
                </Label>
                <span className="text-sm font-medium">{gridSize}</span>
              </div>
              <Slider
                id="grid-size"
                min={1}
                max={8}
                step={1}
                value={[gridSize]}
                onValueChange={value => setGridSize(value[0])}
              />
            </CardContent>
          </Card>
        )}
        <Card className="p-4 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0 space-y-2">
            <div className="flex justify-between items-center gap-4">
              <Label
                htmlFor="scroll-speed"
                className="flex-shrink-0"
              >
                Scroll Speed
              </Label>
              <span className="text-sm font-medium">{scrollSpeed}</span>
            </div>
            <Slider
              id="scroll-speed"
              min={1}
              max={10}
              step={1}
              value={[scrollSpeed]}
              onValueChange={value => setScrollSpeed(value[0])}
            />
          </CardContent>
        </Card>
      </div>
  );

  return (
    <div className="space-y-8">
      {showForm && !isPending && (
        <>
          <Card className="w-full shadow-lg max-w-3xl mx-auto bg-card/80 backdrop-blur-sm mt-12">
            <form onSubmit={handleSubmit} ref={formRef}>
              <CardHeader>
                <CardTitle className="text-center text-3xl">
                  Bulk Video Discovery
                </CardTitle>
                <CardDescription className="text-center">
                  Paste a list of video URLs or upload files to instantly create a browsable grid of short-form content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  ref={textareaRef}
                  name="urls"
                  placeholder={`https://example.com/video1.mp4\nhttps://anothersite.org/media.mp4\n...and so on`}
                  className="min-h-[150px] resize-y font-mono text-sm"
                  defaultValue={initialUrls?.join('\n')}
                />
                 <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="video/*"
                  multiple
                />
              </CardContent>
              <CardFooter className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                 <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-grow sm:flex-grow-0"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      'Discover Videos'
                    )}
                  </Button>
                   <Button
                    type="button"
                    variant="outline"
                    onClick={handleUploadClick}
                    disabled={isPending}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                  </Button>
                </div>
                {error && (
                  <Alert
                    variant="destructive"
                    className="w-full flex-grow sm:w-auto"
                  >
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardFooter>
            </form>
          </Card>
          {history.length > 0 && (
            <div className="space-y-4 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-center">History</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {history.map((batch, index) => (
                    <Card key={index}
                      className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105"
                      onClick={() => loadBatch(batch.urls)}
                    >
                      <div className="absolute inset-0 bg-black/50 transition-opacity duration-300 group-hover:bg-black/20 z-10" />
                      <div className="absolute bottom-0 left-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <h3 className="font-bold text-white text-lg">{new Date(batch.timestamp).toLocaleDateString()}</h3>
                          <p className="text-white/80 text-sm">{batch.urls.length} videos</p>
                      </div>
                      <CardContent className="h-full w-full p-0">
                        <VideoPlayer src={batch.urls[0]} isFocusView={false} isHistoryCard />
                      </CardContent>
                    </Card>
                  ))}
                </div>
            </div>
          )}
        </>
      )}

      {isPending && !hasUrls && (
        <div className="text-center">
          <Loader2 className="mr-2 h-8 w-8 animate-spin inline-block" />
          <p>Validating URLs...</p>
        </div>
      )}

      <div ref={resultRef} className="relative">
        {hasUrls && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
               <Controls />
                <VideoGrid
                  urls={urls ?? []}
                  view={view}
                  selectedUrl={selectedUrl}
                  onSelectVideo={handleSelectVideo}
                  gridCols={gridSize}
                  history={history}
                  loadBatch={loadBatch}
                  onBackToGrid={handleBackToGrid}
                  favorites={favorites}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
