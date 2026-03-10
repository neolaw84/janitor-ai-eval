/**
 * src/memory-manager.ts
 * Generates the memory payload string, but DOES NOT inject it.
 * The entry point is responsible for gathering all payloads and injecting them together.
 */

export function generatePeriodicSummaryPayload(
    currentTurnIndex: number,
    interval: number = 10,
    memoryPrompt: string = "[MEMORY MANAGER]: The narrative context window is getting long. Summarize the key narrative events of the last 10 turns and display the summary clearly at the end of your response EVEN THOUGH PREVIOUS MESSAGES DO NOT HAVE SUCH A SUMMARY SECTION IN THEM."
): string | undefined {
    if (currentTurnIndex > 0 && currentTurnIndex % interval === 0) {
        return memoryPrompt;
    }

    return undefined;
}
