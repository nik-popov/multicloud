'use client';

import { validateUrlsAction, type ValidationState } from '@/app/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useRef, useActionState, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { VideoGrid } from './video-grid';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Validating...
        </>
      ) : (
        'Discover Videos'
      )}
    </Button>
  );
}

export function UrlProcessor() {
  const initialState: ValidationState = { data: null, error: null };
  const [state, formAction] = useActionState(validateUrlsAction, initialState);
  const [view, setView] = useState<'grid' | 'focus'>('grid');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const hasUrls = state.data && state.data.length > 0;

  useEffect(() => {
    if (state.data) {
      if (state.data.length > 0) {
        formRef.current?.reset();
        setView('grid');
      }
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.data]);
  
  const handleSelectVideo = (url: string) => {
    setSelectedUrl(url);
    setView('focus');
    resultRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBackToGrid = () => {
    setView('grid');
    setSelectedUrl(null);
  }

  const orderedUrls = useMemo(() => {
    if (!selectedUrl || !state.data) return state.data;
    const urls = [...state.data];
    const index = urls.indexOf(selectedUrl);
    if (index > -1) {
      const [item] = urls.splice(index, 1);
      urls.unshift(item);
    }
    return urls;
  }, [selectedUrl, state.data]);

  return (
    <div className="space-y-8">
        {!hasUrls && (
            <Card className="w-full shadow-lg max-w-3xl mx-auto">
                <form action={formAction} ref={formRef}>
                <CardHeader>
                    <CardTitle>URL Validator</CardTitle>
                    <CardDescription>
                    Paste your list of video URLs below. Our AI will validate them and create a discovery grid.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                    name="urls"
                    placeholder={`https://example.com/video1.mp4\nhttps://anothersite.org/media.mp4\n...and so on`}
                    className="min-h-[150px] resize-y font-mono text-sm"
                    required
                    />
                </CardContent>
                <CardFooter className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <SubmitButton />
                    {state.error && (
                    <Alert
                        variant="destructive"
                        className="w-full flex-grow sm:w-auto"
                    >
                        <AlertDescription>{state.error}</AlertDescription>
                    </Alert>
                    )}
                </CardFooter>
                </form>
            </Card>
        )}


      <div ref={resultRef}>
        {hasUrls && (
          <div className='relative'>
             {view === 'focus' && (
              <Button
                variant="secondary"
                onClick={handleBackToGrid}
                className="absolute -top-12 left-0"
                aria-label="Back to grid"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Grid
              </Button>
            )}
            <VideoGrid urls={orderedUrls ?? []} view={view} onSelectVideo={handleSelectVideo} />
          </div>
        )}
      </div>
    </div>
  );
}