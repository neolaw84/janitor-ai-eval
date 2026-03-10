/**
 * Tests for the checksum functionality in dice-replacer.ts
 * 
 * Since dice-replacer.ts is a standalone script (not a module),
 * we replicate the hash function and test the verification logic here.
 */

export {}; // Ensure this file is treated as a module to avoid global scope conflicts

// Replicate the simpleHash function from dice-replacer.ts (DJB2 algorithm)
function simpleHash(input: string): string {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return (hash >>> 0).toString(16);
}

interface DiceConfig {
    count: number;
    sides: number;
    amountToRoll: number;
}

const configuredDice: DiceConfig[] = [
    { count: 3, sides: 6, amountToRoll: 8 },
    { count: 4, sides: 5, amountToRoll: 8 }
];

// Replicate the PRE_COMPUTED_DATA extraction logic from dice-replacer-entry.ts
function extractAndVerifyChecksum(msgContent: string): { valid: boolean; reason: string } {
    const preComputedMatch = msgContent.match(/<PRE_COMPUTED_DATA>([\s\S]*?)<\/PRE_COMPUTED_DATA>/);
    if (!preComputedMatch) {
        return { valid: false, reason: 'no_block' };
    }

    const block = preComputedMatch[1];
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

    const csMatch = block.match(/checksum:\s*([a-f0-9]+)/i);

    if (!turnMatch || !allMatched || !csMatch) {
        return { valid: false, reason: 'incomplete_block' };
    }

    const prevTurn = turnMatch[1];
    const expectedArraysString = extractedTotals.map(t => `[${t}]`).join(':');
    const expectedInput = `${prevTurn}:${expectedArraysString}`;
    
    const prevChecksumVal = csMatch[1];
    const expectedChecksum = simpleHash(expectedInput);

    if (prevChecksumVal !== expectedChecksum) {
        return { valid: false, reason: 'mismatch' };
    }

    return { valid: true, reason: 'ok' };
}

describe('simpleHash (DJB2)', () => {
    it('should return a deterministic hex string', () => {
        const result = simpleHash('hello');
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^[a-f0-9]+$/);
        // Same input should always produce same output
        expect(simpleHash('hello')).toBe(result);
    });

    it('should return different hashes for different inputs', () => {
        const h1 = simpleHash('hello');
        const h2 = simpleHash('world');
        expect(h1).not.toBe(h2);
    });

    it('should handle empty string', () => {
        const result = simpleHash('');
        expect(typeof result).toBe('string');
        expect(result).toBe('1505');  // DJB2 of empty string = 5381 = 0x1505
    });

    it('should produce consistent results for checksum input format', () => {
        const input = '5:[10,8,12,7,15,9,11,6]:[8,14,7,10,12,5,9,11]';
        const result = simpleHash(input);
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^[a-f0-9]+$/);
        // Verify determinism
        expect(simpleHash(input)).toBe(result);
    });
});

