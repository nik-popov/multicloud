'use client';

import { UrlProcessor } from '@/components/url-processor';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

function DiscoverPageContent() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-primary cursor-pointer">
            bulkshorts
          </Link>
        </div>
        <div className="flex items-center gap-2">
            {user && (
              <Button variant="outline" asChild>
                <Link href="/account">My Posts</Link>
              </Button>
            )}
            {loading ? (
              <Button variant="ghost" size="icon" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm text-muted-foreground">
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
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="container mx-auto max-w-6xl">
            <UrlProcessor />
        </div>
      </main>
      <footer className="flex items-center justify-center p-4 border-t">
        <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
            <Link href="https://x.com" target="_blank">X</Link>
            </Button>
        </div>
      </footer>
    </div>
  )
}


export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverPageContent />
    </Suspense>
  );
}
