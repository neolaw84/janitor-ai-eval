import * as fs from 'fs';
import * as path from 'path';
import { evaluateMarkdownCodeBlocks } from '../src/markdown-evaluator';

describe('rpg-personality.md example', () => {
    it('should evaluate the personality example without crashing and reflect state changes', () => {
        const examplePath = path.join(__dirname, '../examples/rpg-personality.md');
        const content = fs.readFileSync(examplePath, 'utf8');

        const state: Record<string, string | number | boolean> = {
            hp: 50,
            discovered_trap: true,
            poison_active: false
        };

        const result = evaluateMarkdownCodeBlocks(content, state);

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
