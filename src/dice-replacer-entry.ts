import {
    CHECKSUM_VIOLATION_ALERT,
    getStandardAcknowledgments,
    getRuleGenerationAcknowledgments,
    buildRuleCreationPrompt,
    buildCriticalSystemInstruction,
    PRECOMPUTED_DATA_REMINDER
} from "./dice-constants";
import { injectSystemInstructionBlock } from "./prompt-injector";
import { generatePeriodicSummaryPayload } from "./memory-manager";

const enum Mode {
    Vanilla = 0,
    StrictSimple = 1,
    StrictAdvanced = 2,
    DMSimple = 3,
    DMAdvanced = 4
}

const bundleEvaluationMode: Mode = Mode.Vanilla as Mode; // REPLACE_ME

const isRuleGenerationEnabled = bundleEvaluationMode === Mode.DMSimple || bundleEvaluationMode === Mode.DMAdvanced;
const useSimplifiedAcknowledgments = bundleEvaluationMode === Mode.StrictSimple || bundleEvaluationMode === Mode.DMSimple;
const shouldInjectSystemInstructions = bundleEvaluationMode !== Mode.Vanilla;

interface DiceConfig {
    count: number;
    sides: number;
    amountToRoll: number;
}

// --- USER CONFIGURATION ---
// Define which dice rolls to make available to the LLM and how many of each to pre-roll per turn.
const configuredDice: DiceConfig[] = [
    { count: 3, sides: 6, amountToRoll: 8 },
    { count: 4, sides: 5, amountToRoll: 8 }
];
// --------------------------

const formattedDiceList = configuredDice.map(c => `${c.count} x ${c.sides}-faces dices, ${c.count}d${c.sides}`).join(', and ');

// Define context explicitly for TypeScript since it runs in a custom environment
declare const context: {
    character: {
        personality: string;
        scenario: string;
    };
    chat: {
        last_messages: Array<{ message?: string }>;
        message_count: number;
    }
};

const currentTurnIndex = context.chat.message_count > 3 ? Math.trunc(context.chat.message_count / 2) : context.chat.message_count - 1;

// Simple DJB2 hash - works in sandbox without crypto libraries
function computeChecksum(input: string): string {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return (hash >>> 0).toString(16);
}

// Pre-roll dice values into arrays so we can compute checksum
function rollAndSumDiceSet(numDice: number, numSides: number): number {
    let total = 0;
    for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * numSides) + 1;
    }
    return total;
}

const preComputedTotals: number[][] = [];
for (const config of configuredDice) {
    const totals: number[] = [];
    for (let i = 0; i < config.amountToRoll; i++) {
        totals.push(rollAndSumDiceSet(config.count, config.sides));
    }
    preComputedTotals.push(totals);
}

const arraysString = preComputedTotals.map(totals => `[${totals.join(',')}]`).join(':');
const checksumPayloadString = `${currentTurnIndex}:${arraysString}`;
const checksum = computeChecksum(checksumPayloadString);

// Verify previous turn's checksum (except turn 1)
let checksumViolationWarning = "";

if (currentTurnIndex > 1) {
    const lastMessages = context.chat.last_messages;
    if (lastMessages && lastMessages.length >= 2) {
        const prevMsg = lastMessages[lastMessages.length - 2];
        const msgContent = (prevMsg && prevMsg.message) ? prevMsg.message : '';

        const precomputedDataRegexMatch = msgContent.match(/<PRE_COMPUTED_DATA>([\s\S]*?)<\/PRE_COMPUTED_DATA>/);
        if (precomputedDataRegexMatch) {
            const block = precomputedDataRegexMatch[1];
            const turnMatch = block.match(/Dice rolls for Turn (\d+):/);
            
            const extractedTotals: string[] = [];
            let allMatched = true;
            for (const config of configuredDice) {
                const regex = new RegExp(`${config.count}d${config.sides} rolls:\\s*\\[([^\\]]+)\\]`);
                const match = block.match(regex);
                if (match) {
                    extractedTotals.push(match[1].split(',').map((s: string) => s.trim()).join(','));
                } else {
                    allMatched = false;
                    break;
                }
            }

            const checksumLineMatch = block.match(/checksum:\s*([a-f0-9]+)/i);

            if (turnMatch && allMatched && checksumLineMatch) {
                const prevTurn = turnMatch[1];
                const prevChecksumVal = checksumLineMatch[1];
                
                const expectedArraysString = extractedTotals.map(t => `[${t}]`).join(':');
                const expectedInput = `${prevTurn}:${expectedArraysString}`;
                const expectedChecksum = computeChecksum(expectedInput);

                if (prevChecksumVal !== expectedChecksum || parseInt(prevTurn, 10) !== (currentTurnIndex - 1)) {
                    checksumViolationWarning = CHECKSUM_VIOLATION_ALERT;
                }
            } else {
                checksumViolationWarning = CHECKSUM_VIOLATION_ALERT;
            }
        } else {
            checksumViolationWarning = CHECKSUM_VIOLATION_ALERT;
        }
    }
}

let selectedAcknowledgmentPhrase = "";

