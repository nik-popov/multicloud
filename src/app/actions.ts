'use server';

import {validateAndFilterUrl} from '@/ai/flows/validate-and-filter-urls';
import {z} from 'zod';

const actionSchema = z.object({
  url: z.string().min(1, {message: 'URL cannot be empty.'}),
});

export type ValidationState = {
  validUrl: string | null;
  error: string | null;
};

export async function validateUrlAction(
  url: string
): Promise<ValidationState> {
  const validatedFields = actionSchema.safeParse({url});

  if (!validatedFields.success) {
    return {
      validUrl: null,
      error: validatedFields.error.errors.map(e => e.message).join(', '),
    };
  }

  try {
    const result = await validateAndFilterUrl({
      url: validatedFields.data.url,
    });

    if (result.isValid) {
      return {validUrl: validatedFields.data.url, error: null};
    } else {
      return {validUrl: null, error: null}; // Not an error, just invalid
    }
  } catch (e) {
    console.error(e);
    return {
      validUrl: null,
      error: `An error occurred while validating ${url}.`,
    };
  }
}
