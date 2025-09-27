'use client';

import { validateUrlsAction, type ValidationState } from '@/app/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { UrlList } from './url-list';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Validating...
        </>
      ) : (
        'Validate URLs'
      )}
    </Button>
  );
}

export function UrlProcessor() {
  const initialState: ValidationState = { data: null, error: null };
  const [state, formAction] = useActionState(validateUrlsAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.data) {
      if (state.data.length > 0) {
        formRef.current?.reset();
      }
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.data]);

  return (
    <div className="space-y-8">
      <Card className="w-full shadow-lg">
        <form action={formAction} ref={formRef}>
          <CardHeader>
            <CardTitle>URL Validator</CardTitle>
            <CardDescription>
              Paste your list of URLs below. Our AI will clean it up for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              name="urls"
              placeholder={`https://example.com/video1\nhttps://anothersite.org/media\n...and so on`}
              className="min-h-[150px] resize-y font-mono text-sm"
              required
            />
          </CardContent>
          <CardFooter className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SubmitButton />
            {state.error && (
              <Alert
                variant="destructive"
                className="w-full flex-grow sm:w-auto"
              >
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
          </CardFooter>
        </form>
      </Card>

      <div ref={resultRef}>
        {state.data && state.data.length > 0 && <UrlList urls={state.data} />}
      </div>
    </div>
  );
}
