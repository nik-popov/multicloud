
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getFavorites } from '@/lib/firestore';
import { Heart, Loader2 } from 'lucide-react';

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }

    async function fetchFavorites() {
      setLoadingFavorites(true);
      const favs = await getFavorites(user.uid);
      setFavoritesCount(favs.length);
      setLoadingFavorites(false);
    }
    fetchFavorites();
  }, [user, authLoading, router]);

  if (authLoading || loadingFavorites || !user) {
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account details and preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
                <p className="text-sm font-medium">Email</p>
                <p className="text-muted-foreground">{user.email}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium">Favorites</p>
                <div className="flex items-center text-muted-foreground">
                    <Heart className="w-4 h-4 mr-2 text-red-500 fill-red-500" />
                    <span>{favoritesCount} videos</span>
                </div>
            </div>
            <Button onClick={signOut} className="w-full">
              Log Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
