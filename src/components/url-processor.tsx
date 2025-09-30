'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';

const isHttpUrl = (value: string) => /^https?:/i.test(value);
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.m4v'];
const hasSupportedVideoExtension = (value: string) => {
  const sanitized = value.split('?')[0].split('#')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => sanitized.endsWith(ext));
};
const dedupe = (values: string[]) => Array.from(new Set(values));

export function UrlProcessor() {
  const router = useRouter();
  const { toast } = useToast();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const releaseObjectUrls = () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };

    window.addEventListener('beforeunload', releaseObjectUrls);
    return () => {
      window.removeEventListener('beforeunload', releaseObjectUrls);
    };
  }, []);

  const appendUrlsToTextarea = (urls: string[]) => {
    if (!textareaRef.current) return;
    const existing = textareaRef.current.value
      .split('\n')
      .map(value => value.trim())
      .filter(Boolean);

    const unique = dedupe([...existing, ...urls]);
    textareaRef.current.value = unique.join('\n');
  };

  const handleFileSelection = (files: FileList | null) => {
    if (!files?.length) return;

    const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
    if (!videoFiles.length) {
      toast({
        title: 'No video files selected',
        description: 'Please choose video files (mp4, mov, webm, etc.).',
        variant: 'destructive',
      });
      return;
    }

    const objectUrls = videoFiles.map(file => {
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.push(url);
      return url;
    });

    appendUrlsToTextarea(objectUrls);
    toast({
      title: 'Videos added',
      description: `${objectUrls.length} local videos will be processed immediately.`,
    });
  };

  const validateHttpUrls = (urls: string[]) => {
    const valid: string[] = [];
    const errors: string[] = [];

    urls.forEach(url => {
      if (!hasSupportedVideoExtension(url)) {
        errors.push(`Unsupported video format: ${url}`);
        return;
      }
      valid.push(url);
    });

    return { valid, errors };
  };

  const processUrls = (urls: string[]) => {
    if (!urls.length) {
      setError('Please enter at least one URL or upload a video.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const blobUrls = urls.filter(url => url.startsWith('blob:'));
      const httpUrls = urls.filter(isHttpUrl);
      const unsupported = urls.filter(url => !url.startsWith('blob:') && !isHttpUrl(url));

      if (unsupported.length) {
        setError(`Unsupported URLs detected:\n${unsupported.join('\n')}`);
        return;
      }

      const { valid: validHttpUrls, errors } = validateHttpUrls(httpUrls);
      const validUrls = dedupe([...blobUrls, ...validHttpUrls]);

      if (!validUrls.length) {
        setError(
          errors.length
            ? errors.join('\n')
            : 'No valid video URLs were detected. Please try again.'
        );
        return;
      }

      if (errors.length) {
        setError(errors.join('\n'));
      }

      const urlParam = encodeURIComponent(JSON.stringify(validUrls));
      router.push(`/?urls=${urlParam}`);
    } catch (err) {
      console.error(err);
      setError('Failed to process the provided URLs. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = textareaRef.current?.value ?? '';
    const urls = value
      .split('\n')
      .map(url => url.trim())
      .filter(Boolean);

    processUrls(urls);
  };

  return (
    <Card className="w-full shadow-lg max-w-3xl mx-auto bg-card/80 backdrop-blur-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-center text-3xl">Bulk Video Discovery</CardTitle>
          <CardDescription className="text-center">
            Paste video URLs or upload files from your device to build a rich viewing grid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            ref={textareaRef}
            name="urls"
            placeholder={`https://example.com/video1.mp4\nhttps://anothersite.org/media.mp4\n...and so on`}
            className="min-h-[180px] resize-y font-mono text-sm"
            spellCheck={false}
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={event => {
                handleFileSelection(event.target.files);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload from device
            </Button>
            <p className="text-xs text-muted-foreground">
              Local files stay on your device; they load instantly via secure object URLs.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={isProcessing} className="flex-grow sm:flex-grow-0 gap-2">
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {isProcessing ? 'Validating…' : 'Discover Videos'}
          </Button>
          {error && (
            <Alert variant="destructive" className="w-full sm:w-auto">
              <AlertDescription className="whitespace-pre-wrap text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
