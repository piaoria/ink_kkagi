import { describe, expect, it } from 'vitest';
import { GamePhase, GameStateMachine } from '../src/app/GameStateMachine.js';

describe('GameStateMachine', () => {
  it('starts at the title phase', () => {
    const stateMachine = new GameStateMachine();

    expect(stateMachine.phase).toBe(GamePhase.TITLE);
  });

  it('allows the documented local match setup flow', () => {
    const stateMachine = new GameStateMachine();

    stateMachine.transition(GamePhase.DRAW_PLAYER_1);
    stateMachine.transition(GamePhase.DRAW_PLAYER_2);
    stateMachine.transition(GamePhase.PLACE_PLAYER_1);
    stateMachine.transition(GamePhase.PLACE_PLAYER_2);
    stateMachine.transition(GamePhase.READY);
    stateMachine.transition(GamePhase.AIMING);
    stateMachine.transition(GamePhase.SIMULATING);
    stateMachine.transition(GamePhase.AIMING);

    expect(stateMachine.phase).toBe(GamePhase.AIMING);
  });

  it('blocks invalid transitions', () => {
    const stateMachine = new GameStateMachine();

    expect(() => stateMachine.transition(GamePhase.SIMULATING)).toThrow(
      'Invalid phase transition',
    );
  });
});

