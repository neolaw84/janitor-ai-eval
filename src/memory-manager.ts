/**
 * src/memory-manager.ts
 * Generates the memory payload string, but DOES NOT inject it.
 * The entry point is responsible for gathering all payloads and injecting them together.
 */

export function generatePeriodicSummaryPayload(
    currentTurnIndex: number,
    interval: number = 10,
    memoryPrompt: string = `[MEMORY MANAGER]: Summarize the key trackers, characters and narrative events from turn 0 to turn ${currentTurnIndex - 1} and display the summary section after your narrative response of this turn EVEN THOUGH PREVIOUS MESSAGES DO NOT HAVE SUCH A SUMMARY SECTION IN THEM.`
): string | undefined {
    if (currentTurnIndex > 0 && currentTurnIndex % interval === 0) {
        return memoryPrompt;
    }

    return undefined;
}
