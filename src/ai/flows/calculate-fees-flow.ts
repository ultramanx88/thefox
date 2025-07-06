'use server';

/**
 * @fileOverview A fee calculation service for an e-commerce platform.
 *
 * - calculateFees - A function that calculates various fees and earnings based on order details.
 * - CalculateFeesInput - The input type for the calculateFees function.
 * - CalculateFeesOutput - The return type for the calculateFees function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CalculateFeesInputSchema = z.object({
  order_value: z.number().positive().describe('The value of the order in THB.'),
  delivery_distance: z
    .number()
    .positive()
    .describe('The delivery distance in kilometers.'),
  service_type: z
    .enum(['normal', 'express', 'premium'])
    .describe('The type of delivery service.'),
  store_category: z
    .enum(['food', 'retail', 'grocery'])
    .describe('The category of the store.'),
});
export type CalculateFeesInput = z.infer<typeof CalculateFeesInputSchema>;

const CalculateFeesOutputSchema = z.object({
  delivery_fee: z.number().describe('The calculated delivery fee for the customer.'),
  service_fee: z.number().describe('The platform service fee charged to the customer.'),
  commission: z.number().describe('The commission fee taken from the store for the order.'),
  platform_revenue: z.number().describe('The total revenue for the platform from this order (service_fee + commission).'),
  driver_earning: z.number().describe('The amount earned by the driver for this delivery.'),
  store_earning: z.number().describe('The net amount earned by the store after commission.'),
  customer_total: z.number().describe('The total amount the customer has to pay.'),
  platform_profit_percentage: z.number().describe('The platform revenue as a percentage of the total customer payment.'),
});
export type CalculateFeesOutput = z.infer<typeof CalculateFeesOutputSchema>;

/**
 * Calculates various fees and earnings for an e-commerce order.
 * @param input The order details.
 * @returns A detailed breakdown of fees and earnings.
 */
export async function calculateFees(
  input: CalculateFeesInput
): Promise<CalculateFeesOutput> {
  return calculateFeesFlow(input);
}

const calculateFeesFlow = ai.defineFlow(
  {
    name: 'calculateFeesFlow',
    inputSchema: CalculateFeesInputSchema,
    outputSchema: CalculateFeesOutputSchema,
  },
  async (input) => {
    const { order_value, delivery_distance, service_type, store_category } = input;

    // 1. Calculate Delivery Fee
    let delivery_fee = 30.0;
    if (delivery_distance > 3) {
      delivery_fee += (delivery_distance - 3) * 10;
    }
    if (service_type === 'express') {
      delivery_fee += 25;
    } else if (service_type === 'premium') {
      delivery_fee += 50;
    }

    // 2. Calculate Service Fee
    const service_fee = Math.max(order_value * 0.03, 15);

    // 3. Calculate Commission
    let commission_rate: number;
    switch (store_category) {
      case 'food':
        commission_rate = 0.2;
        break;
      case 'retail':
        commission_rate = 0.12;
        break;
      case 'grocery':
        commission_rate = 0.15;
        break;
    }
    const commission = order_value * commission_rate;

    // Calculate derived values
    const customer_total = order_value + delivery_fee + service_fee;
    const driver_earning = delivery_fee; // Driver earns the full delivery fee
    const store_earning = order_value - commission;
    const platform_revenue = service_fee + commission;
    
    // Avoid division by zero if customer_total is somehow zero
    const platform_profit_percentage =
      customer_total > 0 ? (platform_revenue / customer_total) * 100 : 0;
      
    return {
      delivery_fee,
      service_fee,
      commission,
      platform_revenue,
      driver_earning,
      store_earning,
      customer_total,
      platform_profit_percentage,
    };
  }
);
