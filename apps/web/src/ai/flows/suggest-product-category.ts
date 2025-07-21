// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview An AI agent that suggests relevant product categories based on an image.
 *
 * - suggestProductCategory - A function that handles the product category suggestion process.
 * - SuggestProductCategoryInput - The input type for the suggestProductCategory function.
 * - SuggestProductCategoryOutput - The return type for the suggestProductCategory function.
 */

// Temporarily disabled for build
// import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SuggestProductCategoryInputSchema = z.object({
  productImage: z
    .string()
    .describe(
      "A product image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestProductCategoryInput = z.infer<typeof SuggestProductCategoryInputSchema>;

const SuggestProductCategoryOutputSchema = z.object({
  suggestedCategories: z
    .array(z.string())
    .describe('An array of suggested product categories.'),
});
export type SuggestProductCategoryOutput = z.infer<typeof SuggestProductCategoryOutputSchema>;

export async function suggestProductCategory(
  input: SuggestProductCategoryInput
): Promise<SuggestProductCategoryOutput> {
  // Mock implementation for build
  return {
    suggestedCategories: ['Electronics', 'General']
  };
}
