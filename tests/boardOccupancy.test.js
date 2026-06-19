import { describe, expect, it } from 'vitest';
import {
  buildBoardOccupancy,
  getActivePieces,
  getPieceCenter,
  getPieceCenterPercent,
  getPlacementPose,
} from '../src/match/boardOccupancy.js';

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

  it('calculates selected piece center for aim guide placement', () => {
    const placements = {
      1: [
        {
          pieceId: 'p1-piece-1',
          ownerId: 1,
          occupiedCells: [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 2, y: 4 },
          ],
        },
      ],
      2: [],
    };

    expect(getPieceCenter(placements, 'p1-piece-1')).toEqual({ x: 2, y: 2 });
    expect(
      getPieceCenterPercent(placements, 'p1-piece-1', {
        BOARD_COLUMNS: 10,
        BOARD_ROWS: 10,
      }),
    ).toEqual({ x: 25, y: 25 });
  });

  it('includes a match pose when calculating a piece center', () => {
    const placement = {
      pieceId: 'p1-piece-1',
      ownerId: 1,
      occupiedCells: [{ x: 2, y: 2 }],
      pose: { x: 1.25, y: -0.5, angle: 0.3 },
    };
    const placements = { 1: [placement], 2: [] };

    expect(getPlacementPose(placement)).toEqual({ x: 1.25, y: -0.5, angle: 0.3 });
    expect(getPieceCenter(placements, 'p1-piece-1')).toEqual({ x: 3.25, y: 1.5 });
  });
});
