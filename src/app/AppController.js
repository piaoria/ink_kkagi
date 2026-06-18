import { GamePhase, GameStateMachine } from './GameStateMachine.js';
import { PLAYER_COLORS } from '../config/gameConfig.js';
import { renderDrawingScreen } from '../screens/DrawingScreen.js';
import { renderMainScreen } from '../screens/MainScreen.js';
import { renderMatchReadyScreen, renderPlacementScreen } from '../screens/PlacementScreen.js';

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
    this.playerPieces = {
      1: [],
      2: [],
    };
    this.playerPlacements = {
      1: [],
      2: [],
    };
  }

  start() {
    this.render();
  }

  render() {
    if (
      this.stateMachine.phase === GamePhase.DRAW_PLAYER_1 ||
      this.stateMachine.phase === GamePhase.DRAW_PLAYER_2
    ) {
      const ownerId = this.stateMachine.phase === GamePhase.DRAW_PLAYER_1 ? 1 : 2;

      this.root.replaceChildren(
        renderDrawingScreen({
          ownerId,
          completedPieces: this.playerPieces[ownerId],
          draftCells: this.drawingDrafts[ownerId],
          onDraftChange: (cells) => {
            this.drawingDrafts[ownerId] = cells;
          },
          onConfirmPiece: (cells) => this.confirmPiece(ownerId, cells),
          onBack: () => this.returnToTitle(),
        }),
      );
      return;
    }

    if (
      this.stateMachine.phase === GamePhase.PLACE_PLAYER_1 ||
      this.stateMachine.phase === GamePhase.PLACE_PLAYER_2
    ) {
      const ownerId = this.stateMachine.phase === GamePhase.PLACE_PLAYER_1 ? 1 : 2;

      this.root.replaceChildren(
        renderPlacementScreen({
          ownerId,
          pieces: this.playerPieces[ownerId],
          placements: this.playerPlacements[ownerId],
          onConfirmPlacement: (placement) => this.confirmPlacement(ownerId, placement),
          onClearPlacements: () => this.clearPlacements(ownerId),
          onBack: () => this.returnToTitle(),
        }),
      );
      return;
    }

    if (this.stateMachine.phase === GamePhase.READY) {
      this.root.replaceChildren(
        renderMatchReadyScreen({
          playerPieces: this.playerPieces,
          playerPlacements: this.playerPlacements,
          onBackToTitle: () => this.returnToTitle(),
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
    this.drawingDrafts = {
      1: [],
      2: [],
    };
    this.playerPieces = {
      1: [],
      2: [],
    };
    this.playerPlacements = {
      1: [],
      2: [],
    };
    this.render();
  }

  confirmPiece(ownerId, cells) {
    const pieceNumber = this.playerPieces[ownerId].length + 1;
    const piece = {
      id: `p${ownerId}-piece-${pieceNumber}`,
      ownerId,
      cells,
      pixelCount: cells.length,
      color: PLAYER_COLORS[ownerId],
    };

    this.playerPieces[ownerId] = [...this.playerPieces[ownerId], piece];
    this.drawingDrafts[ownerId] = [];

    if (this.playerPieces[ownerId].length >= 3) {
      if (ownerId === 1) {
        this.stateMachine.transition(GamePhase.DRAW_PLAYER_2);
      } else {
        this.stateMachine.transition(GamePhase.PLACE_PLAYER_1);
      }
    }

    this.render();
  }

  confirmPlacement(ownerId, placement) {
    this.playerPlacements[ownerId] = [...this.playerPlacements[ownerId], placement];

    if (this.playerPlacements[ownerId].length >= this.playerPieces[ownerId].length) {
      if (ownerId === 1) {
        this.stateMachine.transition(GamePhase.PLACE_PLAYER_2);
      } else {
        this.stateMachine.transition(GamePhase.READY);
      }
    }

    this.render();
  }

  clearPlacements(ownerId) {
    this.playerPlacements[ownerId] = [];
    this.render();
  }
}
