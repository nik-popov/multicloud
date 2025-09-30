import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PostRecord, getPostDisplayLabel } from '@/lib/post-store';
import { Badge } from '@/components/ui/badge';

interface PostDetailsDialogProps {
  post: PostRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostDetailsDialog({ post, open, onOpenChange }: PostDetailsDialogProps) {
  const mediaMeta = post?.mediaMeta ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{post ? getPostDisplayLabel(post) : 'Post details'}</DialogTitle>
          {post && (
            <DialogDescription>
              Saved {new Date(post.createdAt).toLocaleString()} · {post.mediaIds.length} videos
            </DialogDescription>
          )}
        </DialogHeader>
        {post ? (
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-6">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Overview</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {post.description || 'No description provided.'}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Name: {post.name || 'Untitled'}</Badge>
                  <Badge variant="outline">Post ID: {post.id}</Badge>
                </div>
              </section>
              <Separator />
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Videos</h3>
                {mediaMeta.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No media metadata stored for this post.</p>
                ) : (
                  <div className="space-y-4">
                    {mediaMeta.map(item => (
                      <div key={item.id} className="rounded-md border bg-muted/40 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">{item.title || 'Untitled video'}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.id}
                          </Badge>
                        </div>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground">Subtitle: {item.subtitle}</p>
                        )}
                        {item.description && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {item.description}
                          </p>
                        )}
                        {item.postFact && (
                          <p className="text-xs text-muted-foreground italic">Post fact: {item.postFact}</p>
                        )}
                        {!item.description && !item.subtitle && !item.postFact && (
                          <p className="text-xs text-muted-foreground">No details provided.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">Select a post to view its details.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
