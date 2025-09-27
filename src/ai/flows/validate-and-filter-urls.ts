'use server';

/**
 * @fileOverview A flow for validating and filtering a single URL using AI.
 *
 * - validateAndFilterUrl - A function that validates a single URL.
 * - ValidateAndFilterUrlInput - The input type for the validateAndFilterUrl function.
 * - ValidateAndFilterUrlOutput - The return type for the validateAndFilterUrl function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateAndFilterUrlInputSchema = z.object({
  url: z.string().describe('A single URL to validate.'),
});
export type ValidateAndFilterUrlInput = z.infer<typeof ValidateAndFilterUrlInputSchema>;

const ValidateAndFilterUrlOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the URL is valid or not.'),
});
export type ValidateAndFilterUrlOutput = z.infer<typeof ValidateAndFilterUrlOutputSchema>;

export async function validateAndFilterUrl(
  input: ValidateAndFilterUrlInput
): Promise<ValidateAndFilterUrlOutput> {
  return validateAndFilterUrlFlow(input);
}

const validateUrlPrompt = ai.definePrompt({
  name: 'validateUrlPrompt',
  input: {schema: ValidateAndFilterUrlInputSchema},
  output: {schema: ValidateAndFilterUrlOutputSchema},
  prompt: `You are an expert at determining whether a URL is a valid video URL.
  
  Given a URL, determine if it is a valid, publicly accessible video URL.
  The URL should point directly to a video file (e.g., .mp4, .mov, .webm).
  
  URL: {{url}}`,
});

const validateAndFilterUrlFlow = ai.defineFlow(
  {
    name: 'validateAndFilterUrlFlow',
    inputSchema: ValidateAndFilterUrlInputSchema,
    outputSchema: ValidateAndFilterUrlOutputSchema,
  },
  async input => {
    const {output} = await validateUrlPrompt(input);
    return output!;
  }
);
