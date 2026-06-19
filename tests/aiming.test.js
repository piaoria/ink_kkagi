import { describe, expect, it } from 'vitest';
import {
  clampAimVector,
  getAimPower,
  getLaunchVector,
  isLaunchReady,
  setAimPower,
} from '../src/match/aiming.js';

describe('aiming', () => {
  it('clamps drag vectors to the configured maximum distance', () => {
    expect(clampAimVector({ x: 20, y: 0 }, 10)).toEqual({ x: 10, y: 0 });
  });

  it('calculates normalized launch direction opposite to pull direction', () => {
    expect(getLaunchVector({ x: 0, y: 50 }, 100)).toEqual({
      x: -0,
      y: -1,
      power: 0.5,
    });
  });

  it('reports power and launch readiness from drag distance', () => {
    expect(getAimPower({ x: 3, y: 4 }, 10)).toBe(0.5);
    expect(isLaunchReady({ x: 1, y: 1 })).toBe(false);
    expect(isLaunchReady({ x: 20, y: 0 })).toBe(true);
  });

  it('changes power without changing an established aim direction', () => {
    expect(setAimPower({ x: 3, y: 4 }, 0.5, 100)).toEqual({ x: 30, y: 40 });
    expect(setAimPower({ x: 0, y: 0 }, 0.5, 100)).toEqual({ x: 0, y: 0 });
  });
});
