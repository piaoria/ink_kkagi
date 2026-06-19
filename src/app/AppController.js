import { GamePhase, GameStateMachine } from './GameStateMachine.js';
import { PLAYER_COLORS } from '../config/gameConfig.js';
import { renderDrawingScreen } from '../screens/DrawingScreen.js';
import { renderMainScreen } from '../screens/MainScreen.js';
import { renderMatchScreen } from '../screens/MatchScreen.js';
import { renderMatchOverScreen } from '../screens/MatchOverScreen.js';
import { renderMatchReadyScreen, renderPlacementScreen } from '../screens/PlacementScreen.js';
import { getMatchResult } from '../match/matchRules.js';
import { simulateLaunch } from '../physics/matchPhysics.js';
import { playBreakSound, playImpactSound, playShotSound } from '../match/audioFeedback.js';
import { getAimPower } from '../match/aiming.js';
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
      simulationFrames: [],
      simulationFrameIndex: 0,
    };
    this.simulationFrameRequest = null;
    this.matchView = null;
    this.matchHistory = [];
  }

  start() {
    this.render();
  }

  render() {
    if (this.matchView) {
      this.matchView.destroyMatch();
      this.matchView = null;
    }
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

    if (
      this.stateMachine.phase === GamePhase.AIMING ||
      this.stateMachine.phase === GamePhase.SIMULATING
    ) {
      this.matchView = renderMatchScreen({
          activePlayerId: this.matchState.activePlayerId,
          selectedPieceId: this.matchState.selectedPieceId,
          gripPoint: this.matchState.gripPoint,
          aimVector: this.matchState.aimVector,
          lastKnockedOutPieceIds: this.matchState.lastKnockedOutPieceIds,
          playerPieces: this.playerPieces,
          playerPlacements: this.playerPlacements,
          isSimulating: this.stateMachine.phase === GamePhase.SIMULATING,
          impacts: this.matchState.impacts ?? [],
          matchHistory: this.matchHistory,
          onSelectPiece: (pieceId) => this.selectMatchPiece(pieceId),
          onAimChange: (vector) => this.updateAimVector(vector),
          onGripChange: (gripPoint) => this.updateGripPoint(gripPoint),
          onFire: () => this.fireSelectedPiece(),
          onBackToTitle: () => this.returnToTitle(),
        });
      this.root.replaceChildren(this.matchView);
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
    this.clearSimulationFrame();
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
    this.matchHistory = [];
    this.matchState = {
      activePlayerId: 1,
      selectedPieceId: null,
      gripPoint: null,
      aimVector: { x: 0, y: 0 },
      lastKnockedOutPieceIds: [],
      result: null,
      simulationFrames: [],
      simulationFrameIndex: 0,
    };
    this.matchHistory = [];
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

    this.matchHistory = [];
    this.matchState = {
      activePlayerId: 1,
      selectedPieceId: null,
      aimVector: { x: 0, y: 0 },
      lastKnockedOutPieceIds: [],
      result: null,
      simulationFrames: [],
      simulationFrameIndex: 0,
    };
    this.stateMachine.transition(GamePhase.AIMING);
    this.render();
  }

  selectMatchPiece(pieceId) {
    this.matchState = {
      ...this.matchState,
      selectedPieceId: pieceId,
      gripPoint: null,
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

  updateGripPoint(gripPoint) {
    this.matchState = {
      ...this.matchState,
      gripPoint,
    };
  }

  fireSelectedPiece() {
    if (!this.matchState.selectedPieceId) {
      return;
    }

    this.stateMachine.transition(GamePhase.SIMULATING);
    playShotSound(getAimPower(this.matchState.aimVector));
    const simulation = simulateLaunch({
      playerPlacements: this.playerPlacements,
      selectedPieceId: this.matchState.selectedPieceId,
      aimVector: this.matchState.aimVector,
      gripCell: this.matchState.gripPoint?.cell,
      stepCount: 240,
      frameCount: 72,
    });

    this.matchState = {
      ...this.matchState,
      selectedPieceId: null,
      gripPoint: null,
      aimVector: { x: 0, y: 0 },
      simulationFrames: simulation.frames,
      simulationFrameIndex: 0,
      impacts: simulation.frames[0]?.impacts ?? [],
    };
    this.playerPlacements = simulation.frames[0]?.playerPlacements ?? simulation.playerPlacements;
    this.render();
    this.playSimulation(simulation);
  }

  playSimulation(simulation) {
    const nextFrameIndex = this.matchState.simulationFrameIndex + 1;

    if (nextFrameIndex < simulation.frames.length) {
      this.simulationFrameRequest = window.requestAnimationFrame(() => {
        if (this.stateMachine.phase !== GamePhase.SIMULATING) {
          return;
        }

        this.playerPlacements = simulation.frames[nextFrameIndex].playerPlacements;
        this.matchState = {
          ...this.matchState,
          simulationFrameIndex: nextFrameIndex,
          impacts: simulation.frames[nextFrameIndex].impacts ?? [],
        };
        for (const impact of this.matchState.impacts) {
          playImpactSound(impact.strength);
        }
        this.matchView?.updateMatch({
          playerPlacements: this.playerPlacements,
          aimVector: this.matchState.aimVector,
          isSimulating: true,
          impacts: this.matchState.impacts,
        });
        this.playSimulation(simulation);
      });
      return;
    }

    this.simulationFrameRequest = window.requestAnimationFrame(() => this.finishSimulation(simulation));
  }

  finishSimulation(simulation) {
    if (this.stateMachine.phase !== GamePhase.SIMULATING) {
      return;
    }

    this.simulationFrameRequest = null;
    this.playerPlacements = simulation.playerPlacements;
    if (simulation.fragmentedPieceIds.length > 0) {
      playBreakSound();
    }
    const result = getMatchResult(this.playerPlacements);
    this.matchHistory = [
      {
        playerId: this.matchState.activePlayerId,
        knockedOut: simulation.knockedOutPieceIds.length,
        fractured: simulation.fragmentedPieceIds.length,
      },
      ...this.matchHistory,
    ].slice(0, 4);
    this.matchState = {
      activePlayerId: this.matchState.activePlayerId === 1 ? 2 : 1,
      selectedPieceId: null,
      gripPoint: null,
      aimVector: { x: 0, y: 0 },
      lastKnockedOutPieceIds: simulation.knockedOutPieceIds,
      result,
      simulationFrames: [],
      simulationFrameIndex: 0,
    };

    if (result.finished) {
      this.stateMachine.transition(GamePhase.MATCH_OVER);
    } else {
      this.stateMachine.transition(GamePhase.AIMING);
    }

    this.render();
  }

  clearSimulationFrame() {
    if (this.simulationFrameRequest !== null) {
      window.cancelAnimationFrame(this.simulationFrameRequest);
      this.simulationFrameRequest = null;
    }
  }

  restartQuickMatch() {
    this.returnToTitle();
    this.startQuickLocalMatchSetup();
  }
}
