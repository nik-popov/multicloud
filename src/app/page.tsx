import { UrlProcessor } from '@/components/url-processor';
import { VideoPlayer } from '@/components/video-player';
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
          Your one-stop tool to validate, clean, and manage video URLs with the
          power of AI.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UrlProcessor />
        </div>
        <div className="lg:col-span-2">
          <div className="space-y-8">
            <VideoPlayer />
            <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex items-center gap-3">
                <Flame className="h-6 w-6 text-accent" />
                <h3 className="text-lg font-semibold">Powered by AI</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Our generative AI works like a human assistant, intelligently
                identifying and filtering out invalid URLs from your list.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
