'use server';

import { intentBasedSearch, type IntentBasedSearchInput, type IntentBasedSearchOutput } from '@/ai/flows/intent-based-search';
import { z } from 'zod';

const SearchActionInputSchema = z.object({
  query: z.string().min(3, "Search query must be at least 3 characters long."),
});

export async function intentBasedSearchAction(input: IntentBasedSearchInput): Promise<IntentBasedSearchOutput> {
  const validatedInput = SearchActionInputSchema.safeParse(input);
  if (!validatedInput.success) {
    // This error handling is basic. In a real app, you'd return structured errors.
    throw new Error(validatedInput.error.errors.map(e => e.message).join(', '));
  }

  try {
    const result = await intentBasedSearch(validatedInput.data);
    return result;
  } catch (error) {
    console.error('Error in intentBasedSearchAction:', error);
    // Consider returning a more user-friendly error structure
    return { productNames: [] }; // Or throw a custom error
  }
}
