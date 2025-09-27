'use client';

import { UrlProcessor } from '@/components/url-processor';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Home() {
  const [showProcessor, setShowProcessor] = useState(false);

  const handleShowProcessor = () => {
    setShowProcessor(true);
  };

  const handleNewBatch = () => {
    setShowProcessor(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            bulkshorts
          </h1>
          <Button variant="secondary" onClick={handleNewBatch}>
            New Batch
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground hidden sm:block">
            Sources:
          </p>
          <Button variant="outline" disabled>
            Reddit
          </Button>
          <Button variant="outline" disabled>
            X
          </Button>
          <Button variant="outline" disabled>
            IG
          </Button>
          <Button variant="outline" disabled>
            YouTube
          </Button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto">
        <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <UrlProcessor
            showForm={!showProcessor}
            onProcessStart={handleShowProcessor}
          />
        </div>
      </main>
    </div>
  );
}
