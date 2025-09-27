'use client';

import {validateUrlsAction} from '@/app/actions';
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
import {useToast} from '@/hooks/use-toast';
import {Progress} from '@/components/ui/progress';
import { useRouter } from 'next/navigation';

export function UrlProcessor() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast();
  const router = useRouter();

  const processUrls = (urlsToValidate: string[]) => {
    if (!urlsToValidate || urlsToValidate.length === 0) {
      setError('Please enter at least one URL or select files.');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    let progressInterval: NodeJS.Timeout | null = null;

    // Simulate progress
    setProcessingProgress(0);
    let progress = 0;
    progressInterval = setInterval(() => {
      progress += 1;
      setProcessingProgress(progress);
      if (progress >= 95) {
        // Stop at 95% to wait for completion
        if (progressInterval) clearInterval(progressInterval);
      }
    }, 100); // Adjust time for smoother progress

    startTransition(async () => {
      const result = await validateUrlsAction(urlsToValidate);

      if (progressInterval) clearInterval(progressInterval);
      setProcessingProgress(100);
      setIsProcessing(false);

      if (result.errors) {
        setError(result.errors.join('\n'));
      } else {
        const urlParam = encodeURIComponent(JSON.stringify(result.validUrls));
        router.push(`/?urls=${urlParam}`);
      }
    });
  };

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

    const videoFiles = Array.from(files).filter(file =>
      file.type.startsWith('video/')
    );
    if (videoFiles.length === 0) {
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
      description: `${videoFiles.length} video files have been added to the text area.`,
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <div className="text-center w-full max-w-md mx-auto space-y-4">
          <Loader2 className="mr-2 h-8 w-8 animate-spin inline-block" />
          <p>Validating URLs...</p>
          <Progress value={processingProgress} />
          <p className="text-sm text-muted-foreground">
            {Math.round(processingProgress)}% complete
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full shadow-lg max-w-3xl mx-auto bg-card/80 backdrop-blur-sm">
      <form onSubmit={handleSubmit} ref={formRef}>
        <CardHeader>
          <CardTitle className="text-center text-3xl">
            Bulk Video Discovery
          </CardTitle>
          <CardDescription className="text-center">
            Paste a list of video URLs or upload files to instantly create a
            browsable grid of short-form content.
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
              disabled={isPending || isProcessing}
              className="flex-grow sm:flex-grow-0"
            >
              {isPending || isProcessing ? (
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
              disabled={isPending || isProcessing}
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
  );
}
