'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { PostRecord, deletePost, getPostDisplayLabel, listPosts, subscribeToPosts, updatePost } from '@/lib/post-store';
import { PostCard } from '@/components/post-card';
import { PostDetailsDialog } from '@/components/post-details-dialog';
import { PostEditorDialog } from '@/components/post-editor-dialog';

function AccountPageContent() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const activeUserId = user?.email ?? 'guest';

  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [detailsTarget, setDetailsTarget] = useState<PostRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editorTarget, setEditorTarget] = useState<PostRecord | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);

  const refreshPosts = useCallback(() => {
    setIsLoadingPosts(true);
    try {
      const records = listPosts(activeUserId);
      setPosts(records);
    } catch (error) {
      console.error('Failed to load posts', error);
      toast({
        title: 'Unable to load posts',
        description: 'Please refresh the page and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPosts(false);
    }
  }, [activeUserId, toast]);

  useEffect(() => {
    if (loading) return;
    refreshPosts();
    const unsubscribe = subscribeToPosts(activeUserId, refreshPosts);
    return unsubscribe;
  }, [activeUserId, loading, refreshPosts]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshPosts();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', refreshPosts);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', refreshPosts);
    };
  }, [refreshPosts]);

  const handleViewPost = useCallback(
    (post: PostRecord) => {
      if (!post.mediaIds.length) {
        toast({
          title: 'No media found for this post',
          description: 'Try uploading new videos to this post.',
          variant: 'destructive',
        });
        return;
      }

      const mediaParam = encodeURIComponent(JSON.stringify(post.mediaIds));
      router.push(`/?mediaIds=${mediaParam}`);
    },
    [router, toast]
  );

  const handleDeletePost = useCallback(
    (post: PostRecord) => {
      const label = getPostDisplayLabel(post);
      const confirmed = window.confirm(`Delete "${label}"? This cannot be undone.`);
      if (!confirmed) return;
      setPendingPostId(post.id);
      deletePost(activeUserId, post.id);
      refreshPosts();
      toast({
        title: 'Post deleted',
        description: `${label} has been removed from your account.`,
      });
      if (detailsTarget?.id === post.id) {
        setIsDetailsOpen(false);
        setDetailsTarget(null);
      }
      if (editorTarget?.id === post.id) {
        setIsEditorOpen(false);
        setEditorTarget(null);
      }
      setPendingPostId(null);
    },
    [activeUserId, refreshPosts, toast, detailsTarget, editorTarget]
  );

  const handleShowDetails = useCallback((post: PostRecord) => {
    setDetailsTarget(post);
    setIsDetailsOpen(true);
  }, []);

  const handleShowEditor = useCallback((post: PostRecord) => {
    setEditorTarget(post);
    setIsEditorOpen(true);
  }, []);

  const handleSavePost = useCallback(async (postId: string, updates: {
    name: string;
    title: string;
    description: string;
    mediaMeta: PostRecord['mediaMeta'];
  }) => {
    try {
      setPendingPostId(postId);
      const updated = updatePost(activeUserId, postId, {
        name: updates.name,
        title: updates.title,
        description: updates.description,
        mediaMeta: updates.mediaMeta,
      });
      if (!updated) {
        throw new Error('Unable to update this post. It may have been removed.');
      }
      setEditorTarget(updated);
      setDetailsTarget(prev => (prev?.id === updated.id ? updated : prev));
      refreshPosts();
      toast({
        title: 'Post updated',
        description: `${getPostDisplayLabel(updated)} has been saved.`,
      });
    } catch (error) {
      console.error('Failed to update post', error);
      toast({
        title: 'Failed to update post',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPendingPostId(null);
    }
  }, [activeUserId, refreshPosts, toast]);

  const emptyState = useMemo(
    () => (
      <Card className="border-dashed bg-card/50">
        <CardHeader className="items-center text-center">
          <PlusCircle className="h-8 w-8 text-muted-foreground" />
          <CardTitle className="text-xl">No posts yet</CardTitle>
          <CardDescription>
            Create your first post by uploading videos or adding URLs from the Discover page.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pb-6">
          <Button asChild>
            <Link href="/discover">Create a Post</Link>
          </Button>
        </CardFooter>
      </Card>
    ),
    []
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <Link href="/discover" className="text-2xl font-bold tracking-tight text-primary">
            bulkshorts
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/discover">Discover</Link>
          </Button>
          {loading ? (
            <Button variant="ghost" size="icon" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.email}
              </span>
              <Button variant="ghost" onClick={logout}>
                Log Out
              </Button>
            </div>
          ) : (
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
          )}
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">My Posts</h1>
          <p className="text-sm text-muted-foreground">
            Posts are saved locally for your account on this device.
          </p>
        </div>
        {isLoadingPosts ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          emptyState
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onView={handleViewPost}
                onDelete={handleDeletePost}
                onDetails={handleShowDetails}
                onEdit={handleShowEditor}
                disableActions={pendingPostId === post.id}
              />
            ))}
          </div>
        )}
      </main>
      <PostDetailsDialog
        post={detailsTarget}
        open={isDetailsOpen}
        onOpenChange={open => {
          setIsDetailsOpen(open);
          if (!open) {
            setDetailsTarget(null);
          }
        }}
      />
      <PostEditorDialog
        post={editorTarget}
        open={isEditorOpen}
        onOpenChange={open => {
          if (pendingPostId && !open) {
            return;
          }
          setIsEditorOpen(open);
          if (!open) {
            setEditorTarget(null);
          }
        }}
        onSave={handleSavePost}
      />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountPageContent />
    </Suspense>
  );
}
