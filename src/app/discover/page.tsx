
'use client';

import { UrlProcessor } from '@/components/url-processor';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { Suspense } from 'react';

function DiscoverPageContent() {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-primary cursor-pointer">
            bulkshorts
          </Link>
        </div>
        <div className="flex items-center gap-2">
            {!isMobile && (
              <Button variant="secondary" asChild>
                <Link href="/discover">New Batch</Link>
              </Button>
            )}
            <Button variant="outline" disabled>
                <Heart className="mr-2" />
                Collection (0)
            </Button>
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
    <Suspense fallback={<div>Loading...</div>}>
      <DiscoverPageContent />
    </Suspense>
  );
}
