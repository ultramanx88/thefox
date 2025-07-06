import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-product-category.ts';
import '@/ai/flows/calculate-fees-flow.ts';
import '@/ai/flows/split-payment-flow.ts';
import '@/ai/flows/calculate-delivery-fee-flow.ts';
import '@/ai/flows/calculate-profit-sharing-flow.ts';
import '@/ai/flows/automated-profit-distribution.ts';
