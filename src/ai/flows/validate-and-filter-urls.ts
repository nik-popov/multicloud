'use server';

/**
 * @fileOverview A flow for validating and filtering a list of URLs using AI.
 *
 * - validateAndFilterUrls - A function that validates a list of URLs.
 * - ValidateAndFilterUrlsInput - The input type for the validateAndFilterUrls function.
 * - ValidateAndFilterUrlsOutput - The return type for the validateAndFilterUrls function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateAndFilterUrlsInputSchema = z.object({
  urls: z.array(z.string()).describe('A list of URLs to validate.'),
});
export type ValidateAndFilterUrlsInput = z.infer<
  typeof ValidateAndFilterUrlsInputSchema
>;

const ValidatedUrlSchema = z.object({
  originalUrl: z.string().describe('The original URL passed in.'),
  isValid: z
    .boolean()
    .describe('Whether the URL is a valid, publicly accessible video URL.'),
});

const ValidateAndFilterUrlsOutputSchema = z.object({
  validatedUrls: z
    .array(ValidatedUrlSchema)
    .describe('The list of validated URLs with their status.'),
});
export type ValidateAndFilterUrlsOutput = z.infer<
  typeof ValidateAndFilterUrlsOutputSchema
>;

export async function validateAndFilterUrls(
  input: ValidateAndFilterUrlsInput
): Promise<ValidateAndFilterUrlsOutput> {
  return validateAndFilterUrlsFlow(input);
}

const validateUrlsPrompt = ai.definePrompt({
  name: 'validateUrlsPrompt',
  input: {schema: ValidateAndFilterUrlsInputSchema},
  output: {schema: ValidateAndFilterUrlsOutputSchema},
  prompt: `You are an expert at determining whether a URL is a valid video URL.
  
  For each URL in the list, determine if it is a valid, publicly accessible video file URL (e.g., .mp4, .mov, .webm).
  Return a list of objects, where each object contains the original URL and a boolean \`isValid\` indicating if it's a valid video URL.

  URLs:
  {{#each urls}}
  - {{this}}
  {{/each}}`,
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
