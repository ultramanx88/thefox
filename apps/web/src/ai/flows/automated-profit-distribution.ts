'use server';

/**
 * @fileOverview An automated profit distribution system based on milestones.
 *
 * - automatedProfitDistribution - Calculates the distribution of daily profits among stakeholders.
 * - AutomatedProfitDistributionInput - The input type for the function.
 * - AutomatedProfitDistributionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const AutomatedProfitDistributionInputSchema = z.object({
  daily_total_revenue: z.number().positive().describe('The total revenue generated for the day.'),
  current_total_investment: z.number().nonnegative().describe('The current total investment pool amount.'),
  investors: z.array(z.object({
    id: z.string(),
    investment_amount: z.number().positive(),
  })).describe('An array of all investors and their total investment amounts.'),
});
export type AutomatedProfitDistributionInput = z.infer<typeof AutomatedProfitDistributionInputSchema>;

export const AutomatedProfitDistributionOutputSchema = z.object({
  system_profit: z.number().describe('The calculated profit for the system (15% of total revenue).'),
  milestone_reached: z.boolean().describe('Whether the total investment has passed the milestone amount.'),
  distributions: z.object({
    superadmin_amount: z.number(),
    admin_base_amount: z.number(),
    admin_staff_budget: z.number(),
    admin_total_amount: z.number().describe('The total amount allocated to the admin (base + staff budget).'),
    investor_pool_amount: z.number(),
  }),
  individual_investor_earnings: z.record(z.string(), z.number()).describe('A map of investor IDs to their earnings for the day.'),
});
export type AutomatedProfitDistributionOutput = z.infer<typeof AutomatedProfitDistributionOutputSchema>;

export async function automatedProfitDistribution(
  input: AutomatedProfitDistributionInput
): Promise<AutomatedProfitDistributionOutput> {
  return automatedProfitDistributionFlow(input);
}

const automatedProfitDistributionFlow = ai.defineFlow(
  {
    name: 'automatedProfitDistributionFlow',
    inputSchema: AutomatedProfitDistributionInputSchema,
    outputSchema: AutomatedProfitDistributionOutputSchema,
  },
  async (input) => {
    const { daily_total_revenue, current_total_investment, investors } = input;

    const SYSTEM_PROFIT_PERCENTAGE = 0.15;
    const MILESTONE_AMOUNT = 50000;

    const rules = {
        before_milestone: { superadmin: 1.0, admin: 0.0, investors: 0.0, staff_budget: 0.0 },
        after_milestone: { superadmin: 0.15, admin: 0.10, investors: 0.60, staff_budget: 0.15 }
    };

    const system_profit = daily_total_revenue * SYSTEM_PROFIT_PERCENTAGE;
    const milestone_reached = current_total_investment > MILESTONE_AMOUNT;

    let superadmin_amount = 0;
    let admin_base_amount = 0;
    let admin_staff_budget = 0;
    let investor_pool_amount = 0;
    const individual_investor_earnings: Record<string, number> = {};

    const distribution_rules = milestone_reached ? rules.after_milestone : rules.before_milestone;

    superadmin_amount = system_profit * distribution_rules.superadmin;
    admin_base_amount = system_profit * distribution_rules.admin;
    admin_staff_budget = system_profit * distribution_rules.staff_budget;
    investor_pool_amount = system_profit * distribution_rules.investors;
    
    const admin_total_amount = admin_base_amount + admin_staff_budget;
    
    if (investor_pool_amount > 0 && investors.length > 0) {
        const total_investment_pool = investors.reduce((sum, inv) => sum + inv.investment_amount, 0);

        if (total_investment_pool > 0) {
            investors.forEach(investor => {
                const share_percentage = investor.investment_amount / total_investment_pool;
                const earning = investor_pool_amount * share_percentage;
                individual_investor_earnings[investor.id] = parseFloat(earning.toFixed(2));
            });
        }
    }

    return {
      system_profit: parseFloat(system_profit.toFixed(2)),
      milestone_reached,
      distributions: {
        superadmin_amount: parseFloat(superadmin_amount.toFixed(2)),
        admin_base_amount: parseFloat(admin_base_amount.toFixed(2)),
        admin_staff_budget: parseFloat(admin_staff_budget.toFixed(2)),
        admin_total_amount: parseFloat(admin_total_amount.toFixed(2)),
        investor_pool_amount: parseFloat(investor_pool_amount.toFixed(2)),
      },
      individual_investor_earnings,
    };
  }
);
