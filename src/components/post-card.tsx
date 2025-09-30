import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Pencil, Trash2 } from 'lucide-react';
import { PostRecord, getPostDisplayLabel } from '@/lib/post-store';

interface PostCardProps {
  post: PostRecord;
  onView?: (post: PostRecord) => void;
  onDelete?: (post: PostRecord) => void;
  onEdit?: (post: PostRecord) => void;
  onDetails?: (post: PostRecord) => void;
  disableActions?: boolean;
}

export function PostCard({
  post,
  onView,
  onDelete,
  onEdit,
  onDetails,
  disableActions,
}: PostCardProps) {
  const actionButtonClass = 'flex items-center gap-2';
  const displayTitle = getPostDisplayLabel(post);
  const normalizedName = post.name.trim();
  const displaySubtitle = normalizedName || 'No name provided yet.';

  return (
    <Card className="flex h-full flex-col justify-between bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="line-clamp-1 text-lg">{displayTitle}</CardTitle>
            <CardDescription className="line-clamp-1">{displaySubtitle}</CardDescription>
          </div>
          <Badge variant="secondary">{post.mediaIds.length} videos</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
          {post.description || 'No description provided.'}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground">
          Saved {new Date(post.createdAt).toLocaleString()}
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {onDetails && (
            <Button
              variant="outline"
              size="sm"
              className={actionButtonClass}
              onClick={() => onDetails(post)}
              disabled={disableActions}
            >
              <FileText className="h-4 w-4" /> Details
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className={actionButtonClass}
              onClick={() => onEdit(post)}
              disabled={disableActions}
            >
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {onView && (
            <Button
              variant="outline"
              size="sm"
              className={actionButtonClass}
              onClick={() => onView(post)}
              disabled={disableActions}
            >
              <Eye className="h-4 w-4" /> View
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className={actionButtonClass}
              onClick={() => onDelete(post)}
              disabled={disableActions}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
