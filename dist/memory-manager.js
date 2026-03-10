/******/ "use strict";
/******/ var __webpack_modules__ = ({

/***/ "./src/context-parser.ts"
(__unused_webpack_module, exports) {


exports['__esModule'] = true;
exports.extractStateFromMessage = extractStateFromMessage;
exports.extractMetaFromContext = extractMetaFromContext;
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
function extractStateFromMessage(content) {
    const state = {};
    if (!content)
        return state;
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
            if (!cleanKey)
                continue;
            // Attempt to cast value to a boolean for common truthy/falsy strings
            const lowerVal = cleanVal.toLowerCase();
            if (['true', 'yes', 'y'].indexOf(lowerVal) !== -1) {
                state[cleanKey] = true;
            }
            else if (['false', 'no', 'n'].indexOf(lowerVal) !== -1) {
                state[cleanKey] = false;
            }
            else {
                // Attempt to cast value to a number if it is solidly numeric
                // Otherwise, keep it as a string
                const numVal = Number(cleanVal);
                if (!isNaN(numVal) && cleanVal !== '') {
                    state[cleanKey] = numVal;
                }
                else {
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
function extractMetaFromContext(context) {
    const meta = {};
    if (context && context.chat && typeof context.chat.message_count === 'number') {
        const count = context.chat.message_count;
        meta.currentTurnIndex = count > 3 ? Math.trunc(count / 2) : count - 1;
    }
    else {
        meta.currentTurnIndex = 0;
    }
    return Object.freeze(meta);
}


/***/ },

/***/ "./src/memory-manager.ts"
(__unused_webpack_module, exports, __webpack_require__) {


exports['__esModule'] = true;
exports.injectPeriodicSummary = injectPeriodicSummary;
/**
 * src/memory-manager.ts
 * Injects memory and summarization instructions into the LLM prompt.
 */
const prompt_injector_1 = __webpack_require__("./src/prompt-injector.ts");
function injectPeriodicSummary(personality, currentTurnIndex) {
    if (currentTurnIndex > 0 && currentTurnIndex % 10 === 0) {
        let updatedPersonality = (0, prompt_injector_1.getOrInitializeSystemInstructionBlock)(personality);
        const memoryInstruction = `[MEMORY MANAGER]: The narrative context window is getting long. Summarize the key narrative events of the last 10 turns and display the summary clearly at the end of your response.`;
        return (0, prompt_injector_1.injectIntoBlock)(updatedPersonality, prompt_injector_1.INJECT_ANCHOR_MEMORY, memoryInstruction);
    }
    return personality;
}


/***/ },

/***/ "./src/prompt-injector.ts"
(__unused_webpack_module, exports) {


/**
 * src/prompt-injector.ts
 * Manages a cohesive, single CRITICAL SYSTEM INSTRUCTION block at the
 * top of the context personality string to ensure LLM salience.
 */
exports['__esModule'] = true;
exports.INJECT_ANCHOR_DICE = exports.INJECT_ANCHOR_MEMORY = void 0;
exports.getOrInitializeSystemInstructionBlock = getOrInitializeSystemInstructionBlock;
exports.injectIntoBlock = injectIntoBlock;
const BLOCK_START = "**[START OF CRITICAL SYSTEM INSTRUCTION BLOCK]**";
const BLOCK_END = "**[END OF CRITICAL SYSTEM INSTRUCTION BLOCK]**";
exports.INJECT_ANCHOR_MEMORY = "<!-- INJECT_MEMORY -->";
exports.INJECT_ANCHOR_DICE = "<!-- INJECT_DICE -->";
const INITIAL_BLOCK_SKELETON = `
${BLOCK_START}
${exports.INJECT_ANCHOR_MEMORY}
${exports.INJECT_ANCHOR_DICE}
${BLOCK_END}
`;
/**
 * Searches the personality string for the shared critical system block.
 * If not found, prepends the block skeleton to the top of the string.
 */
function getOrInitializeSystemInstructionBlock(personality) {
    if (personality.indexOf(BLOCK_START) !== -1 && personality.indexOf(BLOCK_END) !== -1) {
        return personality;
    }
    return INITIAL_BLOCK_SKELETON + "\n" + personality;
}
/**
 * Replaces a specific injection anchor within the personality string with the provided content.
 */
function injectIntoBlock(personality, anchor, content) {
    if (personality.indexOf(anchor) === -1) {
        return personality;
    }
    return personality.replace(anchor, content);
}


/***/ }

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

exports['__esModule'] = true;
const context_parser_1 = __webpack_require__("./src/context-parser.ts");
const memory_manager_1 = __webpack_require__("./src/memory-manager.ts");
if (typeof context !== 'undefined' && context.chat && context.character) {
    const injectedMeta = (0, context_parser_1.extractMetaFromContext)(context);
    let newPersonality = context.character.personality;
    if (newPersonality) {
        newPersonality = (0, memory_manager_1.injectPeriodicSummary)(newPersonality, injectedMeta.currentTurnIndex);
        // Ensure unused HTML comment anchors from prompt-injector are wiped from final output 
        // to prevent LLM confusion if they are left dangling.
        newPersonality = newPersonality.replace(/<!-- INJECT_[\w]+ -->/g, '');
        context.character.personality = newPersonality;
    }
}

})();

