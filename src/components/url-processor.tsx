'use client';

import { useRef, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  MediaRecord,
  saveLocalMedia,
  saveRemoteMedia,
} from '@/lib/media-store';
import { createPost } from '@/lib/post-store';

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
  const { user } = useAuth();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingFiles, setIsSavingFiles] = useState(false);
  const [localMediaRecords, setLocalMediaRecords] = useState<MediaRecord[]>([]);
  const [postName, setPostName] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');

  const userId = user?.email ?? 'guest';

  const handleFileSelection = async (files: FileList | null) => {
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

    setIsSavingFiles(true);

    try {
      const savedRecords = await Promise.all(videoFiles.map(file => saveLocalMedia(file, userId)));
      setLocalMediaRecords(prev => {
        const existingIds = new Set(prev.map(record => record.id));
        const merged = [...prev];
        savedRecords.forEach(record => {
          if (!existingIds.has(record.id)) {
            merged.push(record);
          }
        });
        return merged;
      });
      toast({
        title: 'Videos saved',
        description: `${savedRecords.length} local videos are ready to edit.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Upload failed',
        description: 'We could not store one or more files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingFiles(false);
    }
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

  const processInputs = async (httpUrls: string[]) => {
    setError(null);
    setIsProcessing(true);

    try {
      const { valid: validHttpUrls, errors } = validateHttpUrls(httpUrls);

      if (errors.length) {
        setError(errors.join('\n'));
      }

      const remoteRecords = await Promise.all(validHttpUrls.map(url => saveRemoteMedia(url, userId)));
      const allIds = dedupe([
        ...localMediaRecords.map(record => record.id),
        ...remoteRecords.map(record => record.id),
      ]);

      if (!allIds.length) {
        setError('No valid media entries were detected. Please try again.');
        return;
      }

      await createPost({
        userId,
        name: postName,
        title: postTitle,
        description: postDescription,
        mediaIds: allIds,
      });

      toast({
        title: 'Post created',
        description: `${postTitle || postName} is ready in your posts list.`,
      });

      const mediaParam = encodeURIComponent(JSON.stringify(allIds));
      router.push(`/?mediaIds=${mediaParam}`);
      setLocalMediaRecords([]);
      setPostName('');
      setPostTitle('');
      setPostDescription('');
      if (textareaRef.current) {
        textareaRef.current.value = '';
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error
        ? err.message
        : 'Failed to process the provided inputs. Please try again.';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postName.trim() || !postTitle.trim() || !postDescription.trim()) {
      setError('Please provide a post name, title, and description before uploading.');
      return;
    }
    const value = textareaRef.current?.value ?? '';
    const urls = value
      .split('\n')
      .map(url => url.trim())
      .filter(Boolean);

    const httpUrls = urls.filter(isHttpUrl);

    if (!httpUrls.length && localMediaRecords.length === 0) {
      setError('Please enter at least one valid URL or upload a video.');
      return;
    }

    await processInputs(httpUrls);
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="post-name">Post Name</Label>
              <Input
                id="post-name"
                name="postName"
                placeholder="My Travel Clips"
                value={postName}
                onChange={event => setPostName(event.target.value)}
                disabled={isProcessing}
                required
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                name="postTitle"
                placeholder="Highlights from the trip"
                value={postTitle}
                onChange={event => setPostTitle(event.target.value)}
                disabled={isProcessing}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="post-description">Description</Label>
            <Textarea
              id="post-description"
              name="postDescription"
              placeholder="Add more context about this collection..."
              className="min-h-[100px] resize-y"
              value={postDescription}
              onChange={event => setPostDescription(event.target.value)}
              disabled={isProcessing}
              required
            />
          </div>
          <Textarea
            ref={textareaRef}
            name="urls"
            placeholder={`https://example.com/video1.mp4\nhttps://anothersite.org/media.mp4\n...and so on`}
            className="min-h-[180px] resize-y font-mono text-sm"
            spellCheck={false}
            disabled={isProcessing}
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={event => {
                void handleFileSelection(event.target.files);
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
              disabled={isSavingFiles || isProcessing}
            >
              {isSavingFiles ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isSavingFiles ? 'Saving…' : 'Upload from device'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Local files stay on your device; they load instantly via secure object URLs.
            </p>
          </div>
          {localMediaRecords.length > 0 && (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="text-sm font-medium">Ready to discover ({localMediaRecords.length})</p>
              <ul className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-auto">
                {localMediaRecords.map(record => (
                  <li key={record.id} className="truncate">
                    {record.fileName ?? record.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
