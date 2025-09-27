'use client';

import { UrlProcessor } from '@/components/url-processor';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { History } from 'lucide-react';

export default function Home() {
  const [showProcessor, setShowProcessor] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const handleShowProcessor = () => {
    setShowProcessor(true);
  };

  const handleNewBatch = () => {
    setShowProcessor(false);
  };
  
  const loadBatchFromHistory = (urls: string[]) => {
    // This is a placeholder for now. We'll implement this logic in the UrlProcessor.
    console.log("Loading batch:", urls);
  }

  return (
    <SidebarProvider>
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
            <SidebarTrigger />
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
              setHistory={setHistory}
            />
          </div>
        </main>
      </div>
       <Sidebar side="right">
        <SidebarContent>
          <SidebarHeader>
            <h2 className="text-xl font-semibold">History</h2>
          </SidebarHeader>
          <SidebarMenu>
            {history.length > 0 ? (
              history.map((batch, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton onClick={() => loadBatchFromHistory(batch.urls)}>
                    <div className='flex flex-col items-start'>
                      <span className='font-semibold'>{new Date(batch.timestamp).toLocaleString()}</span>
                      <span className='text-xs text-muted-foreground'>{batch.urls.length} videos</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              <div className='p-4 text-sm text-muted-foreground'>
                No history yet. Process a batch of URLs to see it here.
              </div>
            )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
