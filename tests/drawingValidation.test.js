import { describe, expect, it } from 'vitest';
import { validatePieceDraft } from '../src/drawing/drawingValidation.js';
import {
  getMaxInkForCurrentPiece,
  getMinInkForCurrentPiece,
} from '../src/drawing/inkAllocator.js';
import { interpolateOrthogonalPath } from '../src/drawing/strokeTraversal.js';

const makeCells = (count) =>
  Array.from({ length: count }, (_, index) => ({ x: index % 8, y: Math.floor(index / 8) }));

describe('piece drawing rules', () => {
  it('limits the first piece so future pieces can keep minimum ink', () => {
    expect(getMaxInkForCurrentPiece([])).toBe(18);
  });

  it('limits the second piece based on ink reserved for the last piece', () => {
    const completedPieces = [{ pixelCount: 18 }];

    expect(getMaxInkForCurrentPiece(completedPieces)).toBe(11);
  });

  it('raises the current minimum so future pieces can stay under maximum ink', () => {
    const completedPieces = [{ pixelCount: 7 }];

    expect(getMinInkForCurrentPiece(completedPieces)).toBe(11);
    expect(validatePieceDraft({ cells: makeCells(7), completedPieces }).valid).toBe(false);
    expect(validatePieceDraft({ cells: makeCells(11), completedPieces }).valid).toBe(true);
  });

  it('requires the last piece to use all remaining ink', () => {
    const completedPieces = [{ pixelCount: 18 }, { pixelCount: 11 }];

    expect(validatePieceDraft({ cells: makeCells(6), completedPieces }).valid).toBe(false);
    expect(validatePieceDraft({ cells: makeCells(7), completedPieces }).valid).toBe(true);
  });

  it('rejects diagonally connected cells', () => {
    const result = validatePieceDraft({
      cells: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        ...makeCells(8).map((cell) => ({ x: cell.x + 2, y: 0 })),
      ],
      completedPieces: [],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('모든 칸은 상하좌우로 연결되어야 합니다.');
  });

  it('rejects cells outside the drawing grid', () => {
    const result = validatePieceDraft({
      cells: [{ x: 99, y: 0 }, ...makeCells(10)],
      completedPieces: [],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('칸이 제작 그리드 밖에 있습니다.');
  });

  it('interpolates fast diagonal drags into orthogonal steps', () => {
    expect(interpolateOrthogonalPath({ x: 0, y: 0 }, { x: 2, y: 2 })).toEqual([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ]);
  });
});
