declare class Environment {
    private parent;
    private record;
    constructor(parent?: Environment | null);
    define(name: string, value: any): void;
    assign(name: string, value: any): void;
    get(name: string): any;
}
export declare class Interpreter {
    private env;
    logs: string[];
    constructor();
    evaluate(node: any, env?: Environment): any;
}
/**
 * Searches for ```javascript ... ``` blocks in a markdown string,
 * evaluates the sandboxed code, and replaces the block with the accumulated
 * `console.log()` output.
 *
 * Supports a safe subset of ES5: arithmetic, strings, logic, arrays, if/for loops.
 */
export declare function evaluateMarkdownCodeBlocks(markdown: string, state?: Record<string, string | number>): string;
export {};
