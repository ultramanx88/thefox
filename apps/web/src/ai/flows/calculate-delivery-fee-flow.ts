'use server';

/**
 * @fileOverview An intelligent delivery fee calculation system.
 *
 * - calculateDeliveryFee - A function that calculates delivery costs based on package details, distance, and service level.
 * - CalculateDeliveryFeeInput - The input type for the calculateDeliveryFee function.
 * - CalculateDeliveryFeeOutput - The return type for the calculateDeliveryFee function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VehicleTypes = z.enum(['motorcycle', 'car', 'van', 'pickup_truck', 'large_truck']);

const CalculateDeliveryFeeInputSchema = z.object({
  package_weight: z.number().positive().describe('Weight of the package in kilograms.'),
  distance: z.number().positive().describe('Delivery distance in kilometers.'),
  package_dimensions: z.object({
    length: z.number().positive().describe('Length of the package in cm.'),
    width: z.number().positive().describe('Width of the package in cm.'),
    height: z.number().positive().describe('Height of the package in cm.'),
  }).describe('Dimensions of the package.'),
  urgency_level: z.enum(['normal', 'express', 'urgent']).describe('The urgency of the delivery.'),
  special_handling: z.array(z.enum(['fragile', 'liquid', 'electronics'])).optional().describe('Any special handling requirements.'),
  pickup_floor: z.number().int().min(0).max(50).describe('The floor for pickup.'),
  delivery_floor: z.number().int().min(0).max(50).describe('The floor for delivery.'),
  has_elevator_pickup: z.boolean().describe('Whether there is an elevator at the pickup location.'),
  has_elevator_delivery: z.boolean().describe('Whether there is an elevator at the delivery location.'),
});
export type CalculateDeliveryFeeInput = z.infer<typeof CalculateDeliveryFeeInputSchema>;

const CalculateDeliveryFeeOutputSchema = z.object({
  package_analysis: z.object({
    weight: z.number().describe('The package weight in kg.'),
    volume: z.number().describe('The package volume in cubic meters.'),
    recommended_vehicle: VehicleTypes.describe('The most suitable vehicle for the delivery.'),
    vehicle_capacity_usage: z.number().describe('The percentage of the vehicle\'s capacity (weight or volume) that is used.'),
  }),
  cost_breakdown: z.object({
    base_fee: z.number().describe('The base fee according to the vehicle type.'),
    distance_fee: z.number().describe('The additional fee based on distance.'),
    weight_fee: z.number().describe('The additional fee based on weight.'),
    special_handling_fee: z.number().describe('The surcharge for special handling requirements.'),
    floor_fee: z.number().describe('The surcharge for handling items on higher floors.'),
    urgency_multiplier: z.number().describe('The multiplier based on the urgency level.'),
  }),
  final_cost: z.object({
    delivery_fee: z.number().describe('The total calculated delivery fee before platform fees.'),
    driver_earning: z.number().describe('The portion of the fee that goes to the driver.'),
    platform_fee: z.number().describe('The portion of the fee that goes to the platform.'),
    total_cost: z.number().describe('The total cost for the customer (delivery fee + platform fee).'),
  }),
  estimated_time: z.object({
    pickup_time_minutes: z.number().describe('Estimated time to complete pickup in minutes.'),
    delivery_time_minutes: z.number().describe('Estimated travel time for delivery in minutes.'),
    total_time_minutes: z.number().describe('Total estimated time for the job in minutes.'),
  }),
});
export type CalculateDeliveryFeeOutput = z.infer<typeof CalculateDeliveryFeeOutputSchema>;

/**
 * Calculates a comprehensive delivery fee based on multiple factors.
 * @param input The detailed parameters of the delivery job.
 * @returns A detailed breakdown of costs, vehicle analysis, and time estimates.
 */
export async function calculateDeliveryFee(
  input: CalculateDeliveryFeeInput
): Promise<CalculateDeliveryFeeOutput> {
  return calculateDeliveryFeeFlow(input);
}

