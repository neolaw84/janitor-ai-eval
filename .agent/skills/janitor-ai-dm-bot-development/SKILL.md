---
name: janitor-ai-dm-bot-development
description: Instructions and guidelines for developing Janitor AI bots using the DM / LLM Free Reign "dice-replacer" philosophy. Use this when the user asks to create, modify, or structure an unstructured Janitor AI DM (Dungeon Master) bot or RPG game loop.
---

# Janitor AI DM Bot Development

You are assisting the user in developing a Janitor AI bot utilizing the "LLM Free Reign / Dungeon Master Bot" (`dice-replacer`) execution environment. This environment bypasses the need for rigid "Script as Authority" constraints and allows the LLM heavily autonomy, specifically when using difficult-to-control LLMs (e.g., DeepSeek).

## Core Concepts

Developing any Janitor AI bot requires three primary markdown files. Even though this DM pattern relies primarily on the Personality prompt, **you must still create all three files** (though some may remain largely empty):
1.  **The Personality (`personality.md`)**: Contains the character instructions, the `<PRE_COMPUTED_DATA>` array, and the DM system instructions.
2.  **The Scenario (`scenario.md`)**: Used for world-building context (can be empty if not using script logic).
3.  **The First Message (`first_message.md`)**: The opening narration and immediate starting state.

Unlike the rigid mathematically evaluated state of the main `janitor-ai-eval` pattern, this `dice-replacer` philosophy injects raw dice rolls into the character prompt *before* the Janitor AI platform assembles the call to the LLM.

1.  **The Pre-computation Phase**: A script intercepts the `context.character.personality` and evaluates variables like `<<3d6>>` inside the text.
2.  **The `<PRE_COMPUTED_DATA>` Block**: The script dynamically injects arrays of rolled dice into a designated block.
3.  **The LLM as DM**: The LLM is instructed via the Personality prompt to act as an uncompromising Dungeon Master. It is told to retrieve the next sequential dice roll from `<PRE_COMPUTED_DATA>` rather than hallucinatory values.
4.  **Circumventing Statelessness**: The LLM API is stateless and doesn’t inherently grasp that the pre-computed arrays are generated *fresh* for the new response. We specifically prompt the LLM to understand that the array it is reading is new and it MUST begin extracting values starting from `index 0`.

## Instructions

When asked to create or modify a Janitor AI DM bot using the `dice-replacer` pattern:

### 1. The Prepend Mechanism (No Template Required!)
Unlike standard bot development, you **do not need a rigid template** for the DM bot's `personality.md`. The `janitor-ai-eval` TS parser (`dice-replacer.ts`) *automatically* prepends the "Stateless API Bypass" instructions, the Dungeon Master mandate, and the `<PRE_COMPUTED_DATA>` block to the top of the `context.character.personality` string at runtime.

### 2. The `bot_define_rules` Flag
At the top of the compiled `dice-replacer` script, there is a configurable boolean flag: `const bot_define_rules`. Your approach to creating the bot's markdown files changes entirely based on this flag.

#### If `bot_define_rules = true` (Default DM Mode)
Because the script automatically instructs the LLM to invent its own rules dynamically, the actual content of the bot's markdown files should be extremely minimal or act as placeholders:
- **`personality.md`**: Only include character-specific traits (e.g., "You are an AI game master who loves grimdark fantasy."), world-building details, and the tracking loops you want the LLM to format.
- **`scenario.md`**: Can be left blank, or simply contain a brief summary of the immediate story location.
- **`first_message.md`**: The opening narration and immediate starting state (e.g., HP, inventory).

#### If `bot_define_rules = false` (Strict Narrator Mode)
The script will instruct the LLM to simply *follow* the rules you provide rather than invent them. In this case, you cannot use empty placeholders!
- **`personality.md`**: Must contain the character traits, world constraints, *and* explicitly define the game's mechanics, trackers, and dice thresholds.
- **`scenario.md`**: Must contain detailed situation-specific rules or mechanics the narrator must adhere to.
- **`first_message.md`**: Same as above, opening narration and state.

### 3. Cycle "Turn Prepends" to Improve Instruction Salience
LLMs often skip over instructions they've seen too many times. The `dice-replacer` strategy utilizes a rolling array of nuanced sentence variations prepended dynamically based on the chat's `message_count`. These prepends strongly assert:
> "Turn X: I prepare this response as per my understanding that, the dice rolls in the PRE_COMPUTED_DATA is freshly prepared for this turn/response and I can safely use them starting from index 0."

*Note: You do not need to manually write the prepends when designing the Markdown template; the TypeScript parser (`dice-replacer.ts`) handles them. Simply focus on the static system prompt structure.*

### 4. Edge Cases: Avoiding `eval()` Constructs
Since this pattern relies strictly on the `rollAndReplaceDice` string replacement regex rather than the full AST lexer, you do not write JS code blocks (` ```js `) with math or `state` operations in the personality file for the DM pattern.

*   **No Code Blocks:** Do not try to write `if/else` clusters or `console.log("...")`.
*   **Leave Logic to the LLM:** Ensure the system instructions adequately tell the LLM how to parse the `PRE_COMPUTED_DATA` and apply it to rules.

## References and Templates

For the "LLM Free Reign / Dice-Replacer" DM bot, you do not need specific structural templates because the compiled `dist/dice-replacer.js` file dynamically handles the `<PRE_COMPUTED_DATA>` injection and the stringent DM prompts. Simply guide the user to create their character traits in `personality.md` and leave `scenario.md` mostly blank!
