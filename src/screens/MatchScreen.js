import { MATCH_RENDER_CONFIG, PLACEMENT_CONFIG } from '../config/gameConfig.js';
import { getActivePieces } from '../match/boardOccupancy.js';
import { createMatchCanvas } from '../match/MatchCanvas.js';
import { getAimPower, getVectorMagnitude, isLaunchReady, setAimPower } from '../match/aiming.js';

export function renderMatchScreen({
  activePlayerId,
  selectedPieceId,
  aimVector,
  lastKnockedOutPieceIds = [],
  playerPieces,
  playerPlacements,
  isSimulating = false,
  impacts = [],
  matchHistory = [],
  onSelectPiece,
  onAimChange,
  onFire,
  onBackToTitle,
}) {
  const screen = document.createElement('main');
  screen.className = 'screen drawing-screen';
  const header = document.createElement('header');
  header.className = 'drawing-header';
  const titleGroup = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'screen-eyebrow';
  eyebrow.textContent = `PLAYER ${activePlayerId} TURN`;
  const title = document.createElement('h1');
  title.className = 'pixel-title';
  title.textContent = '대전';
  titleGroup.append(eyebrow, title);
  const backButton = document.createElement('button');
  backButton.className = 'secondary-action';
  backButton.type = 'button';
  backButton.textContent = '나가기';
  backButton.addEventListener('click', onBackToTitle);
  header.append(titleGroup, backButton);

  const layout = document.createElement('section');
  layout.className = 'placement-layout match-layout';
  const board = document.createElement('div');
  board.className = 'placement-board match-board';
  board.style.setProperty('--board-columns', PLACEMENT_CONFIG.BOARD_COLUMNS);
  board.style.setProperty('--board-rows', PLACEMENT_CONFIG.BOARD_ROWS);
  board.style.setProperty('--fine-grid-columns', PLACEMENT_CONFIG.BOARD_COLUMNS * MATCH_RENDER_CONFIG.FINE_GRID_SCALE);
  board.style.setProperty('--fine-grid-rows', PLACEMENT_CONFIG.BOARD_ROWS * MATCH_RENDER_CONFIG.FINE_GRID_SCALE);
  board.classList.toggle('is-simulating', isSimulating);

  let currentAimVector = aimVector;
  let powerValue;
  let powerSlider;
  let fireButton;
  let status;
  const canvasView = createMatchCanvas({
    board,
    state: { activePlayerId, selectedPieceId, aimVector, playerPlacements, isSimulating, impacts },
    onSelectPiece,
    onFire,
    onAimChange: (vector) => {
      currentAimVector = vector;
      onAimChange(vector);
      syncControls();
    },
  });

  const panel = document.createElement('aside');
  panel.className = 'drawing-panel placement-panel';
  panel.append(createLabel('현재 턴'));
  const turn = document.createElement('strong');
  turn.className = 'ink-count';
  turn.textContent = `${activePlayerId}P`;
  panel.append(turn, createLabel('말 선택'));
  const pieceList = document.createElement('div');
  pieceList.className = 'placement-piece-list';
  for (const piece of getActivePieces(playerPieces, playerPlacements, activePlayerId)) {
    const button = document.createElement('button');
    button.className = 'placement-piece-button';
    button.classList.toggle('is-active', piece.id === selectedPieceId);
    button.type = 'button';
    button.disabled = isSimulating;
    button.textContent = `${piece.id.split('-').at(-1)}번 말 / ${piece.pixelCount}칸`;
    button.addEventListener('click', () => onSelectPiece(piece.id));
    pieceList.append(button);
  }
  panel.append(pieceList, createLabel('발사 세기'));
  powerValue = document.createElement('strong');
  powerValue.className = 'ink-count';
  powerSlider = document.createElement('input');
  powerSlider.className = 'power-slider';
  powerSlider.type = 'range';
  powerSlider.min = '8';
  powerSlider.max = '100';
  powerSlider.step = '1';
  powerSlider.addEventListener('input', () => {
    if (!selectedPieceId || getVectorMagnitude(currentAimVector) === 0) return;
    currentAimVector = setAimPower(currentAimVector, Number(powerSlider.value) / 100);
    onAimChange(currentAimVector);
    canvasView.update({ aimVector: currentAimVector });
    syncControls();
  });
  fireButton = document.createElement('button');
  fireButton.className = 'primary-action';
  fireButton.type = 'button';
  fireButton.textContent = '발사';
  fireButton.addEventListener('click', onFire);
  status = document.createElement('p');
  const result = document.createElement('p');
  result.className = lastKnockedOutPieceIds.length ? 'validation-message is-valid' : 'validation-message';
  result.textContent = lastKnockedOutPieceIds.length ? `낙장: ${lastKnockedOutPieceIds.join(', ')}` : '아직 낙장된 말이 없습니다.';
  const history = document.createElement('div');
  history.className = 'match-history';
  for (const entry of matchHistory) {
    const item = document.createElement('p');
    item.textContent = `${entry.playerId}P / OUT ${entry.knockedOut} / BREAK ${entry.fractured}`;
    history.append(item);
  }
  panel.append(powerValue, powerSlider, fireButton, status, result, history);
  layout.append(board, panel);
  screen.append(header, layout);

  function syncControls() {
    const power = getAimPower(currentAimVector);
    const magnitude = getVectorMagnitude(currentAimVector);
    powerValue.textContent = `${Math.round(power * 100)}%`;
    powerSlider.value = String(Math.round(power * 100));
    powerSlider.disabled = isSimulating || !selectedPieceId || magnitude === 0;
    fireButton.disabled = isSimulating || !selectedPieceId || !isLaunchReady(currentAimVector);
    status.className = !isSimulating && selectedPieceId && isLaunchReady(currentAimVector) ? 'validation-message is-valid' : 'validation-message';
    status.textContent = isSimulating
      ? '발사 결과 계산 중'
      : !selectedPieceId
        ? '발사할 말을 선택해 주세요.'
        : !isLaunchReady(currentAimVector)
          ? '선택한 말을 직접 끌어 발사 방향과 세기를 정해 주세요.'
          : '발사 준비 완료.';
  }

  syncControls();
  screen.updateMatch = (nextState) => {
    currentAimVector = nextState.aimVector ?? currentAimVector;
    canvasView.update(nextState);
  };
  screen.destroyMatch = () => canvasView.destroy();
  return screen;
}

function createLabel(text) {
  const label = document.createElement('p');
  label.className = 'panel-label';
  label.textContent = text;
  return label;
}
