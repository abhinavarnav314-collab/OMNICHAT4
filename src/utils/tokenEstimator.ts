export function estimateTokens(text: string, modelId: string = ''): number {
  if (!text) return 0;
  let tokens = Math.ceil(text.length / 4);
  // Add simple multipliers if needed
  if (modelId.includes('claude')) tokens = Math.ceil(tokens * 1.1);
  return tokens;
}
