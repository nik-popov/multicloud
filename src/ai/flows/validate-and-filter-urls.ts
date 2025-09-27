'use server';

/**
 * @fileOverview A flow for validating and filtering URLs using AI.
 *
 * - validateAndFilterUrls - A function that validates a list of URLs and removes invalid ones.
 * - ValidateAndFilterUrlsInput - The input type for the validateAndFilterUrls function.
 * - ValidateAndFilterUrlsOutput - The return type for the validateAndFilterUrls function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateAndFilterUrlsInputSchema = z.object({
  urls: z
    .string()
    .describe('A list of URLs, separated by newlines.')
});
export type ValidateAndFilterUrlsInput = z.infer<typeof ValidateAndFilterUrlsInputSchema>;

const ValidateAndFilterUrlsOutputSchema = z.object({
  validUrls: z.array(z.string()).describe('A list of valid URLs.'),
});
export type ValidateAndFilterUrlsOutput = z.infer<typeof ValidateAndFilterUrlsOutputSchema>;

export async function validateAndFilterUrls(input: ValidateAndFilterUrlsInput): Promise<ValidateAndFilterUrlsOutput> {
  return validateAndFilterUrlsFlow(input);
}

const validateUrlsPrompt = ai.definePrompt({
  name: 'validateUrlsPrompt',
  input: {schema: ValidateAndFilterUrlsInputSchema},
  output: {schema: ValidateAndFilterUrlsOutputSchema},
  prompt: `You are an expert at determining whether a URL is valid or not.

  Given a list of URLs, determine which ones are valid and return them in a list.

  URLs:\n{{urls}}`,
});

const validateAndFilterUrlsFlow = ai.defineFlow(
  {
    name: 'validateAndFilterUrlsFlow',
    inputSchema: ValidateAndFilterUrlsInputSchema,
    outputSchema: ValidateAndFilterUrlsOutputSchema,
  },
  async input => {
    const {output} = await validateUrlsPrompt(input);
    return output!;
  }
);
