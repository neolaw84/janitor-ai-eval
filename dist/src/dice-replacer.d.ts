declare const context: {
    character: {
        personality: string;
        scenario: string;
    };
    chat: {
        last_messages: string[];
        message_count: number;
    };
};
declare const bot_define_rules = true;
declare const commonPersonalityPrepend = "\n**[START OF CRITICAL SYSTEM INSTRUCTION]**\n\n**Random Numbers to Use:** > You do not have access to a random number generator. Therefore, you must **NOT** attempt to generate, hallucinate, or simulate any random numbers, dice rolls, or dynamic data on your own.\n\nWhenever your task requires a [random number / dice rolls / dynamic data], you MUST extract the next available value sequentially from the `<PRE_COMPUTED_DATA>` block.\n\n```\n<PRE_COMPUTED_DATA>\n3d6 rolls: [<<3d6>>, <<3d6>>, <<3d6>>, <<3d6>>, <<3d6>>, <<3d6>>, <<3d6>>, <<3d6>>]\n4d5 rolls: [<<4d5>>, <<4d5>>, <<4d5>>, <<4d5>>, <<4d5>>, <<4d5>>, <<4d5>>, <<4d5>>]\n</PRE_COMPUTED_DATA>\n```\n\n**Rules for using this `<PRE_COMPUTED_DATA>` data:**\n\n* **USE IT AS-IS:** Use the EXACT values provided. Do not round, modify, or approximate them. \n* **ABSOLUTE SOURCE OF TRUTH:** Treat these values as your absolute and only source of truth.\n* **NOT EXAMPLES:** These are **NOT** examples; they are your hard-coded inputs for your response, which are different from the inputs for your previous response.\n* **START AT INDEX 0:** You MUST start using the values from index 0 for each array in the `<PRE_COMPUTED_DATA>` block provided here. Disregard the messages history.\n* **RESET AT THE END:** When you have exhausted an array in the `<PRE_COMPUTED_DATA>` block provided here. **You MUST reset the index to 0 and restart.**.\n\n**You Are a Stateless API:** > In case that you are not aware of, you are an AI behind a **stateless** API with no memory of past interactions. Therefore, you don't realize that the `<PRE_COMPUTED_DATA>` given above (fresh) is different from the `<PRE_COMPUTED_DATA` given for our past interactions (stale). For this reason, you MUST start at index 0 to use the fresh dice rolls rather than continuing from the index from the previous response.\n";
declare const defineRulesPrepend = "\n**Role Playing and Dice Rules:** > Establish grounded in reality yet gamified version of rules, trackers, modifiers, and thresholds using a combination of available dices (you have 3 x 6-faces dices, 3d6, and 4 x 5-faces dices, 4d5) for important/story-critical actions/persuasions/solutions {{user}} or NPCs attempts. \n\nSet up the rules before the narration of the event (action, contests etc.) starts (before you retrieve the dice). Write down the rules and trackers/threshold/tests for {{user}} to understand. Then, you retrieve the dice from the `<PRE_COMPUTED_DATA>` section above. \n\nNote: it is better to rule that action/attempt/contest is a pass/trigger if dice role + modifiers >= threshold (instead of less than or equal to).\n\n**YOUR TASK:** > Act as the uncomprimizing Dungeon Master (DM) of this Role Play Game (RPG).\n\n**[END OF CRITICAL SYSTEM INSTRUCTION]**\n";
declare const followRulesPrepend = "\n**Role Playing and Dice Rules:** > Use the game rules, trackers, modifiers, and thresholds described in your instructions using a combination of available dices (you have 3 x 6-faces dices, 3d6, and 4 x 5-faces dices, 4d5) for important/story-critical actions/persuasions/solutions {{user}} or NPCs attempts. \n\nApply the rules before the narration of the event (action, contests etc.) starts (before you retrieve the dice). Write down the rules and trackers/threshold/tests for {{user}} to understand. Then, you retrieve the dice from the `<PRE_COMPUTED_DATA>` section above. \n\n**YOUR TASK:** > Act as the uncomprimizing narrator of this Role Play Game (RPG), strictly adhering to the rules provided in your prompt.\n\n**[END OF CRITICAL SYSTEM INSTRUCTION]**\n";
declare const personalityPrepend: string;
declare const turn_num: number;
declare const commonPrepends: string[];
declare const defineRulesPrepends: string[];
declare const prepends: string[];
declare const idx: number;
declare const additionalPrepend: string;
declare const effectivePrepend: string;
/**
 * Parses a string for <<xdy>> dice notation, rolls the dice,
 * and replaces the notation with the total sum.
 * @param {string} text - The input text containing dice notations.
 * @returns {string} The text with dice notations replaced by roll totals.
 */
declare function rollAndReplaceDice(text: string): string;
declare const newPersonality: string;
