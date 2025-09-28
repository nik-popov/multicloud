
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { importFromS3Action, listGoogleDriveFilesAction } from '@/app/actions';
import { useRef, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export function AdditionalSourceDialog({
  onUrls,
}: {
  onUrls: (urls: string[]) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user, signInWithGoogle } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await importFromS3Action(formData);
      onUrls(result.urls);
      toast({
        title: 'Imported from S3!',
        description: `${result.urls.length} video files have been imported.`,
      });
    });
  };

  const handleGoogleDriveImport = async () => {
    if (!user) {
      await signInWithGoogle();
    }
    const accessToken = await user?.getIdToken();
    if (accessToken) {
      startTransition(async () => {
        const result = await listGoogleDriveFilesAction(accessToken);
        onUrls(result.urls);
        toast({
          title: 'Imported from Google Drive!',
          description: `${result.urls.length} video files have been imported.`,
        });
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add from other sources</Button>
      </DialogTrigger>
      <DialogContent className="sm:maxw-[425px]">
        <DialogHeader>
          <DialogTitle>Add from other sources</DialogTitle>
          <DialogDescription>
            Import videos from your cloud storage providers.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="s3" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="s3">S3 / R2</TabsTrigger>
            <TabsTrigger value="gdrive">Google Drive</TabsTrigger>
          </TabsList>
          <TabsContent value="s3">
            <form onSubmit={handleSubmit} ref={formRef}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="access-key-id" className="text-right">
                    Access Key ID
                  </Label>
                  <Input
                    id="access-key-id"
                    name="accessKeyId"
                    defaultValue=""
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="secret-access-key" className="text-right">
                    Secret Access Key
                  </Label>
                  <Input
                    id="secret-access-key"
                    name="secretAccessKey"
                    defaultValue=""
                    className="col-span-3"
                    type="password"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bucket-name" className="text-right">
                    Bucket Name
                  </Label>
                  <Input
                    id="bucket-name"
                    name="bucketName"
                    defaultValue=""
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endpoint" className="text-right">
                    Endpoint
                  </Label>
                  <Input
                    id="endpoint"
                    name="endpoint"
                    defaultValue=""
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Importing...' : 'Import'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="gdrive">
            <div className="grid gap-4 py-4">
              <Button onClick={handleGoogleDriveImport} disabled={isPending}>
                {isPending ? 'Importing...' : 'Import from Google Drive'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
