// 'use server';

/**
 * @fileOverview Implements intent-based search functionality using Genkit.
 *
 * - intentBasedSearch - A function that takes a user's search query and returns relevant product names.
 * - IntentBasedSearchInput - The input type for the intentBasedSearch function.
 * - IntentBasedSearchOutput - The return type for the intentBasedSearch function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntentBasedSearchInputSchema = z.object({
  query: z.string().describe('The user\u2019s search query describing the desired toy.'),
});
export type IntentBasedSearchInput = z.infer<typeof IntentBasedSearchInputSchema>;

const IntentBasedSearchOutputSchema = z.object({
  productNames: z
    .array(z.string())
    .describe('An array of product names that are relevant to the search query.'),
});
export type IntentBasedSearchOutput = z.infer<typeof IntentBasedSearchOutputSchema>;

export async function intentBasedSearch(input: IntentBasedSearchInput): Promise<IntentBasedSearchOutput> {
  return intentBasedSearchFlow(input);
}

const intentBasedSearchPrompt = ai.definePrompt({
  name: 'intentBasedSearchPrompt',
  input: {schema: IntentBasedSearchInputSchema},
  output: {schema: IntentBasedSearchOutputSchema},
  prompt: `You are an assistant that helps users find products based on their intent.

  Given the following user query:
  {{query}}

  Return a list of product names that are relevant to the query.
  The product names should be specific and come from the available products.
  If no products are relevant, return an empty array.
  Ensure that the product names are accurate and correspond to actual products.

  Here are some examples:
  User query: a small blue elephant for a baby
  Product names: ["Baby Blue Elephant", "Small Stuffed Elephant"]

  User query: a wooden train set for toddlers
  Product names: ["Classic Wooden Train Set", "Toddler Train Adventure"]

  User query: a pink unicorn for a girl
  Product names: ["Princess Unicorn", "Sparkle Unicorn"]
  `,
});

const intentBasedSearchFlow = ai.defineFlow(
  {
    name: 'intentBasedSearchFlow',
    inputSchema: IntentBasedSearchInputSchema,
    outputSchema: IntentBasedSearchOutputSchema,
  },
  async input => {
    const {output} = await intentBasedSearchPrompt(input);
    return output!;
  }
);
