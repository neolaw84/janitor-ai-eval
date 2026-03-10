# Contributing to Janitor AI Evaluator

Thank you for your interest in contributing to this project! This repository uses a strict build pipelining system and a specialized prompt-injection architecture to bypass Janitor AI's execution sandboxes cleanly. 

## The Build Architecture
Because Janitor AI custom scripts don't allow modules (`require` / `import`), everything must bundle into a self-contained closure. Moreover, standard Webpack transformations (like `Object.defineProperty`) fail inside the restricted sandbox environment.

As a result, our compilation relies on **three specific Webpack configurations** paired with **three specific post-build regex patch scripts**:

1. **JAME (Janitor AI Markdown Evaluator)**
   - Entry: `src/markdown-evaluator-entry.ts`
   - Config: `webpack.config.js`
   - Patch script: `patch-bundle.js` (Removes unsupported JS properties to ensure `dist/markdown-evaluator.js` works safely).
   - Command: `npm run build`

2. **Dice Replacer**
   - Entry: `src/dice-replacer-entry.ts`
   - Config: `webpack-dice-replacer.config.js`
   - Patch script: `patch-dice-replacer.js` (Crucially performs ENUM swaps at build-time to spawn the 5 `dice-replacer-*.js` variants).
   - Command: `npm run build:dice`

3. **Memory Manager**
   - Entry: `src/memory-manager-entry.ts`
   - Config: `webpack-memory.config.js`
   - Patch script: `patch-memory.js`
   - Command: `npm run build:memory`

> **Note**: Whenever you modify build settings, make sure to test the builds output via `node` before submitting a PR. The regex operations in the patch scripts are fragile by design.

---

## The Prompt-Injector Architecture (Anchor Tags)
We maintain a single, cohesive source of truth for critical system instructions injected dynamically into `context.character.personality`.

To prevent prompt clutter (which dilutes LLM attention), the `src/prompt-injector.ts` script maintains a singular block:
```markdown
**[START OF CRITICAL SYSTEM INSTRUCTION BLOCK]**
<!-- INJECT_MEMORY -->
<!-- INJECT_DICE -->
**[END OF CRITICAL SYSTEM INSTRUCTION BLOCK]**
```

If you add a new feature that needs to inject backend logic into the main LLM's system prompt (like a new dice mechanic, an advanced inventory router, etc.), **do not** concatenate strings manually. 

Instead:
1. Register a new HTML anchor in `prompt-injector.ts` (e.g., `export const INJECT_ANCHOR_INVENTORY = "<!-- INJECT_INVENTORY -->";`).
2. Have your feature call `getOrInitializeSystemInstructionBlock(personality)` to ensure the skeleton block exists.
3. Call `injectIntoBlock(personality, INJECT_ANCHOR_INVENTORY, yourStringPayload)`.
4. Run your cleanup regex at the end of the entry-point string assembly to strip any unused `<!-- INJECT_XXX -->` HTML markers so they don't pollute the prompt. (See `markdown-evaluator-entry.ts` for an example).

## Testing
Always make sure to run `npm run test` when modifying evaluating capabilities. The `src/markdown-evaluator.ts` runs directly against Jest configurations to ensure AST processing logic stays robust across updates.
