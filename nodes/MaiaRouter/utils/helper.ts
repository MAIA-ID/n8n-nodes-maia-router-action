export function getProvider(model: string): string {
    if (model.includes('maia/gemini')) return 'gemini';
    if (model.includes('openai/')) return 'openai';
    return 'unknown';
}