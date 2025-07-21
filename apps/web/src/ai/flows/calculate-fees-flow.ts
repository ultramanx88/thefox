'use server';

/**
 * @fileOverview A fee calculation service for an e-commerce platform.
 *
 * - calculateFees - A function that calculates various fees and earnings based on order details and fee configurations.
 * - CalculateFeesInput - The input type for the calculateFees function.
 * - CalculateFeesOutput - The return type for the calculateFees function.
 */

// Temporarily disabled for build
// import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FeeConfigSchema = z.object({
  base_delivery_fee: z.number().describe('The base fee for any delivery in THB.'),
  delivery_fee_per_km: z.number().describe('The additional fee per kilometer after the initial distance.'),
  express_surcharge: z.number().describe('The surcharge for express service in THB.'),
  premium_surcharge: z.number().describe('The surcharge for premium service in THB.'),
  service_fee_percentage: z.number().describe('The platform service fee as a percentage of the order value.'),
  min_service_fee: z.number().describe('The minimum platform service fee in THB.'),
  food_commission_rate: z.number().describe('The commission rate for food stores as a percentage.'),
  retail_commission_rate: z.number().describe('The commission rate for retail stores as a percentage.'),
  grocery_commission_rate: z.number().describe('The commission rate for grocery stores as a percentage.'),
});

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
  config: FeeConfigSchema.describe('The configuration object for all fee calculations.'),
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
 * Calculates various fees and earnings for an e-commerce order based on dynamic configuration.
 * @param input The order details and fee configuration.
 * @returns A detailed breakdown of fees and earnings.
 */
export async function calculateFees(
  input: CalculateFeesInput
): Promise<CalculateFeesOutput> {
    const { order_value, delivery_distance, service_type, store_category, config } = input;

    // 1. Calculate Delivery Fee
    let delivery_fee = config.base_delivery_fee;
    if (delivery_distance > 3) {
      delivery_fee += (delivery_distance - 3) * config.delivery_fee_per_km;
    }
    if (service_type === 'express') {
      delivery_fee += config.express_surcharge;
    } else if (service_type === 'premium') {
      delivery_fee += config.premium_surcharge;
    }

    // 2. Calculate Service Fee
    const service_fee = Math.max(order_value * (config.service_fee_percentage / 100), config.min_service_fee);

    // 3. Calculate Commission
    let commission_rate: number;
    switch (store_category) {
      case 'food':
        commission_rate = config.food_commission_rate / 100;
        break;
      case 'retail':
        commission_rate = config.retail_commission_rate / 100;
        break;
      case 'grocery':
        commission_rate = config.grocery_commission_rate / 100;
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
