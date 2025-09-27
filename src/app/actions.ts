'use server';

import { validateAndFilterUrls } from '@/ai/flows/validate-and-filter-urls';
import { z } from 'zod';

const actionSchema = z.object({
  urls: z.string().min(1, { message: 'Please enter at least one URL.' }),
});

export type ValidationState = {
  data: string[] | null;
  error: string | null;
};

export async function validateUrlsAction(
  prevState: ValidationState,
  formData: FormData
): Promise<ValidationState> {
  const rawInput = {
    urls: formData.get('urls'),
  };

  const validatedFields = actionSchema.safeParse(rawInput);

  if (!validatedFields.success) {
    return {
      data: null,
      error: validatedFields.error.errors.map((e) => e.message).join(', '),
    };
  }

  try {
    const result = await validateAndFilterUrls({
      urls: validatedFields.data.urls,
    });
    if (result.validUrls.length === 0) {
      return {
        data: [],
        error: 'No valid URLs were found. Please check your list and try again.',
      };
    }
    return { data: result.validUrls, error: null };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error:
        'An unexpected error occurred while validating URLs. Please try again later.',
    };
  }
}
