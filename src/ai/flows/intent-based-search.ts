'use server';

/**
 * @fileOverview Enhanced intent-based search functionality using existing product data.
 *
 * - intentBasedSearch - A function that takes a user's search query and returns relevant product names.
 * - IntentBasedSearchInput - The input type for the intentBasedSearch function.
 * - IntentBasedSearchOutput - The return type for the intentBasedSearch function.
 */

import {ai} from '@/ai/genkit';
import { getPublicProducts } from '@/lib/mock-data';
import {z} from 'genkit';

// Keep your existing input schema - no changes needed
const IntentBasedSearchInputSchema = z.object({
  query: z.string().describe("The user's search query describing the desired toy."),
});
export type IntentBasedSearchInput = z.infer<typeof IntentBasedSearchInputSchema>;

// Keep your existing product schema - works with current data
const ProductSchema = z.object({
    name: z.string(),
    description: z.string(),
    category: z.string(),
    imageUrl: z.string().url(),
});
export type ProductInput = z.infer<typeof ProductSchema>;

// Enhanced prompt input schema
const PromptInputSchema = z.object({
    query: z.string().describe("The user's search query describing the desired toy."),
    availableProducts: z.array(ProductSchema).describe('An array of available products with their details and image URL.'),
});

// Enhanced output with better matching info
const IntentBasedSearchOutputSchema = z.object({
  productNames: z
    .array(z.string())
    .describe('An array of product names from the available list that are relevant to the search query, ordered by relevance.'),
  reasoning: z.string().optional().describe('Brief explanation of the matching strategy used.'),
});
export type IntentBasedSearchOutput = z.infer<typeof IntentBasedSearchOutputSchema>;

export async function intentBasedSearch(input: IntentBasedSearchInput): Promise<IntentBasedSearchOutput> {
  return intentBasedSearchFlow(input);
}

const intentBasedSearchPrompt = ai.definePrompt({
  name: 'intentBasedSearchPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: IntentBasedSearchOutputSchema},
  prompt: `You are an expert e-commerce search assistant for "TheYarnZoo" toy store. Your goal is to understand user intent and match it to products using advanced analysis of available data.

ENHANCED ANALYSIS APPROACH:
Analyze the user's query for these key aspects:

1. **CORE KEYWORDS & SYNONYMS**
   - Direct matches: "bear" → "teddy bear", "elephant" → "elephant toy"
   - Synonyms: "bunny" = "rabbit", "car" = "vehicle" = "automobile"
   - Variations: "dog" = "puppy" = "canine", "cat" = "kitty" = "feline"

2. **DESCRIPTIVE ATTRIBUTES** (extract from name/description/category):
   - Colors: red, blue, green, pink, rainbow, colorful
   - Sizes: big, small, large, tiny, mini, giant
   - Textures: soft, plush, fuzzy, smooth, cuddly
   - Materials: wooden, plastic, fabric, stuffed
   - Emotions: cute, adorable, scary, friendly, cozy

3. **FUNCTIONAL INTENT**
   - Purpose: "educational" → learning toys, "comfort" → plush toys
   - Age clues: "baby" → infant toys, "toddler" → age-appropriate
   - Use context: "bedtime" → comfort toys, "bath" → water-safe

4. **THEMATIC MATCHING**
   - Animals: specific species, habitats (jungle, farm, ocean)
   - Characters: cartoon, movie, book characters
   - Themes: space, vehicles, fantasy, holidays
   - Collections: matching sets, series

5. **ADVANCED IMAGE ANALYSIS**
   - Visual confirmation of colors mentioned in query
   - Shape and form matching (round, tall, flat)
   - Style recognition (realistic vs cartoon)
   - Size estimation from visual cues

MATCHING STRATEGIES:
- **Exact Match**: Query directly describes product name or key features
- **Semantic Match**: Understanding intent behind words (e.g., "something soft" → plush toys)
- **Visual Confirmation**: Use product images to verify described attributes
- **Context Inference**: Understand implied needs ("for my 2-year-old" → age-appropriate)
- **Broad to Specific**: Start with category, narrow down by attributes

SPECIAL HANDLING:
- **Vague Queries**: "something fun" → look for engaging, interactive products
- **Emotional Queries**: "cute animal" → focus on adorable animal toys
- **Negative Queries**: "not scary" → avoid products that might seem intimidating
- **Comparison Queries**: "like X but different" → find similar items with variations

USER QUERY: "{{query}}"

AVAILABLE PRODUCTS:
{{#each availableProducts}}
- Name: {{name}}
  Description: {{description}}
  Category: {{category}}
  Image: {{media url=imageUrl}}
---
{{/each}}

INSTRUCTIONS:
1. Analyze the query for ALL possible meanings and implications
2. Look for matches in product names, descriptions, and categories
3. Use the product image to verify visual characteristics mentioned
4. Consider both obvious and subtle connections
5. Rank matches by relevance (most relevant first)
6. Return 3-5 most relevant products (fewer if very specific query)
7. If no strong matches, return 1-2 products that might be somewhat relevant
8. Provide brief reasoning for your matching approach

Focus on understanding user INTENT rather than just keyword matching. Be creative in connecting user needs to available products.`,
});