const calculateDeliveryFeeFlow = ai.defineFlow(
  {
    name: 'calculateDeliveryFeeFlow',
    inputSchema: CalculateDeliveryFeeInputSchema,
    outputSchema: CalculateDeliveryFeeOutputSchema,
  },
  async (input) => {
    const {
        package_weight,
        distance,
        package_dimensions,
        urgency_level,
        special_handling = [],
        pickup_floor,
        delivery_floor,
        has_elevator_pickup,
        has_elevator_delivery
    } = input;

    // 1. Package Analysis
    const volume_m3 = (package_dimensions.length * package_dimensions.width * package_dimensions.height) / 1_000_000;
    const max_dimension_cm = Math.max(package_dimensions.length, package_dimensions.width, package_dimensions.height);

    // Vehicle Selection Logic
    let vehicle: z.infer<typeof VehicleTypes>;
    let vehicle_config: { max_weight: number, max_volume: number, base_fee: number, weight_fee_threshold: number, weight_fee_rate: number };

    if (package_weight <= 15 && max_dimension_cm <= 60) {
        vehicle = 'motorcycle';
        vehicle_config = { max_weight: 15, max_volume: 0.1, base_fee: 35, weight_fee_threshold: 10, weight_fee_rate: 5 };
    } else if (package_weight <= 50 && volume_m3 <= 0.5) {
        vehicle = 'car';
        vehicle_config = { max_weight: 50, max_volume: 0.5, base_fee: 65, weight_fee_threshold: 30, weight_fee_rate: 3 };
    } else if (package_weight <= 200 && volume_m3 <= 2) {
        vehicle = 'van';
        vehicle_config = { max_weight: 200, max_volume: 2, base_fee: 125, weight_fee_threshold: 100, weight_fee_rate: 2 };
    } else if (package_weight <= 500 && volume_m3 <= 5) {
        vehicle = 'pickup_truck';
        vehicle_config = { max_weight: 500, max_volume: 5, base_fee: 200, weight_fee_threshold: 300, weight_fee_rate: 1 };
    } else {
        vehicle = 'large_truck';
        vehicle_config = { max_weight: 1000, max_volume: 10, base_fee: 325, weight_fee_threshold: 500, weight_fee_rate: 0.5 };
    }

    const weight_usage = (package_weight / vehicle_config.max_weight) * 100;
    const volume_usage = (volume_m3 / vehicle_config.max_volume) * 100;
    const vehicle_capacity_usage = Math.max(weight_usage, volume_usage);

    // 2. Cost Breakdown
    const base_fee = vehicle_config.base_fee;

    // Distance Fee
    let distance_fee = 0;
    if (distance > 30) {
        distance_fee += (15 * 10) + (15 * 15) + ((distance - 30) * 20);
    } else if (distance > 15) {
        distance_fee += (10 * 10) + ((distance - 15) * 15);
    } else if (distance > 5) {
        distance_fee += (distance - 5) * 10;
    }

    // Weight Fee
    const weight_surcharge = Math.max(0, package_weight - vehicle_config.weight_fee_threshold);
    const weight_fee = weight_surcharge * vehicle_config.weight_fee_rate;

    // Floor Fee
    let floor_fee = 0;
    if (has_elevator_pickup) {
        floor_fee += Math.max(0, pickup_floor - 3) * 10;
    } else {
        floor_fee += Math.max(0, pickup_floor - 2) * 15;
    }
    if (has_elevator_delivery) {
        floor_fee += Math.max(0, delivery_floor - 3) * 10;
    } else {
        floor_fee += Math.max(0, delivery_floor - 2) * 15;
    }

    // Special Handling Fee (as a percentage of subtotal)
    const subtotal_before_special = base_fee + distance_fee + weight_fee + floor_fee;
    let special_handling_percentage = 0;
    if (special_handling.includes('fragile')) special_handling_percentage += 0.25; // 25%
    if (special_handling.includes('liquid')) special_handling_percentage += 0.20; // 20%
    if (special_handling.includes('electronics')) special_handling_percentage += 0.30; // 30%
    const special_handling_fee = subtotal_before_special * special_handling_percentage;
    
    // Urgency Multiplier
    const urgency_multipliers = { normal: 1.0, express: 1.5, urgent: 2.0 };
    const urgency_multiplier = urgency_multipliers[urgency_level];

    // 3. Final Cost
    const subtotal_before_urgency = subtotal_before_special + special_handling_fee;
    const delivery_fee = subtotal_before_urgency * urgency_multiplier;
    const driver_earning = delivery_fee * 0.85; // Driver gets 85% of the calculated delivery fee
    const platform_fee = delivery_fee * 0.15; // Platform gets 15%
    const total_cost = delivery_fee; // Customer pays the delivery fee, which includes platform cut.

    // 4. Estimated Time
    let pickup_time_minutes = 5 + (pickup_floor / (has_elevator_pickup ? 2 : 1));
    let delivery_time_minutes = (distance * 2.5) + 5 + (delivery_floor / (has_elevator_delivery ? 2 : 1));
    const total_time_minutes = pickup_time_minutes + delivery_time_minutes;

    return {
      package_analysis: {
        weight: package_weight,
        volume: volume_m3,
        recommended_vehicle: vehicle,
        vehicle_capacity_usage: parseFloat(vehicle_capacity_usage.toFixed(2)),
      },
      cost_breakdown: {
        base_fee,
        distance_fee,
        weight_fee,
        special_handling_fee,
        floor_fee,
        urgency_multiplier,
      },
      final_cost: {
        delivery_fee: parseFloat(delivery_fee.toFixed(2)),
        driver_earning: parseFloat(driver_earning.toFixed(2)),
        platform_fee: parseFloat(platform_fee.toFixed(2)),
        total_cost: parseFloat(total_cost.toFixed(2)),
      },
      estimated_time: {
        pickup_time_minutes: Math.round(pickup_time_minutes),
        delivery_time_minutes: Math.round(delivery_time_minutes),
        total_time_minutes: Math.round(total_time_minutes),
      },
    };
  }
);
