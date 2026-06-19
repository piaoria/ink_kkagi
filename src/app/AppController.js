import { GamePhase, GameStateMachine } from './GameStateMachine.js';
import { PLAYER_COLORS } from '../config/gameConfig.js';
import { renderDrawingScreen } from '../screens/DrawingScreen.js';
import { renderMainScreen } from '../screens/MainScreen.js';
import { renderMatchScreen } from '../screens/MatchScreen.js';
import { renderMatchOverScreen } from '../screens/MatchOverScreen.js';
import { renderMatchReadyScreen, renderPlacementScreen } from '../screens/PlacementScreen.js';
import { getMatchResult } from '../match/matchRules.js';
import { simulateLaunch } from '../physics/matchPhysics.js';
import { createAutoPlacementsForPlayer, createQuickMatchSetup } from '../setup/quickSetup.js';

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
    this.matchState = {
      activePlayerId: 1,
      selectedPieceId: null,
      aimVector: { x: 0, y: 0 },
      lastKnockedOutPieceIds: [],
      result: null,
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
          onAutoPlace: () => this.autoPlacePlayer(ownerId),
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
          onStartMatch: () => this.startMatch(),
          onBackToTitle: () => this.returnToTitle(),
        }),
      );
      return;
    }

    if (this.stateMachine.phase === GamePhase.AIMING) {
      this.root.replaceChildren(
        renderMatchScreen({
          activePlayerId: this.matchState.activePlayerId,
          selectedPieceId: this.matchState.selectedPieceId,
          aimVector: this.matchState.aimVector,
          lastKnockedOutPieceIds: this.matchState.lastKnockedOutPieceIds,
          playerPieces: this.playerPieces,
          playerPlacements: this.playerPlacements,
          onSelectPiece: (pieceId) => this.selectMatchPiece(pieceId),
          onAimChange: (vector) => this.updateAimVector(vector),
          onFire: () => this.fireSelectedPiece(),
          onBackToTitle: () => this.returnToTitle(),
        }),
      );
      return;
    }

    if (this.stateMachine.phase === GamePhase.MATCH_OVER) {
      this.root.replaceChildren(
        renderMatchOverScreen({
          result: this.matchState.result,
          playerPlacements: this.playerPlacements,
          onQuickRestart: () => this.restartQuickMatch(),
          onBackToTitle: () => this.returnToTitle(),
        }),
      );
      return;
    }

    this.root.replaceChildren(
      renderMainScreen({
        onStartLocal: () => this.startLocalMatchSetup(),
        onStartQuick: () => this.startQuickLocalMatchSetup(),
      }),
    );
  }

  startLocalMatchSetup() {
    if (this.stateMachine.phase === GamePhase.TITLE) {
      this.stateMachine.transition(GamePhase.DRAW_PLAYER_1);
    }

    this.render();
  }

  startQuickLocalMatchSetup() {
    if (this.stateMachine.phase !== GamePhase.TITLE) {
      return;
    }

    const { playerPieces, playerPlacements } = createQuickMatchSetup();
    this.playerPieces = playerPieces;
    this.playerPlacements = playerPlacements;

    this.stateMachine.transition(GamePhase.DRAW_PLAYER_1);
    this.stateMachine.transition(GamePhase.DRAW_PLAYER_2);
    this.stateMachine.transition(GamePhase.PLACE_PLAYER_1);
    this.stateMachine.transition(GamePhase.PLACE_PLAYER_2);
    this.stateMachine.transition(GamePhase.READY);
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
    this.matchState = {
      activePlayerId: 1,
      selectedPieceId: null,
      aimVector: { x: 0, y: 0 },
      lastKnockedOutPieceIds: [],
      result: null,
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

  autoPlacePlayer(ownerId) {
    this.playerPlacements[ownerId] = createAutoPlacementsForPlayer({
      ownerId,
      pieces: this.playerPieces[ownerId],
    });

    if (ownerId === 1) {
      this.stateMachine.transition(GamePhase.PLACE_PLAYER_2);
    } else {
      this.stateMachine.transition(GamePhase.READY);
    }

    this.render();
  }

  startMatch() {
    if (this.stateMachine.phase !== GamePhase.READY) {
      return;
    }

    this.matchState = {
      activePlayerId: 1,
      selectedPieceId: null,
      aimVector: { x: 0, y: 0 },
      lastKnockedOutPieceIds: [],
      result: null,
    };
    this.stateMachine.transition(GamePhase.AIMING);
    this.render();
  }

  selectMatchPiece(pieceId) {
    this.matchState = {
      ...this.matchState,
      selectedPieceId: pieceId,
      aimVector: { x: 0, y: 0 },
      lastKnockedOutPieceIds: [],
      result: null,
    };
    this.render();
  }

  updateAimVector(vector) {
    this.matchState = {
      ...this.matchState,
      aimVector: vector,
    };
  }

  fireSelectedPiece() {
    if (!this.matchState.selectedPieceId) {
      return;
    }

    this.stateMachine.transition(GamePhase.SIMULATING);
    const simulation = simulateLaunch({
      playerPlacements: this.playerPlacements,
      selectedPieceId: this.matchState.selectedPieceId,
      aimVector: this.matchState.aimVector,
    });

    this.playerPlacements = simulation.playerPlacements;
    const result = getMatchResult(this.playerPlacements);
    this.matchState = {
      activePlayerId: this.matchState.activePlayerId === 1 ? 2 : 1,
      selectedPieceId: null,
      aimVector: { x: 0, y: 0 },
      lastKnockedOutPieceIds: simulation.knockedOutPieceIds,
      result,
    };

    if (result.finished) {
      this.stateMachine.transition(GamePhase.MATCH_OVER);
    } else {
      this.stateMachine.transition(GamePhase.AIMING);
    }

    this.render();
  }

  restartQuickMatch() {
    this.returnToTitle();
    this.startQuickLocalMatchSetup();
  }
}
