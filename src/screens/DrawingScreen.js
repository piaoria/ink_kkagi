import { DRAWING_CONFIG, PLAYER_COLORS } from '../config/gameConfig.js';

/**
 * @param {{
 *   ownerId: 1 | 2,
 *   draftCells: { x: number, y: number }[],
 *   onDraftChange: (cells: { x: number, y: number }[]) => void,
 *   onBack: () => void,
 * }} params
 * @returns {HTMLElement}
 */
export function renderDrawingScreen({ ownerId, draftCells, onDraftChange, onBack }) {
  const screen = document.createElement('main');
  screen.className = 'screen drawing-screen';

  const header = document.createElement('header');
  header.className = 'drawing-header';

  const titleGroup = document.createElement('div');

  const eyebrow = document.createElement('p');
  eyebrow.className = 'screen-eyebrow';
  eyebrow.textContent = `PLAYER ${ownerId}`;

  const title = document.createElement('h1');
  title.textContent = '말 제작';

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
  grid.setAttribute('aria-label', '8x8 픽셀 말 제작 그리드');

  const cellMap = new Map();
  let cells = normalizeCells(draftCells);
  let isDrawing = false;

  const syncGrid = () => {
    const keys = new Set(cells.map(toCellKey));

    for (const [key, cell] of cellMap) {
      cell.classList.toggle('is-inked', keys.has(key));
    }

    inkCount.textContent = `${cells.length} / ${DRAWING_CONFIG.TOTAL_INK}`;
    minMax.textContent = `${DRAWING_CONFIG.MIN_INK_PER_PIECE}-${DRAWING_CONFIG.MAX_INK_PER_PIECE}칸`;
    onDraftChange(cells);
  };

  const addCell = (x, y) => {
    if (cells.length >= DRAWING_CONFIG.MAX_INK_PER_PIECE) {
      return;
    }

    const key = toCellKey({ x, y });
    if (cells.some((cell) => toCellKey(cell) === key)) {
      return;
    }

    cells = [...cells, { x, y }];
    syncGrid();
  };

  const addCellFromPointer = (event) => {
    const target = document.elementFromPoint(event.clientX, event.clientY);
    if (!target?.classList.contains('drawing-cell')) {
      return;
    }

    addCell(Number(target.dataset.x), Number(target.dataset.y));
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
        addCell(x, y);
      });

      cell.addEventListener('pointermove', (event) => {
        if (isDrawing) {
          event.preventDefault();
          addCellFromPointer(event);
        }
      });

      cell.addEventListener('pointerenter', () => {
        if (isDrawing) {
          addCell(x, y);
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

  const inkLabel = document.createElement('p');
  inkLabel.className = 'panel-label';
  inkLabel.textContent = '사용 잉크';

  const inkCount = document.createElement('strong');
  inkCount.className = 'ink-count';

  const minMaxLabel = document.createElement('p');
  minMaxLabel.className = 'panel-label';
  minMaxLabel.textContent = '말 하나 기준';

  const minMax = document.createElement('strong');
  minMax.className = 'ink-count';

  const resetButton = document.createElement('button');
  resetButton.className = 'secondary-action';
  resetButton.type = 'button';
  resetButton.textContent = '다시 그리기';
  resetButton.addEventListener('click', () => {
    cells = [];
    syncGrid();
  });

  const confirmButton = document.createElement('button');
  confirmButton.className = 'primary-action';
  confirmButton.type = 'button';
  confirmButton.textContent = '이 말 확정';
  confirmButton.disabled = true;

  panel.append(inkLabel, inkCount, minMaxLabel, minMax, resetButton, confirmButton);
  layout.append(grid, panel);
  screen.append(header, layout);

  syncGrid();

  return screen;
}

function normalizeCells(cells) {
  const seen = new Set();
  const normalized = [];

  for (const cell of cells) {
    const key = toCellKey(cell);
    if (!seen.has(key)) {
      seen.add(key);
      normalized.push({ x: cell.x, y: cell.y });
    }
  }

  return normalized;
}

function toCellKey({ x, y }) {
  return `${x},${y}`;
}
