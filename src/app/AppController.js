import { GamePhase, GameStateMachine } from './GameStateMachine.js';
import { renderMainScreen } from '../screens/MainScreen.js';

export class AppController {
  /**
   * @param {HTMLElement | null} root
   */
  constructor(root) {
    if (!root) {
      throw new Error('App root element was not found.');
    }

    this.root = root;
    this.stateMachine = new GameStateMachine();
  }

  start() {
    this.render();
  }

  render() {
    this.root.replaceChildren(
      renderMainScreen({
        phase: this.stateMachine.phase,
        onStartLocal: () => this.startLocalMatchSetup(),
      }),
    );
  }

  startLocalMatchSetup() {
    if (this.stateMachine.phase === GamePhase.TITLE) {
      this.stateMachine.transition(GamePhase.DRAW_PLAYER_1);
    }

    this.render();
  }
}

