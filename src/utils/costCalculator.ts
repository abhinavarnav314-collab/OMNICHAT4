import pricingData from '../data/pricing.json';

export function calculateCost(promptTokens: number, completionTokens: number, model: string): number {
  const rates = (pricingData as Record<string, { prompt: number; completion: number }>)[model];
  if (!rates) return 0;
  return (promptTokens * rates.prompt + completionTokens * rates.completion) / 1000000;
}
