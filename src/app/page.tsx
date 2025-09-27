import { UrlProcessor } from '@/components/url-processor';
import { Flame } from 'lucide-react';

export default function Home() {
  return (
    <main className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <header className="mb-12 text-center">
        <h1 className="font-headline flex items-center justify-center gap-3 text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          bulkshorts
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The fastest way to validate, clean, and discover short-form video content with the
          power of AI.
        </p>
      </header>
      <UrlProcessor />
    </main>
  );
}
