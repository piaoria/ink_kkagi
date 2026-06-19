import { describe, expect, it } from 'vitest';
import {
  getNextRotation,
  getPieceFootprint,
  validatePiecePlacement,
} from '../src/placement/placementValidation.js';

const piece = {
  id: 'p1-piece-1',
  ownerId: 1,
  cells: [
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 3, y: 3 },
  ],
  pixelCount: 3,
};

describe('piece placement rules', () => {
  it('normalizes and rotates piece footprints', () => {
    expect(getPieceFootprint(piece.cells, 90)).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
  });

  it('cycles through right-angle rotations', () => {
    expect(getNextRotation(0)).toBe(90);
    expect(getNextRotation(270)).toBe(0);
  });

  it('allows placement inside the current player home zone', () => {
    const result = validatePiecePlacement({
      piece,
      ownerId: 1,
      anchor: { x: 0, y: 0 },
      existingPlacements: [],
    });

    expect(result.valid).toBe(true);
  });

  it('rejects placement outside the board', () => {
    const result = validatePiecePlacement({
      piece,
      ownerId: 1,
      anchor: { x: 27, y: 0 },
      existingPlacements: [],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('말이 보드 밖으로 나갑니다.');
  });

  it('rejects placement outside the player home zone', () => {
    const result = validatePiecePlacement({
      piece,
      ownerId: 1,
      anchor: { x: 0, y: 10 },
      existingPlacements: [],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('1P 진영 안에만 배치할 수 있습니다.');
  });

  it('rejects overlapping placements', () => {
    const result = validatePiecePlacement({
      piece: { ...piece, id: 'p1-piece-2' },
      ownerId: 1,
      anchor: { x: 1, y: 1 },
      existingPlacements: [
        {
          pieceId: 'p1-piece-1',
          ownerId: 1,
          anchor: { x: 0, y: 0 },
          rotation: 0,
          occupiedCells: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
          ],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('다른 말과 겹칩니다.');
  });
});
