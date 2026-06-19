import { describe, expect, it } from 'vitest';
import { simulateLaunch, snapPieceToBoard } from '../src/physics/matchPhysics.js';

const makePlacement = (pieceId, ownerId, occupiedCells) => ({
  pieceId,
  ownerId,
  anchor: occupiedCells[0],
  rotation: 0,
  occupiedCells,
});

describe('match physics', () => {
  it('moves the selected piece in the launch direction', () => {
    const result = simulateLaunch({
      playerPlacements: {
        1: [makePlacement('p1-piece-1', 1, [{ x: 4, y: 4 }])],
        2: [],
      },
      selectedPieceId: 'p1-piece-1',
      aimVector: { x: -120, y: 0 },
      stepCount: 45,
    });

    expect(result.playerPlacements[1][0].occupiedCells[0].x).toBeGreaterThan(4);
  });

  it('gives small and large pieces comparable launch distance at the same power', () => {
    const smallResult = simulateLaunch({
      playerPlacements: {
        1: [makePlacement('small', 1, [{ x: 2, y: 4 }])],
        2: [],
      },
      selectedPieceId: 'small',
      aimVector: { x: -180, y: 0 },
      stepCount: 30,
    });
    const largeResult = simulateLaunch({
      playerPlacements: {
        1: [
          makePlacement('large', 1, [
            { x: 2, y: 4 },
            { x: 3, y: 4 },
            { x: 4, y: 4 },
            { x: 5, y: 4 },
            { x: 6, y: 4 },
            { x: 7, y: 4 },
            { x: 8, y: 4 },
          ]),
        ],
        2: [],
      },
      selectedPieceId: 'large',
      aimVector: { x: -180, y: 0 },
      stepCount: 30,
    });

    const smallDistance = smallResult.playerPlacements[1][0].occupiedCells[0].x - 2;
    const largeDistance = largeResult.playerPlacements[1][0].occupiedCells[0].x - 2;

    expect(smallDistance).toBeGreaterThan(2);
    expect(largeDistance).toBe(smallDistance);
  });

  it('captures replay frames when requested', () => {
    const result = simulateLaunch({
      playerPlacements: {
        1: [makePlacement('p1-piece-1', 1, [{ x: 4, y: 4 }])],
        2: [],
      },
      selectedPieceId: 'p1-piece-1',
      aimVector: { x: -120, y: 0 },
      stepCount: 40,
      frameCount: 4,
    });

    expect(result.frames).toHaveLength(4);
    expect(result.frames.at(-1).playerPlacements[1][0].occupiedCells[0].x).toBeGreaterThan(4);
  });

  it('removes a piece when every projected cell leaves the board', () => {
    const result = simulateLaunch({
      playerPlacements: {
        1: [makePlacement('p1-piece-1', 1, [{ x: 13, y: 5 }])],
        2: [],
      },
      selectedPieceId: 'p1-piece-1',
      aimVector: { x: -180, y: 0 },
      stepCount: 160,
    });

    expect(result.playerPlacements[1]).toHaveLength(0);
    expect(result.knockedOutPieceIds).toContain('p1-piece-1');
  });

  it('keeps every ink cell when a rotated body is snapped back to the grid', () => {
    const placement = makePlacement('p1-piece-1', 1, [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 3, y: 4 },
    ]);

    const cells = snapPieceToBoard({
      placement,
      bodyPosition: { x: 4.8, y: 5.1 },
      boardConfig: { BOARD_COLUMNS: 8, BOARD_ROWS: 8 },
    });

    expect(cells).toHaveLength(placement.occupiedCells.length);
    expect(new Set(cells.map((cell) => `${cell.x},${cell.y}`)).size).toBe(
      placement.occupiedCells.length,
    );
    expect(cells.every((cell) => cell.x >= 0 && cell.x < 8 && cell.y >= 0 && cell.y < 8)).toBe(true);
  });

  it('keeps a partially pushed piece on the board until it is fully knocked out', () => {
    const placement = makePlacement('p1-piece-1', 1, [
      { x: 11, y: 5 },
      { x: 12, y: 5 },
      { x: 13, y: 5 },
    ]);

    const cells = snapPieceToBoard({
      placement,
      bodyPosition: { x: 14.2, y: 5 },
      boardConfig: { BOARD_COLUMNS: 14, BOARD_ROWS: 20 },
    });

    expect(cells).toEqual([
      { x: 11, y: 5 },
      { x: 12, y: 5 },
      { x: 13, y: 5 },
    ]);
  });
});
