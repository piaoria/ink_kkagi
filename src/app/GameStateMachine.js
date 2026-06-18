export const GamePhase = Object.freeze({
  TITLE: 'TITLE',
  RULES: 'RULES',
  DRAW_PLAYER_1: 'DRAW_PLAYER_1',
  DRAW_PLAYER_2: 'DRAW_PLAYER_2',
  PLACE_PLAYER_1: 'PLACE_PLAYER_1',
  PLACE_PLAYER_2: 'PLACE_PLAYER_2',
  READY: 'READY',
  AIMING: 'AIMING',
  SIMULATING: 'SIMULATING',
  MATCH_OVER: 'MATCH_OVER',
});

const ALLOWED_TRANSITIONS = Object.freeze({
  [GamePhase.TITLE]: [GamePhase.RULES, GamePhase.DRAW_PLAYER_1],
  [GamePhase.RULES]: [GamePhase.TITLE, GamePhase.DRAW_PLAYER_1],
  [GamePhase.DRAW_PLAYER_1]: [GamePhase.DRAW_PLAYER_2, GamePhase.TITLE],
  [GamePhase.DRAW_PLAYER_2]: [GamePhase.PLACE_PLAYER_1, GamePhase.TITLE],
  [GamePhase.PLACE_PLAYER_1]: [GamePhase.PLACE_PLAYER_2, GamePhase.TITLE],
  [GamePhase.PLACE_PLAYER_2]: [GamePhase.READY, GamePhase.TITLE],
  [GamePhase.READY]: [GamePhase.AIMING, GamePhase.TITLE],
  [GamePhase.AIMING]: [GamePhase.SIMULATING, GamePhase.MATCH_OVER],
  [GamePhase.SIMULATING]: [GamePhase.AIMING, GamePhase.MATCH_OVER],
  [GamePhase.MATCH_OVER]: [GamePhase.TITLE, GamePhase.DRAW_PLAYER_1],
});

export class GameStateMachine {
  constructor(initialPhase = GamePhase.TITLE) {
    this.currentPhase = initialPhase;
  }

  get phase() {
    return this.currentPhase;
  }

  canTransitionTo(nextPhase) {
    return ALLOWED_TRANSITIONS[this.currentPhase]?.includes(nextPhase) ?? false;
  }

  transition(nextPhase) {
    if (!this.canTransitionTo(nextPhase)) {
      throw new Error(`Invalid phase transition: ${this.currentPhase} -> ${nextPhase}`);
    }

    this.currentPhase = nextPhase;
    return this.currentPhase;
  }

  reset() {
    this.currentPhase = GamePhase.TITLE;
  }
}

