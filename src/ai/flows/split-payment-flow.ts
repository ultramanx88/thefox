'use server';

/**
 * @fileOverview An automated payment splitting service for an e-commerce platform.
 *
 * - splitPayment - A function that calculates the split of a total amount between store, driver, and platform.
 * - SplitPaymentInput - The input type for the splitPayment function.
 * - SplitPaymentOutput - The return type for the splitPayment function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SplitPaymentInputSchema = z.object({
  total_amount: z.number().positive().describe('The total amount paid by the customer in THB.'),
  store_percentage: z.number().min(0).max(100).optional().default(80).describe('The percentage the store receives.'),
  driver_percentage: z.number().min(0).max(100).optional().default(5).describe('The percentage the driver receives.'),
  platform_percentage: z.number().min(0).max(100).optional().default(15).describe('The percentage the platform receives.'),
}).refine(
    (data) => data.store_percentage + data.driver_percentage + data.platform_percentage === 100,
    {
        message: "The sum of all percentages must be exactly 100.",
        path: ["store_percentage", "driver_percentage", "platform_percentage"],
    }
);
export type SplitPaymentInput = z.infer<typeof SplitPaymentInputSchema>;

const SplitPaymentOutputSchema = z.object({
  total_amount: z.number().describe('The original total amount from the input.'),
  store_amount: z.number().describe('The calculated amount the store receives.'),
  driver_amount: z.number().describe('The calculated amount the driver receives.'),
  platform_amount: z.number().describe('The calculated amount the platform receives.'),
  splits: z.object({
    store_percentage: z.number().describe('The percentage used for the store split.'),
    driver_percentage: z.number().describe('The percentage used for the driver split.'),
    platform_percentage: z.number().describe('The percentage used for the platform split.'),
  }),
  verification: z.object({
    sum_check: z.number().describe('The sum of all calculated splits.'),
    is_valid: z.boolean().describe('Whether the sum of splits equals the total amount.'),
  }),
});
export type SplitPaymentOutput = z.infer<typeof SplitPaymentOutputSchema>;

/**
 * Calculates the automatic splitting of funds from a total payment.
 * @param input The total amount and the percentages for splitting.
 * @returns A detailed breakdown of the amounts for store, driver, and platform.
 */
export async function splitPayment(
  input: SplitPaymentInput
): Promise<SplitPaymentOutput> {
  return splitPaymentFlow(input);
}

const splitPaymentFlow = ai.defineFlow(
  {
    name: 'splitPaymentFlow',
    inputSchema: SplitPaymentInputSchema,
    outputSchema: SplitPaymentOutputSchema,
  },
  async (input) => {
    const { total_amount, store_percentage, driver_percentage, platform_percentage } = input;

    // Calculate amounts
    const store_amount = total_amount * (store_percentage / 100);
    const driver_amount = total_amount * (driver_percentage / 100);
    const platform_amount = total_amount * (platform_percentage / 100);

    // Verification
    const sum_check = store_amount + driver_amount + platform_amount;
    // Use a small tolerance for floating point comparison
    const is_valid = Math.abs(sum_check - total_amount) < 0.001; 

    return {
      total_amount,
      store_amount,
      driver_amount,
      platform_amount,
      splits: {
        store_percentage,
        driver_percentage,
        platform_percentage,
      },
      verification: {
        sum_check,
        is_valid,
      },
    };
  }
);
