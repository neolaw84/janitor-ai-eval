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
2.  **The `<PRE_COMPUTED_DATA>` Block**: The script dynamically injects arrays of rolled dice into a designated block. **IMPORTANT:** The `dice-replacer` system specifically provides two types of dice arrays: `3d6` (typically for Player rolls) and `4d5` (typically for NPC rolls). No other dice types are currently supported in the pre-computed block.
3.  **The LLM as DM**: The LLM is instructed via the Personality prompt to act as an uncompromising Dungeon Master. It is told to retrieve the next sequential dice roll from `<PRE_COMPUTED_DATA>` rather than hallucinatory values.
4.  **Circumventing Statelessness**: The LLM API is stateless and doesn’t inherently grasp that the pre-computed arrays are generated *fresh* for the new response. We specifically prompt the LLM to understand that the array it is reading is new and it MUST begin extracting values starting from `index 0`.

## Instructions

When asked to create or modify a Janitor AI DM bot using the `dice-replacer` pattern:

### 1. The Prepend Mechanism (No Template Required!)
Unlike standard bot development, you **do not need a rigid template** for the DM bot's `personality.md`. The `janitor-ai-eval` TS parser (`dice-replacer.ts`) *automatically* prepends the "Stateless API Bypass" instructions, the Dungeon Master mandate, and the `<PRE_COMPUTED_DATA>` block (along with instructions on how to read it) to the top of the `context.character.personality` string at runtime. 

**CRITICAL RULE:** Do NOT manually add the DM instructions ("You are an uncompromising Dungeon Master..."), the `<PRE_COMPUTED_DATA>` block, or the dice-reading rules to `personality.md`. This applies regardless of the `bot_define_rules` setting.

### 2. The `bot_define_rules` Flag
At the top of the compiled `dice-replacer` script, there is a configurable boolean flag: `const bot_define_rules`. Your approach to creating the bot's markdown files changes entirely based on this flag.

#### If `bot_define_rules = true` (Default DM Mode)
Because the script automatically instructs the LLM to invent its own rules dynamically, the actual content of the bot's markdown files should be extremely minimal or act as placeholders:
- **`personality.md`**: Only include character-specific traits (e.g., "You are an AI game master who loves grimdark fantasy."), world-building details, and the tracking loops you want the LLM to format.
- **`scenario.md`**: Can be left blank, or simply contain a brief summary of the immediate story location.
- **`first_message.md`**: The opening narration and immediate starting state (e.g., HP, inventory).

#### If `bot_define_rules = false` (Strict Narrator Mode)
The script will instruct the LLM to simply *follow* the rules you provide rather than invent them. In this case, you cannot use empty placeholders or let the LLM have "free reign". **The rules in the scenario must be explicit and deterministic.**
- **`personality.md`**: Must contain the character traits, world constraints, *and* explicitly define the game's mechanics, trackers, and dice thresholds. (Again, do not include the DM system prompt or `<PRE_COMPUTED_DATA>` placeholder). *Best Practice: Keep this file short and delegate mathematical authority to `scenario.md`.*
- **`scenario.md`**: **Crucial for Strict Narrator Mode.** Must contain highly explicit, deterministic mathematical rules, phased encounter loops, stat formulas, checks, and consequences. You must leave no room for LLM interpretation on *how* a check resolves or *what* stats change.
- **`first_message.md`**: Opening narration and initial state string.

*For an example of an explicit, deterministic ruleset, refer to `references/strict_narrator_scenario.md` and `references/strict_narrator_personality.md` in this skill directory.*

### 3. Cycle "Turn Prepends" to Improve Instruction Salience
LLMs often skip over instructions they've seen too many times. The `dice-replacer` strategy utilizes a rolling array of nuanced sentence variations prepended dynamically based on the chat's `message_count`. These prepends strongly assert:
> "Turn X: I prepare this response as per my understanding that, the dice rolls in the PRE_COMPUTED_DATA is freshly prepared for this turn/response and I can safely use them starting from index 0."

*Note: You do not need to manually write the prepends when designing the Markdown template; the TypeScript parser (`dice-replacer.ts`) handles them. Simply focus on the static system prompt structure.*

### 4. Edge Cases: Avoiding `eval()` Constructs
Since this pattern relies strictly on the `rollAndReplaceDice` string replacement regex rather than the full AST lexer, you do not write JS code blocks (` ```js `) with math or `state` operations in the personality file for the DM pattern.

*   **No Code Blocks:** Do not try to write `if/else` clusters or `console.log("...")`.
*   **Leave Logic to the LLM:** Ensure the system instructions adequately tell the LLM how to parse the `PRE_COMPUTED_DATA` and apply it to rules.

## Best Practices for Structuring DM Rules

When helping users design the content for a strict Narrator/DM bot (where `bot_define_rules = false`), instruct them to use these narrative-friendly scaffolding techniques to help the structural consistency of the LLM:

1. **Dynamic Modifier Assessment over Static Values:**
   Instead of trying to hardcode strict, unyielding math (e.g., `Class A always gets +2`), instruct the LLM to dynamically determine skill modifiers by evaluating a combination of:
   - **Permanent Characteristics** (role, experience, physical traits).
   - **Situational Characteristics** (environment, desperation, specific tactics used).
   This leans into the LLM's strength (narrative comprehension) while feeding into the deterministic formulas defined in your scenario.

2. **NPC Archetype Matrices:**
   Since the DM bot doesn't have a rigid state engine to spawn characters programmatically, providing a clear matrix of "Archetypes" (grouping traits like appearance, demeanor, and power-level/thresholds) gives the LLM a highly effective shorthand to ensure NPCs feel mechanically consistent and balanced when introduced.

3. **Standardized Threshold Formulas (The "Slow Burn" Engine):**
   Demonstrating the explicit formula format `Roll +/- Modifiers >= Target Threshold` combined with rolling trackers (like a `0-to-100` progress meter or a moon phase tracker) is a perfect template to show developers how to create a structured "slow-burn" game loop that the LLM can easily enforce and update.

## Directory Structure & Agentskills Specs
As per the `agentskills.io` specification, this skill contains:
- `SKILL.md`: The primary instruction manifest.
- `references/`: Contains reference implementations. Do not hesitate to use the `view_file` tool to inspect `references/strict_narrator_scenario.md` and `references/strict_narrator_personality.md` to see exactly how explicit and deterministic math should look for these DM bots. (Note: Reference templates use generic RPG scenarios to avoid NSFW restrictions.)
- `assets/` and `scripts/`: Reserved for future expansion.

## Final Note on Templates
For the "LLM Free Reign / Dice-Replacer" DM bot where `bot_define_rules = true`, you do not need specific structural templates because the compiled `dist/dice-replacer.js` file dynamically handles the `<PRE_COMPUTED_DATA>` injection and the stringent DM prompts. Simply guide the user to create their character traits in `personality.md` and leave `scenario.md` mostly blank! However, if `bot_define_rules = false`, then you must strictly adhere to building explicit and deterministic logic in `scenario.md`.
