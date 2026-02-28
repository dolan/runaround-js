/**
 * Canvas overlay for displaying the quest log.
 * Toggled by the Q key.
 */

const BG_COLOR = 'rgba(0, 0, 0, 0.85)';
const TITLE_COLOR = '#FFD700';
const ACTIVE_NAME_COLOR = '#FFD700';
const ACTIVE_DESC_COLOR = '#CCCCCC';
const COMPLETED_NAME_COLOR = '#66CC66';
const COMPLETED_TAG_COLOR = '#66CC66';
const FOOTER_COLOR = '#888888';
const TITLE_FONT = 'bold 20px monospace';
const NAME_FONT = 'bold 14px monospace';
const DESC_FONT = '12px monospace';
const FOOTER_FONT = '12px monospace';
const PADDING = 30;
const LINE_HEIGHT = 22;

/**
 * Draw the quest log overlay on the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../events/QuestSystem.js').QuestSystem} questSystem
 */
export function drawQuestLog(ctx, questSystem) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Semi-transparent background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    let y = PADDING + 20;

    // Title
    ctx.font = TITLE_FONT;
    ctx.fillStyle = TITLE_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Quest Log', w / 2, y);
    y += LINE_HEIGHT + 16;

    ctx.textAlign = 'left';
    const x = PADDING;

    const activeQuests = questSystem.getActiveQuests();
    const completedQuests = questSystem.getCompletedQuests();

    if (activeQuests.length === 0 && completedQuests.length === 0) {
        ctx.font = DESC_FONT;
        ctx.fillStyle = ACTIVE_DESC_COLOR;
        ctx.fillText('No quests yet.', x, y);
        y += LINE_HEIGHT;
    }

    // Active quests
    if (activeQuests.length > 0) {
        ctx.font = NAME_FONT;
        ctx.fillStyle = TITLE_COLOR;
        ctx.fillText('Active', x, y);
        y += LINE_HEIGHT + 4;

        for (const quest of activeQuests) {
            ctx.font = NAME_FONT;
            ctx.fillStyle = ACTIVE_NAME_COLOR;
            ctx.fillText(quest.name, x + 10, y);
            y += LINE_HEIGHT;

            ctx.font = DESC_FONT;
            ctx.fillStyle = ACTIVE_DESC_COLOR;
            ctx.fillText(quest.stageDescription, x + 20, y);
            y += LINE_HEIGHT + 4;
        }

        y += 8;
    }

    // Completed quests
    if (completedQuests.length > 0) {
        ctx.font = NAME_FONT;
        ctx.fillStyle = COMPLETED_NAME_COLOR;
        ctx.fillText('Completed', x, y);
        y += LINE_HEIGHT + 4;

        for (const quest of completedQuests) {
            ctx.font = NAME_FONT;
            ctx.fillStyle = COMPLETED_NAME_COLOR;
            ctx.fillText(`${quest.name}  [Complete]`, x + 10, y);
            y += LINE_HEIGHT;
        }
    }

    // Footer
    ctx.font = FOOTER_FONT;
    ctx.fillStyle = FOOTER_COLOR;
    ctx.textAlign = 'center';
    ctx.fillText('Press Q to close', w / 2, h - PADDING);
}
