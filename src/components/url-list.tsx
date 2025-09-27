'use client';

import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type UrlListProps = {
  urls: string[];
};

export function UrlList({ urls }: UrlListProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => {
        setHasCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  const handleCopy = () => {
    navigator.clipboard.writeText(urls.join('\n')).then(() => {
      setHasCopied(true);
      toast({
        title: 'Copied to clipboard!',
        description: `${urls.length} URLs are ready to be pasted.`,
      });
    });
  };

  return (
    <Card className="w-full bg-transparent shadow-none border-0">
      <CardHeader className="flex flex-row items-center justify-between px-0 pb-4">
        <CardTitle>Validated URLs ({urls.length})</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          aria-label="Copy URLs"
        >
          {hasCopied ? (
            <ClipboardCheck className="h-5 w-5" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 rounded-md border bg-secondary p-4">
          <div className="flex flex-col gap-2">
            {urls.map((url, index) => (
              <p key={index} className="break-all font-mono text-sm">
                {url}
              </p>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
