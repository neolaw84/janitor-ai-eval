/**
 * Extracts key-value mappings from a raw, LLM-generated Markdown chat message.
 * It is a best-effort parser looking for standardized RPG status patterns.
 *
 * E.g:
 *   stamina : 4
 *   hit-points - 9
 *   *mana:* 8
 *   "status" > "bad"
 */
export declare function extractStateFromMessage(content: string): Record<string, string | number>;
