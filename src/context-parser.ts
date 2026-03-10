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
export function extractStateFromMessage(content: string): Record<string, string | number | boolean> {
    const state: Record<string, string | number | boolean> = {};
    if (!content) return state;

    // Split message into individual lines
    const lines = content.split('\n');

    for (const line of lines) {
        // Find lines matching standard key-value separator patterns (:, -, >, =)
        // We look for:
        // Fix for `hit-points - 9`:
        // We match until we find the LAST occurrence of : - > = by making the first group greedy `.+`
        // and looking for the separator
        const match = line.match(/^(.+)[:\->=](.+)$/);

        if (match) {
            // Strip markdown bounding characters (*, _, ", ') and trim spaces
            const keyRaw = match[1];
            const valRaw = match[2];

            // Replaces hyphens with underscores as per latest guidelines
            let cleanKey = keyRaw.replace(/[*\"']/g, '').trim();
            cleanKey = cleanKey.replace(/-/g, '_');

            const cleanVal = valRaw.replace(/[*_\"']/g, '').trim();

            if (!cleanKey) continue;

            // Attempt to cast value to a boolean for common truthy/falsy strings
            const lowerVal = cleanVal.toLowerCase();
            if (['true', 'yes', 'y'].indexOf(lowerVal) !== -1) {
                state[cleanKey] = true;
            } else if (['false', 'no', 'n'].indexOf(lowerVal) !== -1) {
                state[cleanKey] = false;
            } else {
                // Attempt to cast value to a number if it is solidly numeric
                // Otherwise, keep it as a string
                const numVal = Number(cleanVal);
                if (!isNaN(numVal) && cleanVal !== '') {
                    state[cleanKey] = numVal;
                } else {
                    state[cleanKey] = cleanVal;
                }
            }
        }
    }

    return state;
}

/**
 * Extracts read-only metadata from the Janitor AI context object.
 * This is injected into the evaluator.
 */
export function extractMetaFromContext(context: any): Readonly<Record<string, any>> {
    const meta: Record<string, any> = {};

    if (context && context.chat && typeof context.chat.message_count === 'number') {
        const count = context.chat.message_count;
        meta.currentTurnIndex = count > 3 ? Math.trunc(count / 2) : count - 1;
    } else {
        meta.currentTurnIndex = 0;
    }

    return Object.freeze(meta);
}
