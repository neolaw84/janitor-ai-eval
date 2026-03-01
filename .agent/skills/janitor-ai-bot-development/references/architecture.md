# Architecture: `janitor-ai-eval`

The `janitor-ai-eval` system acts as a bridge between the Janitor AI platform and custom bot logic. It provides a sandboxed environment to parse state and evaluate a safe subset of JavaScript.

## 1. Context Parsing (`extractStateFromMessage`)

The parser regex scans the LLM's response for key-value pairs formatted as:
`[key] [separator] [value]`

*   **Supported Separators**: `:`, `-`, `>`, `=`
*   **Characters Ignored**: Markdown bounds like `*`, `_`, `"`, `'` are stripped from keys and values. Hyphens in keys are converted to underscores.

### Value Types
The parsed values are converted according to these rules:
1.  **Booleans**: If the value matches `true`, `false`, `yes`, `no`, `y`, or `n` (case-insensitive), it is converted to a native JavaScript boolean (`true` or `false`).
2.  **Numbers**: If the value is strictly numeric, it is parsed as a `Number`.
3.  **Strings**: All other values remain strings.

*Example Output*: `state = { hp: 50, poisoned: true, status: "bad" }`

## 2. JavaScript Evaluation

The script extracts ` ```js ` or ` ```javascript ` blocks from the markdown file using a regex loop.

### The Sandbox
- A custom ES5-compliant AST parser (`Lexer` / `Parser` / `Interpreter`) processes the blocks. `eval()` is NOT used to prevent XSS.
- The interpreter defines `state` in its global environment.
- The **same `state` reference** is passed to every block discovered in the text. This guarantees that mutated properties in Block A (e.g., `state.hp -= 10`) are visible in Block B.

### Available APIs
- `Math`: `floor`, `ceil`, `round`, `max`, `min`, `random`
- `console`: Only `console.log()` is available. The stringified outputs are collected and appended to the final markdown output.
- `roll(diceCount, faces)` and `rollxdy(diceCount, faces)`: Custom helpers evaluating random dice rolls.

### Limitations
- **No Complex Features**: No let/const block scoping accuracy, no promises, no classes.
- **No Native Method Bindings**: `String.prototype.replace` or `Array.prototype.includes` might not work reliably depending on the ES version. Use basic operations like `indexOf() !== -1`.
- **Failure Mode**: Syntax errors or attempts to call undefined objects (like `fetch()`) will be caught. The error is logged to the server, but the block is silently removed (evaluates to an empty string) to prevent breaking the Janitor AI UI.
