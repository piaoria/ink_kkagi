import { describe, expect, it } from 'vitest';
import { applyImpactDamage } from '../src/match/pieceDamage.js';

const placement = (cells, durability = {}) => ({
  pieceId: 'p1-piece-1',
  ownerId: 1,
  anchor: cells[0],
  occupiedCells: cells,
  durability,
  pose: { x: 0, y: 0, angle: 0 },
});

describe('piece damage', () => {
  it('accumulates damage on the closest block before destroying it', () => {
    const base = placement([{ x: 2, y: 2 }]);
    const first = applyImpactDamage({ 1: [base], 2: [] }, [
      { x: 2, y: 2, strength: 0.4, pieceIds: ['p1-piece-1'] },
    ]);
    const second = applyImpactDamage(first.playerPlacements, [
      { x: 2, y: 2, strength: 1, pieceIds: ['p1-piece-1'] },
    ]);

    expect(first.playerPlacements[1][0].durability['2,2']).toBe(2);
    expect(second.playerPlacements[1]).toHaveLength(0);
    expect(second.destroyedPieceIds).toEqual(['p1-piece-1']);
  });

  it('splits disconnected surviving blocks into separate pieces', () => {
    const result = applyImpactDamage(
      {
        1: [
          placement(
            [
              { x: 1, y: 1 },
              { x: 2, y: 1 },
              { x: 3, y: 1 },
            ],
            { '1,1': 3, '2,1': 1, '3,1': 3 },
          ),
        ],
        2: [],
      },
      [{ x: 2, y: 1, strength: 1, pieceIds: ['p1-piece-1'] }],
    );

    expect(result.playerPlacements[1]).toHaveLength(2);
    expect(result.fragmentedPieceIds).toEqual(['p1-piece-1']);
    expect(result.playerPlacements[1].flatMap((piece) => piece.occupiedCells)).toEqual([
      { x: 1, y: 1 },
      { x: 3, y: 1 },
    ]);
  });
});
