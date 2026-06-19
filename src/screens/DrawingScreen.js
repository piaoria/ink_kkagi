import { DRAWING_CONFIG, PLAYER_COLORS } from '../config/gameConfig.js';
import {
  getCurrentPieceNumber,
  getMaxInkForCurrentPiece,
  getMinInkForCurrentPiece,
  getRemainingInk,
} from '../drawing/inkAllocator.js';
import { normalizeCells, toCellKey, validatePieceDraft } from '../drawing/drawingValidation.js';
import { interpolateOrthogonalPath } from '../drawing/strokeTraversal.js';

/**
 * @param {{
 *   ownerId: 1 | 2,
 *   completedPieces: { id: string, pixelCount: number }[],
 *   draftCells: { x: number, y: number }[],
 *   onDraftChange: (cells: { x: number, y: number }[]) => void,
 *   onConfirmPiece: (cells: { x: number, y: number }[]) => void,
 *   onBack: () => void,
 * }} params
 * @returns {HTMLElement}
 */
export function renderDrawingScreen({
  ownerId,
  completedPieces,
  draftCells,
  onDraftChange,
  onConfirmPiece,
  onBack,
}) {
  const screen = document.createElement('main');
  screen.className = 'screen drawing-screen';

  const header = document.createElement('header');
  header.className = 'drawing-header';

  const titleGroup = document.createElement('div');

  const eyebrow = document.createElement('p');
  eyebrow.className = 'screen-eyebrow';
  eyebrow.textContent = `PLAYER ${ownerId}`;

  const title = document.createElement('h1');
  title.className = 'pixel-title';
  title.textContent = `말 ${getCurrentPieceNumber(completedPieces)}`;

  titleGroup.append(eyebrow, title);

  const backButton = document.createElement('button');
  backButton.className = 'secondary-action';
  backButton.type = 'button';
  backButton.textContent = '메인';
  backButton.addEventListener('click', onBack);

  header.append(titleGroup, backButton);

  const layout = document.createElement('section');
  layout.className = 'drawing-layout';

  const grid = document.createElement('div');
  grid.className = 'drawing-grid';
  grid.style.setProperty('--player-ink', PLAYER_COLORS[ownerId]);
  grid.setAttribute('aria-label', '8x8 말 제작 그리드');

  const cellMap = new Map();
  let cells = normalizeCells(draftCells);
  let isDrawing = false;
  let toolMode = 'draw';
  let lastDrawCell = cells.at(-1) ?? null;

  const syncGrid = () => {
    const keys = new Set(cells.map(toCellKey));
    const validation = validatePieceDraft({ cells, completedPieces });
    const remainingInk = getRemainingInk(completedPieces);
    const currentMaxInk = getMaxInkForCurrentPiece(completedPieces);
    const currentMinInk = getMinInkForCurrentPiece(completedPieces);

    for (const [key, cell] of cellMap) {
      cell.classList.toggle('is-inked', keys.has(key));
    }

    inkCount.textContent = `${validation.currentInk}칸`;
    remainingInkValue.textContent = `${remainingInk}칸`;
    minMax.textContent = `${currentMinInk}-${currentMaxInk}칸`;
    confirmButton.textContent = getConfirmButtonLabel({
      ownerId,
      remainingPiecesAfterConfirm: validation.remainingPiecesAfterConfirm,
    });
    confirmButton.disabled = !validation.valid;
    validationMessage.textContent = validation.valid
      ? '확정할 수 있습니다.'
      : validation.errors[0] ?? '말을 그려주세요.';
    validationMessage.classList.toggle('is-valid', validation.valid);
    onDraftChange(cells);
  };

  const addCell = (x, y) => {
    if (cells.length >= getMaxInkForCurrentPiece(completedPieces)) {
      return;
    }

    const key = toCellKey({ x, y });
    if (cells.some((cell) => toCellKey(cell) === key)) {
      return;
    }

    cells = [...cells, { x, y }];
    syncGrid();
  };

  const drawToCell = (x, y) => {
    const target = { x, y };
    const path = interpolateOrthogonalPath(lastDrawCell ?? cells.at(-1), target);

    for (const pathCell of path) {
      addCell(pathCell.x, pathCell.y);
    }

    lastDrawCell = target;
  };

  const eraseCell = (x, y) => {
    const key = toCellKey({ x, y });
    const nextCells = cells.filter((cell) => toCellKey(cell) !== key);

    if (nextCells.length !== cells.length) {
      cells = nextCells;
      lastDrawCell = cells.at(-1) ?? null;
      syncGrid();
    }
  };

  const handleCellAction = (x, y) => {
    if (toolMode === 'erase') {
      eraseCell(x, y);
      return;
    }

    drawToCell(x, y);
  };

  const addCellFromPointer = (event) => {
    const target = document.elementFromPoint(event.clientX, event.clientY);
    if (!target?.classList.contains('drawing-cell')) {
      return;
    }

    handleCellAction(Number(target.dataset.x), Number(target.dataset.y));
  };

  for (let y = 0; y < DRAWING_CONFIG.GRID_ROWS; y += 1) {
    for (let x = 0; x < DRAWING_CONFIG.GRID_COLUMNS; x += 1) {
      const cell = document.createElement('button');
      cell.className = 'drawing-cell';
      cell.type = 'button';
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      cell.setAttribute('aria-label', `${x + 1}열 ${y + 1}행`);

      cell.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        isDrawing = true;
        cell.setPointerCapture(event.pointerId);
        handleCellAction(x, y);
      });

      cell.addEventListener('pointermove', (event) => {
        if (isDrawing) {
          event.preventDefault();
          addCellFromPointer(event);
        }
      });

      cell.addEventListener('pointerenter', () => {
        if (isDrawing) {
          handleCellAction(x, y);
        }
      });

      cell.addEventListener('pointerup', () => {
        isDrawing = false;
      });

      cell.addEventListener('pointercancel', () => {
        isDrawing = false;
      });

      cellMap.set(`${x},${y}`, cell);
      grid.append(cell);
    }
  }

  const panel = document.createElement('aside');
  panel.className = 'drawing-panel';

  const progress = document.createElement('div');
  progress.className = 'piece-progress';

  for (let index = 0; index < DRAWING_CONFIG.PIECES_PER_PLAYER; index += 1) {
    const marker = document.createElement('span');
    marker.textContent = String(index + 1);
    marker.className = index < completedPieces.length ? 'piece-marker is-complete' : 'piece-marker';
    if (index === completedPieces.length) {
      marker.classList.add('is-current');
    }
    progress.append(marker);
  }

  const modeGroup = document.createElement('div');
  modeGroup.className = 'tool-mode-group';

  const drawButton = document.createElement('button');
  drawButton.className = 'tool-mode-button is-active';
  drawButton.type = 'button';
  drawButton.textContent = '그리기';

  const eraseButton = document.createElement('button');
  eraseButton.className = 'tool-mode-button';
  eraseButton.type = 'button';
  eraseButton.textContent = '지우개';

  const syncToolButtons = () => {
    drawButton.classList.toggle('is-active', toolMode === 'draw');
    eraseButton.classList.toggle('is-active', toolMode === 'erase');
  };

  drawButton.addEventListener('click', () => {
    toolMode = 'draw';
    syncToolButtons();
  });

  eraseButton.addEventListener('click', () => {
    toolMode = 'erase';
    syncToolButtons();
  });

  modeGroup.append(drawButton, eraseButton);

  const inkLabel = document.createElement('p');
  inkLabel.className = 'panel-label';
  inkLabel.textContent = '현재 말';

  const inkCount = document.createElement('strong');
  inkCount.className = 'ink-count';

  const remainingInkLabel = document.createElement('p');
  remainingInkLabel.className = 'panel-label';
  remainingInkLabel.textContent = '남은 잉크';

  const remainingInkValue = document.createElement('strong');
  remainingInkValue.className = 'ink-count';

  const minMaxLabel = document.createElement('p');
  minMaxLabel.className = 'panel-label';
  minMaxLabel.textContent = '이번 말 허용';

  const minMax = document.createElement('strong');
  minMax.className = 'ink-count';

  const piecesList = document.createElement('div');
  piecesList.className = 'pieces-list';

  for (const piece of completedPieces) {
    const item = document.createElement('span');
    item.className = 'piece-chip';
    item.textContent = `${piece.id.split('-').at(-1)}번 ${piece.pixelCount}칸`;
    piecesList.append(item);
  }

  if (completedPieces.length === 0) {
    const emptyItem = document.createElement('span');
    emptyItem.className = 'piece-chip is-empty';
    emptyItem.textContent = '아직 없음';
    piecesList.append(emptyItem);
  }

  const resetButton = document.createElement('button');
  resetButton.className = 'secondary-action';
  resetButton.type = 'button';
  resetButton.textContent = '다시 그리기';
  resetButton.addEventListener('click', () => {
    cells = [];
    lastDrawCell = null;
    syncGrid();
  });

  const confirmButton = document.createElement('button');
  confirmButton.className = 'primary-action';
  confirmButton.type = 'button';
  confirmButton.textContent = '이 말 확정';
  confirmButton.addEventListener('click', () => {
    const validation = validatePieceDraft({ cells, completedPieces });
    if (validation.valid) {
      onConfirmPiece(cells);
    }
  });

  const validationMessage = document.createElement('p');
  validationMessage.className = 'validation-message';

  panel.append(
    progress,
    modeGroup,
    inkLabel,
    inkCount,
    remainingInkLabel,
    remainingInkValue,
    minMaxLabel,
    minMax,
    piecesList,
    validationMessage,
    resetButton,
    confirmButton,
  );
  layout.append(grid, panel);
  screen.append(header, layout);

  syncGrid();

  return screen;
}

function getConfirmButtonLabel({ ownerId, remainingPiecesAfterConfirm }) {
  if (remainingPiecesAfterConfirm > 0) {
    return '이 말 확정';
  }

  return ownerId === 1 ? '2P 제작으로' : '배치로 이동';
}
