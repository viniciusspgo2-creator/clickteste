/** Contexto conversacional somente textual, sem projeto, imagem ou credencial. */
export function sanitizeAssistantHistory(value: unknown): string[] {
 if (!Array.isArray(value)) return [];
 return value.filter((item): item is string => typeof item === 'string')
  .map(text => text.trim()).filter(text => text.length > 0 && text.length <= 300).slice(-4);
}
