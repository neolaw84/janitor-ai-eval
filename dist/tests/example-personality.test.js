"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const markdown_evaluator_1 = require("../src/markdown-evaluator");
describe('rpg-personality.md example', () => {
    it('should evaluate the personality example without crashing and reflect state changes', () => {
        const examplePath = path.join(__dirname, '../examples/rpg-personality.md');
        const content = fs.readFileSync(examplePath, 'utf8');
        const state = {
            hp: 50,
            discovered_trap: true,
            poison_active: false
        };
        const result = (0, markdown_evaluator_1.evaluateMarkdownCodeBlocks)(content, state);
        // Verification:
        // 1. Poison should have been activated in the first block because discovered_trap was true
        expect(state.poison_active).toBe(true);
        // 2. Health should have been reduced by poison logic in the second block
        // Block 1 will possibly reduce HP by roll(2,6) if roll(1,20) > 15
        // Block 2 will reduce HP by 2 if poison_active is true.
        expect(Number(state.hp)).toBeLessThan(50);
        // 3. Output should contain health info
        expect(result).toContain('Current Health:');
    });
});
