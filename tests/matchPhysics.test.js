import { describe, expect, it } from 'vitest';
import { simulateLaunch } from '../src/physics/matchPhysics.js';

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
});