describe('extractAndVerifyChecksum', () => {
    it('should return valid for a correct PRE_COMPUTED_DATA block', () => {
        const turn = 5;
        const d6 = [10, 8, 12, 7, 15, 9, 11, 6];
        const d5 = [8, 14, 7, 10, 12, 5, 9, 11];
        const checksumInput = `${turn}:[${d6.join(',')}]:[${d5.join(',')}]`;
        const cs = simpleHash(checksumInput);

        const message = `Here is my response.
<PRE_COMPUTED_DATA>
Dice rolls for Turn ${turn}:
3d6 rolls: [${d6.join(', ')}]
4d5 rolls: [${d5.join(', ')}]
checksum: ${cs}
</PRE_COMPUTED_DATA>
Some narration follows...`;

        const result = extractAndVerifyChecksum(message);
        expect(result.valid).toBe(true);
        expect(result.reason).toBe('ok');
    });

    it('should return invalid when checksum is tampered', () => {
        const turn = 5;
        const d6 = [10, 8, 12, 7, 15, 9, 11, 6];
        const d5 = [8, 14, 7, 10, 12, 5, 9, 11];

        const message = `Here is my response.
<PRE_COMPUTED_DATA>
Dice rolls for Turn ${turn}:
3d6 rolls: [${d6.join(', ')}]
4d5 rolls: [${d5.join(', ')}]
checksum: deadbeef
</PRE_COMPUTED_DATA>
Some narration follows...`;

        const result = extractAndVerifyChecksum(message);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('mismatch');
    });

    it('should return invalid when dice values are modified by LLM', () => {
        const turn = 5;
        const d6 = [10, 8, 12, 7, 15, 9, 11, 6];
        const d5 = [8, 14, 7, 10, 12, 5, 9, 11];
        const checksumInput = `${turn}:[${d6.join(',')}]:[${d5.join(',')}]`;
        const cs = simpleHash(checksumInput);

        // LLM modified one dice value (10 -> 18 in 3d6 rolls)
        const message = `Here is my response.
<PRE_COMPUTED_DATA>
Dice rolls for Turn ${turn}:
3d6 rolls: [18, 8, 12, 7, 15, 9, 11, 6]
4d5 rolls: [${d5.join(', ')}]
checksum: ${cs}
</PRE_COMPUTED_DATA>
Some narration follows...`;

        const result = extractAndVerifyChecksum(message);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('mismatch');
    });

    it('should detect missing PRE_COMPUTED_DATA block', () => {
        const message = 'This is a response without any pre-computed data block.';
        const result = extractAndVerifyChecksum(message);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('no_block');
    });

    it('should detect incomplete PRE_COMPUTED_DATA block (missing checksum line)', () => {
        const message = `Here is my response.
<PRE_COMPUTED_DATA>
Dice rolls for Turn 5:
3d6 rolls: [10, 8, 12, 7, 15, 9, 11, 6]
4d5 rolls: [8, 14, 7, 10, 12, 5, 9, 11]
</PRE_COMPUTED_DATA>`;

        const result = extractAndVerifyChecksum(message);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('incomplete_block');
    });

    it('should detect incomplete PRE_COMPUTED_DATA block (missing dice arrays)', () => {
        const message = `Here is my response.
<PRE_COMPUTED_DATA>
Dice rolls for Turn 5:
checksum: abc123
</PRE_COMPUTED_DATA>`;

        const result = extractAndVerifyChecksum(message);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('incomplete_block');
    });

    it('should handle PRE_COMPUTED_DATA with extra whitespace in arrays', () => {
        const turn = 3;
        const d6 = [10, 8, 12, 7, 15, 9, 11, 6];
        const d5 = [8, 14, 7, 10, 12, 5, 9, 11];
        // Checksum is computed with comma-separated no-space format
        const checksumInput = `${turn}:[${d6.join(',')}]:[${d5.join(',')}]`;
        const cs = simpleHash(checksumInput);

        // LLM echoes with extra spaces — should still verify OK since we normalize
        const message = `<PRE_COMPUTED_DATA>
Dice rolls for Turn ${turn}:
3d6 rolls: [10,  8,  12 , 7, 15, 9, 11, 6]
4d5 rolls: [ 8, 14,  7, 10, 12, 5,  9, 11]
checksum: ${cs}
</PRE_COMPUTED_DATA>`;

        const result = extractAndVerifyChecksum(message);
        expect(result.valid).toBe(true);
        expect(result.reason).toBe('ok');
    });
});

describe('checksum input format', () => {
    it('should produce the expected format: turn:[d6_vals]:[d5_vals]', () => {
        const turn_num = 5;
        const d6Rolls = [10, 8, 12, 7, 15, 9, 11, 6];
        const d5Rolls = [8, 14, 7, 10, 12, 5, 9, 11];
        const checksumInput = `${turn_num}:[${d6Rolls.join(',')}]:[${d5Rolls.join(',')}]`;
        expect(checksumInput).toBe('5:[10,8,12,7,15,9,11,6]:[8,14,7,10,12,5,9,11]');
    });
});
