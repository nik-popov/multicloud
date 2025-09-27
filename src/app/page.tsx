import { UrlProcessor } from '@/components/url-processor';
import { Flame } from 'lucide-react';

export default function Home() {
  return (
    <main className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <header className="mb-12 text-center">
        <h1 className="font-headline flex items-center justify-center gap-3 text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10 text-primary"
            aria-hidden="true"
          >
            <path d="M10 12.36S9 12 8 12s-3 1-3 3 2 3 3 3 3-1 3-3" />
            <path d="M14 12.36S15 12 16 12s3 1 3 3-2 3-3 3-3-1-3-3" />
            <path d="M22 9V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
            <path d="m18 14 4-4" />
            <path d="m14 10 8 8" />
          </svg>
          VideoBucket
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your one-stop tool to validate, clean, and discover video content with the
          power of AI.
        </p>
      </header>
      <UrlProcessor />
    </main>
  );
}
