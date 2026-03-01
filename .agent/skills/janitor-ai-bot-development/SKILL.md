---
name: janitor-ai-bot-development
description: Instructions and guidelines for developing Janitor AI bots using the janitor-ai-eval system. Use this when the user asks to create, modify, or structure a Janitor AI bot or RPG game loop.
---

# Janitor AI Bot Development

You are assisting the user in developing a Janitor AI bot utilizing the `janitor-ai-eval` execution environment. This environment allows the LLM to output a `state` object and run custom JavaScript code blocks to evaluate game logic and narrate events.

## Core Concepts

Developing a Janitor AI bot involves two primary markdown files:

1.  **The Personality File**: This file acts as the system prompt and instructions for the LLM. It defines the character, the rules, and the game logic (using JavaScript blocks).
2.  **The Scenario File**: This file acts as the first message or introduction, setting the initial context and starting state.

### The Execution Loop

1.  The user (player) inputs a message.
2.  The Janitor AI platform reads the Personality file (`context.character.personality`).
3.  The `janitor-ai-eval` script parses the LLM's last output for a state object (e.g., `hp: 50`, `poisoned: yes`).
4.  The script then executes each JavaScript block found in the Personality file sequentially, sharing the `state` object across all blocks.
5.  Any mutations to the `state` object persist from block to block.
6.  The `console.log()` outputs from the JS blocks dictate the narration or specific instructions for the next LLM generation.
7.  The system calls the LLM with this modified prompt context to generate the response.

## Instructions

When asked to create or modify a Janitor AI bot:

### 1. Separate Personality and Scenario
Ensure there is a clear distinction between the Personality (rules and logic) and the Scenario (initial state and intro). Avoid mixing initial state definitions into the Personality file unless it's a fallback (e.g., `if (state.hp === undefined) { state.hp = 100; }`).

### 2. Instruct the LLM on State Tracking
In the Personality file, explicitly instruct the LLM to maintain and output the state at the end of its messages. The `janitor-ai-eval` parser accepts various formats (case-insensitive):
*   `hp : 50`
*   `mana - 20`
*   `poisoned > yes`
*   `status = "bad"`
Booleans (`true`, `false`, `yes`, `no`, `y`, `n`) are supported and converted automatically.

### 3. Write JavaScript Code Blocks
Use ```js or ```javascript fences in the Personality file to write game logic.
*   **Accessing State**: You have read/write access to the `state` object (e.g., `state.hp -= 10`).
*   **State Persistence**: Changes to `state` in one block are visible to subsequent blocks.
*   **Rolling Dice**: Use the global `roll(count, sides)` or `rollxdy(count, sides)` functions for random numbers (e.g., `roll(1, 20)`).
*   **Math**: A restricted subset of `Math` is available (`floor`, `ceil`, `round`, `max`, `min`, `random`).
*   **Output**: Use `console.log("Your narration here")` to pass text back to the LLM or user.

### 4. Edge Cases to Avoid
*   Do NOT use complex ES6+ features. Stick to ES2015/ES5 constructs compatible with the custom AST parser (arithmetic, simple if/else, for loops, arrays).
*   Do NOT attempt to use `Array.prototype.includes` or other modern built-ins; use `indexOf() !== -1` instead.
*   Do NOT use external APIs (`fetch`, etc.). They are excluded from the sandbox.

## References and Templates

Review the following files for technical details and reusable templates before writing a bot:
- `references/architecture.md`: Technical details on how evaluation works.
- `assets/personality-template.md`: A template for the Personality file.
- `assets/scenario-template.md`: A template for the Scenario file.
