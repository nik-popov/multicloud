
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { getFavorites, getHistory } from '@/lib/firestore';
import { Heart, Loader2 } from 'lucide-react';
import { VideoCard } from '@/components/video-card';

type HistoryItem = {
  timestamp: string;
  urls: string[];
};

function AccountPageContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return; // Wait until authentication status is resolved
    }
    if (!user) {
      router.push('/login');
      return; // Redirect if not logged in
    }

    // Only fetch data if we have a user
    async function fetchData() {
      setLoadingData(true);
      try {
        const [favs, userHistory] = await Promise.all([
          getFavorites(user.uid),
          getHistory(user.uid),
        ]);
        setFavorites(favs);
        setHistory(userHistory);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoadingData(false);
      }
    }
    
    fetchData();

  }, [user, authLoading, router]);

  const loadBatchFromHistory = (urls: string[]) => {
    const urlParam = encodeURIComponent(JSON.stringify(urls));
    router.push(`/?urls=${urlParam}`);
  };

  if (authLoading || loadingData || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold tracking-tight text-primary cursor-pointer">
              bulkshorts
            </Link>
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </div>
    );
  }

  const recommendedItems = history.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
       <header className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-primary cursor-pointer">
            bulkshorts
          </Link>
        </div>
         <div className="flex items-center gap-2">
            <Button onClick={signOut}>
              Log Out
            </Button>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-8 space-y-8">
        <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
              <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.email}</h1>
                  <p className="text-muted-foreground">Here's a summary of your activity and saved content.</p>
              </div>
               <Button asChild>
                <Link href="/discover">Create New Batch</Link>
              </Button>
            </div>


            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center text-muted-foreground">
                        <Heart className="w-4 h-4 mr-2 text-red-500 fill-red-500" />
                        <span>{favorites.length} favorited videos</span>
                    </div>
                </CardContent>
            </Card>

            {favorites.length > 0 && (
                <div className="space-y-4 mb-8">
                    <h2 className="text-2xl font-bold">Your Favorites</h2>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {favorites.map((url) => (
                           <div key={url} className="w-full">
                             <VideoCard
                                src={url}
                                onClick={() => loadBatchFromHistory([url])}
                                isLiked={true}
                              />
                           </div>
                        ))}
                    </div>
                </div>
            )}

            {recommendedItems.length > 0 && (
              <div className="space-y-4 mb-8">
                <h2 className="text-2xl font-bold">Recommended For You</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {recommendedItems.map((batch, index) => (
                    <div
                      key={`rec-${index}`}
                      className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105"
                      onClick={() => loadBatchFromHistory(batch.urls)}
                    >
                      <div className="absolute inset-0 bg-black/50 transition-opacity duration-300 group-hover:bg-black/20 z-10" />
                      <div className="absolute bottom-0 left-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h3 className="font-bold text-white text-lg">
                          {new Date(batch.timestamp).toLocaleDateString()}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {batch.urls.length} videos
                        </p>
                      </div>
                      <VideoCard src={batch.urls[0]} isHistoryCard={true} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {history.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Your History</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {history.map((batch, index) => (
                    <div
                      key={index}
                      className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105"
                      onClick={() => loadBatchFromHistory(batch.urls)}
                    >
                      <div className="absolute inset-0 bg-black/50 transition-opacity duration-300 group-hover:bg-black/20 z-10" />
                      <div className="absolute bottom-0 left-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h3 className="font-bold text-white text-lg">
                          {new Date(batch.timestamp).toLocaleDateString()}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {batch.urls.length} videos
                        </p>
                      </div>
                      <VideoCard src={batch.urls[0]} isHistoryCard={true} />
                    </div>
                  ))}
                </div>
              </div>
            )}

        </div>
      </main>
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
