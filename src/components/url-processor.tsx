
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
import {useRef, useState, useTransition} from 'react';
import { useToast } from '@/hooks/use-toast';
import { VideoCard } from './video-card';
import { Progress } from '@/components/ui/progress';

type UrlProcessorProps = {
  onProcessStart: () => void;
  onProcessComplete: (urls: string[]) => void;
  onProgress: (progress: number) => void;
  history: any[];
  loadBatch: (urls: string[]) => void;
  isProcessing: boolean;
  processingProgress: number;
};

export function UrlProcessor({ 
  onProcessStart,
  onProcessComplete,
  onProgress,
  history,
  loadBatch,
  isProcessing,
  processingProgress,
}: UrlProcessorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast();
  
  const processUrls = (urlsToValidate: string[]) => {
    if (!urlsToValidate || urlsToValidate.length === 0) {
      setError('Please enter at least one URL or select files.');
      return;
    }
    
    onProcessStart();
    setError(null);
    
    startTransition(async () => {
      const totalUrls = urlsToValidate.length;
      const allUrls: string[] = [];

      for (let i = 0; i < totalUrls; i++) {
        const url = urlsToValidate[i];
        const result = await validateUrlAction(url);
        if (result.validUrl) {
          allUrls.push(result.validUrl);
        }
        if (result.error) {
          setError(prev => (prev ? `${prev}\n${result.error}` : result.error));
        }
        onProgress(((i + 1) / totalUrls) * 100);
      }
      onProcessComplete(allUrls);
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

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <div className="text-center w-full max-w-md mx-auto space-y-4">
          <Loader2 className="mr-2 h-8 w-8 animate-spin inline-block" />
          <p>Validating URLs...</p>
          <Progress value={processingProgress} />
          <p className="text-sm text-muted-foreground">{Math.round(processingProgress)}% complete</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
                    <div key={index}
                      className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105"
                      onClick={() => loadBatch(batch.urls)}
                    >
                      <div className="absolute inset-0 bg-black/50 transition-opacity duration-300 group-hover:bg-black/20 z-10" />
                      <div className="absolute bottom-0 left-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <h3 className="font-bold text-white text-lg">{new Date(batch.timestamp).toLocaleDateString()}</h3>
                          <p className="text-white/80 text-sm">{batch.urls.length} videos</p>
                      </div>
                      <VideoCard src={batch.urls[0]} isHistoryCard={true}/>
                    </div>
                  ))}
                </div>
            </div>
          )}
        </>
    </div>
  );
}