if (useSimplifiedAcknowledgments) {
    if (checksumViolationWarning !== "") {
        selectedAcknowledgmentPhrase = `Turn ${currentTurnIndex}: I apologise for repeatedly failing to follow the CRITICAL SYSTEM INSTRUCTIONS. I will use ONLY the dice rolls from the fresh \`<PRE_COMPUTED_DATA>\` block provided in the CRITICAL SYSTEM INSTRUCTIONS for this turn. Here is a copy of \`<PRE_COMPUTED_DATA>\` I have received:\n`;
    } else {
        selectedAcknowledgmentPhrase = `Turn ${currentTurnIndex}: I will use ONLY the dice rolls from the fresh \`<PRE_COMPUTED_DATA>\` block provided in the CRITICAL SYSTEM INSTRUCTIONS for this turn. Here is a copy of \`<PRE_COMPUTED_DATA>\` I have received:\n`;
    }
} else {
    const acknowledgmentOptions = isRuleGenerationEnabled
        ? [...getStandardAcknowledgments(currentTurnIndex), ...getRuleGenerationAcknowledgments(currentTurnIndex, formattedDiceList)]
        : getStandardAcknowledgments(currentTurnIndex);
    const randomPhraseIndex = Math.floor(Math.random() * acknowledgmentOptions.length);
    let selectedPhrase = acknowledgmentOptions[randomPhraseIndex];
    if (checksumViolationWarning !== "") {
        selectedPhrase = selectedPhrase.replace(/^Turn \d+: /, `Turn ${currentTurnIndex}: I apologise for repeatedly failing to follow the CRITICAL SYSTEM INSTRUCTIONS. `);
    }
    selectedAcknowledgmentPhrase = selectedPhrase;
}

const ruleGenerationPrompt = buildRuleCreationPrompt(isRuleGenerationEnabled, formattedDiceList);

const diceTypesString = configuredDice.map(c => `${c.count}d${c.sides}`).join(' or ');
const precomputedDataReminder = PRECOMPUTED_DATA_REMINDER(diceTypesString);

const criticalSystemInstructionPayload = buildCriticalSystemInstruction(
    currentTurnIndex,
    configuredDice,
    preComputedTotals,
    checksum,
    checksumViolationWarning,
    ruleGenerationPrompt,
    selectedAcknowledgmentPhrase,
    precomputedDataReminder
);

/**
 * Parses a string for <<xdy>> dice notation, rolls the dice, 
 * and replaces the notation with the total sum.
 * @param {string} text - The input text containing dice notations.
 * @returns {string} The text with dice notations replaced by roll totals.
 */
function evaluateInlineDiceNotations(text: string): string {
    // Regex to match the pattern <<xdy>>. 
    // Captures 'x' (number of dice) and 'y' (number of sides).
    const inlineDicePattern = /<<(\d+)d(\d+)>>/g;

    return text.replace(inlineDicePattern, (match: string, xStr: string, yStr: string) => {
        const numDice = parseInt(xStr, 10);
        const numSides = parseInt(yStr, 10);

        // Handle edge cases where 0 dice or 0 sides are requested
        if (numDice === 0 || numSides === 0) {
            return "0";
        }

        let total = 0;
        // Roll the dice 'x' times
        for (let i = 0; i < numDice; i++) {
            // Generate a random number between 1 and 'y'
            total += Math.floor(Math.random() * numSides) + 1;
        }

        // Return the total as a string to replace the match
        return total.toString();
    });
}

// --- Prompt Assembly ---
let updatedPersonalityText = context.character.personality;

if (shouldInjectSystemInstructions) {
    // We might be running after memory-manager. Look for an existing memory payload.
    let existingMemoryPayload: string | undefined = undefined;
    const blockMatch = updatedPersonalityText.match(/\*\*\[START OF CRITICAL SYSTEM INSTRUCTION BLOCK\]\*\*\n([\s\S]*?)\n\*\*\[END OF CRITICAL SYSTEM INSTRUCTION BLOCK\]\*\*/);
    if (blockMatch) {
        const blockContent = blockMatch[1];
        if (blockContent.includes('[MEMORY MANAGER]')) {
            // Extract just the memory manager line(s)
            const memoryMatch = blockContent.match(/\[MEMORY MANAGER\][\s\S]*?(?=\n<PRE_COMPUTED_DATA>|$)/);
            if (memoryMatch) {
                existingMemoryPayload = memoryMatch[0].trim();
            }
        }
    }

    // Since this is the dice-replacer, it's possible it is being run standalone (without memory-manager chained in the UI).
    // Let's generate a default memory payload just in case it hits the interval, but ONLY if we don't already have one 
    // from a chained memory-manager execution.
    if (!existingMemoryPayload) {
        existingMemoryPayload = generatePeriodicSummaryPayload(currentTurnIndex);
    }
    
    updatedPersonalityText = injectSystemInstructionBlock(
        updatedPersonalityText, 
        existingMemoryPayload, 
        criticalSystemInstructionPayload
    );
}

context.character.personality = evaluateInlineDiceNotations(updatedPersonalityText);
context.character.scenario = PRECOMPUTED_DATA_REMINDER + "\n" + evaluateInlineDiceNotations(context.character.scenario);