const intentBasedSearchFlow = ai.defineFlow(
  {
    name: 'intentBasedSearchFlow',
    inputSchema: IntentBasedSearchInputSchema,
    outputSchema: IntentBasedSearchOutputSchema,
  },
  async (input) => {
    // Fetch all products from the database
    const products = await getPublicProducts();
    
    // Use existing product structure - no changes needed
    const availableProducts: ProductInput[] = products.map(p => ({
        name: p.name,
        description: p.description,
        category: p.category,
        imageUrl: p.images[0] || 'https://placehold.co/100x100.png',
    }));

    // Call the enhanced prompt
    const {output} = await intentBasedSearchPrompt({
      query: input.query,
      availableProducts: availableProducts,
    });
    
    return output || { productNames: [], reasoning: 'No matches found' };
  }
);

// Optional: Helper function to analyze your existing product data
// This can help you understand what attributes are commonly mentioned
export async function analyzeProductData(products: any[]) {
  const analysis = {
    commonColors: new Set<string>(),
    commonMaterials: new Set<string>(),
    commonSizes: new Set<string>(),
    commonAnimals: new Set<string>(),
    commonThemes: new Set<string>(),
  };

  const colorWords = ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'black', 'white', 'rainbow'];
  const materialWords = ['plush', 'wooden', 'plastic', 'fabric', 'soft', 'stuffed'];
  const sizeWords = ['big', 'small', 'large', 'tiny', 'mini', 'giant'];
  const animalWords = ['bear', 'elephant', 'dog', 'cat', 'bunny', 'rabbit', 'lion', 'tiger', 'bird'];
  const themeWords = ['space', 'ocean', 'farm', 'jungle', 'forest', 'vehicle', 'car', 'train'];

  products.forEach(product => {
    const text = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    
    colorWords.forEach(word => text.includes(word) && analysis.commonColors.add(word));
    materialWords.forEach(word => text.includes(word) && analysis.commonMaterials.add(word));
    sizeWords.forEach(word => text.includes(word) && analysis.commonSizes.add(word));
    animalWords.forEach(word => text.includes(word) && analysis.commonAnimals.add(word));
    themeWords.forEach(word => text.includes(word) && analysis.commonThemes.add(word));
  });

  return {
    commonColors: Array.from(analysis.commonColors),
    commonMaterials: Array.from(analysis.commonMaterials),
    commonSizes: Array.from(analysis.commonSizes),
    commonAnimals: Array.from(analysis.commonAnimals),
    commonThemes: Array.from(analysis.commonThemes),
  };
}