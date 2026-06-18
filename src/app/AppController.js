import { GamePhase, GameStateMachine } from './GameStateMachine.js';
import { renderDrawingScreen } from '../screens/DrawingScreen.js';
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
    this.drawingDrafts = {
      1: [],
      2: [],
    };
  }

  start() {
    this.render();
  }

  render() {
    if (this.stateMachine.phase === GamePhase.DRAW_PLAYER_1) {
      this.root.replaceChildren(
        renderDrawingScreen({
          ownerId: 1,
          draftCells: this.drawingDrafts[1],
          onDraftChange: (cells) => {
            this.drawingDrafts[1] = cells;
          },
          onBack: () => this.returnToTitle(),
        }),
      );
      return;
    }

    this.root.replaceChildren(
      renderMainScreen({
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

  returnToTitle() {
    this.stateMachine.reset();
    this.render();
  }
}
