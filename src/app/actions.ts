'use server';

import {validateAndFilterUrls} from '@/ai/flows/validate-and-filter-urls';
import {z} from 'zod';

const actionSchema = z.object({
  urls: z.array(z.string().min(1, {message: 'URL cannot be empty.'})).min(1),
});

export type ValidationState = {
  validUrls: string[];
  errors: string[] | null;
};

export async function validateUrlsAction(
  urls: string[]
): Promise<ValidationState> {
  const validatedFields = actionSchema.safeParse({urls});

  if (!validatedFields.success) {
    return {
      validUrls: [],
      errors: validatedFields.error.errors.map(e => e.message),
    };
  }

  try {
    const result = await validateAndFilterUrls({
      urls: validatedFields.data.urls,
    });

    const validUrls = result.validatedUrls
      .filter(item => item.isValid)
      .map(item => item.originalUrl);

    return {validUrls, errors: null};
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      validUrls: [],
      errors: [`An error occurred during validation: ${errorMessage}`],
    };
  }
}
