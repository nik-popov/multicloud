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
import {ArrowLeft, Loader2} from 'lucide-react';
import {useEffect, useRef, useState, useMemo, useTransition} from 'react';
import {VideoGrid} from './video-grid';
import {Slider} from './ui/slider';
import {Label} from './ui/label';

export function UrlProcessor() {
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'focus'>('grid');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(3);
  const [isPending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasUrls = urls.length > 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const urlsToValidate = (formData.get('urls') as string)?.split('\n').filter(Boolean);

    if (!urlsToValidate || urlsToValidate.length === 0) {
      setError('Please enter at least one URL.');
      return;
    }
    
    setUrls([]);
    setError(null);
    resultRef.current?.scrollIntoView({ behavior: 'smooth' });

    startTransition(async () => {
      for (const url of urlsToValidate) {
        const result = await validateUrlAction(url);
        if (result.validUrl) {
          setUrls(prev => [...prev, result.validUrl!]);
        }
        if (result.error) {
          setError(prev => (prev ? `${prev}\n${result.error}` : result.error));
        }
      }
    });
  };

  const handleSelectVideo = (url: string) => {
    setSelectedUrl(url);
    setView('focus');
  };

  useEffect(() => {
    if (view === 'focus' && selectedUrl) {
      const element = document.getElementById(`video-wrapper-${selectedUrl}`);
      element?.scrollIntoView({behavior: 'auto', block: 'start'});
    }
  }, [view, selectedUrl]);

  const handleBackToGrid = () => {
    setView('grid');
    setSelectedUrl(null);
  };

  const orderedUrls = useMemo(() => {
    if (!urls) return [];
    if (!selectedUrl) return urls;

    const newUrls = [...urls];
    const index = newUrls.indexOf(selectedUrl);
    if (index > -1) {
      const [item] = newUrls.splice(index, 1);
      newUrls.unshift(item);
    }
    return newUrls;
  }, [selectedUrl, urls]);

  return (
    <div className="space-y-8">
      {!hasUrls && !isPending && (
        <Card className="w-full shadow-lg max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} ref={formRef}>
            <CardHeader>
              <CardTitle>URL Validator</CardTitle>
              <CardDescription>
                Paste your list of video URLs below. Our AI will validate them
                and create a discovery grid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                ref={textareaRef}
                name="urls"
                placeholder={`https://example.com/video1.mp4\nhttps://anothersite.org/media.mp4\n...and so on`}
                className="min-h-[150px] resize-y font-mono text-sm"
                required
              />
            </CardContent>
            <CardFooter className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Discover Videos'
                )}
              </Button>
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
      )}

      {(isPending && !hasUrls) && (
        <div className="text-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin inline-block" />
            <p>Validating URLs...</p>
        </div>
      )}


      <div ref={resultRef} className="relative">
        {hasUrls && (
          <div className="space-y-4">
            {view === 'focus' && (
              <Button
                variant="secondary"
                onClick={handleBackToGrid}
                className="fixed top-4 left-4 z-50"
                aria-label="Back to grid"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Grid
              </Button>
            )}
            {view === 'grid' && (
              <div className="max-w-xs space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="grid-size">Grid Size</Label>
                  <span className="text-sm font-medium">
                    {gridSize} Columns
                  </span>
                </div>
                <Slider
                  id="grid-size"
                  min={1}
                  max={8}
                  step={1}
                  value={[gridSize]}
                  onValueChange={value => setGridSize(value[0])}
                />
              </div>
            )}
            <VideoGrid
              urls={orderedUrls ?? []}
              view={view}
              onSelectVideo={handleSelectVideo}
              gridCols={gridSize}
            />
          </div>
        )}
      </div>
    </div>
  );
}
