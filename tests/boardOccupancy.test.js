import { describe, expect, it } from 'vitest';
import { buildBoardOccupancy, getActivePieces } from '../src/match/boardOccupancy.js';

describe('board occupancy', () => {
  it('maps placed cells to their owner and piece id', () => {
    const occupancy = buildBoardOccupancy({
      1: [
        {
          pieceId: 'p1-piece-1',
          ownerId: 1,
          occupiedCells: [
            { x: 1, y: 1 },
            { x: 2, y: 1 },
          ],
        },
      ],
      2: [
        {
          pieceId: 'p2-piece-1',
          ownerId: 2,
          occupiedCells: [{ x: 4, y: 18 }],
        },
      ],
    });

    expect(occupancy.get('1,1')).toEqual({ ownerId: 1, pieceId: 'p1-piece-1' });
    expect(occupancy.get('4,18')).toEqual({ ownerId: 2, pieceId: 'p2-piece-1' });
  });

  it('returns only active player pieces that are still placed', () => {
    const pieces = {
      1: [
        { id: 'p1-piece-1' },
        { id: 'p1-piece-2' },
      ],
      2: [{ id: 'p2-piece-1' }],
    };
    const placements = {
      1: [{ pieceId: 'p1-piece-2' }],
      2: [{ pieceId: 'p2-piece-1' }],
    };

    expect(getActivePieces(pieces, placements, 1)).toEqual([{ id: 'p1-piece-2' }]);
  });
});
