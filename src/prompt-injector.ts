/**
 * src/prompt-injector.ts
 * Manages a cohesive, single CRITICAL SYSTEM INSTRUCTION block at the 
 * top of the context personality string to ensure LLM salience.
 */

const BLOCK_START = "**[START OF CRITICAL SYSTEM INSTRUCTION BLOCK]**";
const BLOCK_END = "**[END OF CRITICAL SYSTEM INSTRUCTION BLOCK]**";

export const INJECT_ANCHOR_MEMORY = "<!-- INJECT_MEMORY -->";
export const INJECT_ANCHOR_DICE = "<!-- INJECT_DICE -->";

const INITIAL_BLOCK_SKELETON = `
${BLOCK_START}
${INJECT_ANCHOR_MEMORY}
${INJECT_ANCHOR_DICE}
${BLOCK_END}
`;

/**
 * Searches the personality string for the shared critical system block. 
 * If not found, prepends the block skeleton to the top of the string.
 */
export function getOrInitializeSystemInstructionBlock(personality: string): string {
    if (personality.indexOf(BLOCK_START) !== -1 && personality.indexOf(BLOCK_END) !== -1) {
        return personality;
    }
    return INITIAL_BLOCK_SKELETON + "\n" + personality;
}

/**
 * Replaces a specific injection anchor within the personality string with the provided content.
 */
export function injectIntoBlock(personality: string, anchor: string, content: string): string {
    if (personality.indexOf(anchor) === -1) {
        return personality;
    }
    
    return personality.replace(anchor, content);
}
