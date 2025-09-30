import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PostMediaMeta, PostRecord } from '@/lib/post-store';
import { Loader2 } from 'lucide-react';

interface PostEditorDialogProps {
  post: PostRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (postId: string, updates: {
    name: string;
    title: string;
    description: string;
    mediaMeta: PostMediaMeta[];
  }) => Promise<void> | void;
}

export function PostEditorDialog({ post, open, onOpenChange, onSave }: PostEditorDialogProps) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaMeta, setMediaMeta] = useState<PostMediaMeta[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const hasMedia = useMemo(() => mediaMeta.length > 0, [mediaMeta]);

  useEffect(() => {
    if (!post || !open) {
      return;
    }
    setName(post.name);
    setTitle(post.title);
    setDescription(post.description);
    setMediaMeta(post.mediaMeta);
  }, [post, open]);

  const handleSave = async () => {
    if (!post) return;
    setIsSaving(true);
    try {
      await onSave(post.id, {
        name: name.trim(),
        title: title.trim(),
        description: description.trim(),
        mediaMeta,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!post) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a post to edit</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={isSaving ? () => {} : onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="post-edit-name">Post Name</label>
                <Input
                  id="post-edit-name"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="post-edit-title">Title</label>
                <Input
                  id="post-edit-title"
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  disabled={isSaving}
                />
              </div>
            </section>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="post-edit-description">Description</label>
              <Textarea
                id="post-edit-description"
                value={description}
                onChange={event => setDescription(event.target.value)}
                className="min-h-[120px]"
                disabled={isSaving}
              />
            </div>
            <Separator />
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Video Metadata</h3>
                {!hasMedia && <span className="text-xs text-muted-foreground">No videos captured.</span>}
              </div>
              {hasMedia && (
                <div className="space-y-4">
                  {mediaMeta.map((item, index) => (
                    <div key={item.id} className="rounded-md border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">Video {index + 1}</span>
                        <span className="text-xs text-muted-foreground">{item.id}</span>
                      </div>
                      <Input
                        value={item.title}
                        placeholder="Title"
                        onChange={event => {
                          const next = [...mediaMeta];
                          next[index] = {
                            ...next[index],
                            title: event.target.value,
                          };
                          setMediaMeta(next);
                        }}
                        disabled={isSaving}
                      />
                      <Input
                        value={item.subtitle}
                        placeholder="Subtitle"
                        onChange={event => {
                          const next = [...mediaMeta];
                          next[index] = {
                            ...next[index],
                            subtitle: event.target.value,
                          };
                          setMediaMeta(next);
                        }}
                        disabled={isSaving}
                      />
                      <Textarea
                        value={item.description}
                        placeholder="Description"
                        onChange={event => {
                          const next = [...mediaMeta];
                          next[index] = {
                            ...next[index],
                            description: event.target.value,
                          };
                          setMediaMeta(next);
                        }}
                        className="min-h-[100px]"
                        disabled={isSaving}
                      />
                      <Textarea
                        value={item.postFact}
                        placeholder="Post fact"
                        onChange={event => {
                          const next = [...mediaMeta];
                          next[index] = {
                            ...next[index],
                            postFact: event.target.value,
                          };
                          setMediaMeta(next);
                        }}
                        className="min-h-[60px]"
                        disabled={isSaving}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
