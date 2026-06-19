import { DRAWING_CONFIG, GAME_INFO } from '../config/gameConfig.js';

export function renderMainScreen({ onStartLocal, onStartQuick }) {
  const screen = document.createElement('main');
  screen.className = 'screen title-screen';

  const content = document.createElement('section');
  content.className = 'title-layout';
  const copy = document.createElement('div');
  copy.className = 'title-copy';
  copy.append(renderPixelLogo());

  const title = document.createElement('h1');
  title.className = 'pixel-title';
  title.textContent = GAME_INFO.koreanTitle;
  const subtitle = document.createElement('p');
  subtitle.className = 'title-subtitle';
  subtitle.textContent = GAME_INFO.englishTitle;
  const tags = document.createElement('ul');
  tags.className = 'concept-tags';
  for (const label of ['잉크 말 제작', '그립 회전 충돌', '로컬 1:1 대전']) {
    const tag = document.createElement('li');
    tag.textContent = label;
    tags.append(tag);
  }

  const actions = document.createElement('div');
  actions.className = 'title-actions';
  const quickStartButton = document.createElement('button');
  quickStartButton.className = 'primary-action title-start-action';
  quickStartButton.type = 'button';
  quickStartButton.textContent = '빠른 시작';
  quickStartButton.addEventListener('click', onStartQuick);
  const customStartButton = document.createElement('button');
  customStartButton.className = 'secondary-action';
  customStartButton.type = 'button';
  customStartButton.textContent = '직접 시작';
  customStartButton.addEventListener('click', onStartLocal);
  const status = document.createElement('p');
  status.className = 'phase-status';
  status.textContent = `${DRAWING_CONFIG.PIECES_PER_PLAYER}개 말 / ${DRAWING_CONFIG.TOTAL_INK}칸 잉크`;
  actions.append(quickStartButton, customStartButton, status);

  copy.append(title, subtitle, tags, actions);
  content.append(copy, renderLiveArena());
  screen.append(content);
  return screen;
}

function renderPixelLogo() {
  const logo = document.createElement('div');
  logo.className = 'pixel-logo';
  logo.setAttribute('aria-hidden', 'true');
  const blueCells = new Set(['1,1', '2,1', '3,1', '1,2', '1,3', '2,4', '3,4', '4,4']);
  const orangeCells = new Set(['6,2', '7,2', '7,3', '5,5', '6,5', '7,5']);
  const sparkCells = new Set(['4,1', '5,3', '3,6', '6,6']);
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const cell = document.createElement('span');
      const key = `${x},${y}`;
      cell.className = 'pixel-logo-cell';
      if (blueCells.has(key)) cell.classList.add('is-blue');
      else if (orangeCells.has(key)) cell.classList.add('is-orange');
      else if (sparkCells.has(key)) cell.classList.add('is-spark');
      logo.append(cell);
    }
  }
  return logo;
}

function renderLiveArena() {
  const arena = document.createElement('div');
  arena.className = 'title-arena';
  arena.setAttribute('aria-label', 'Live match preview');
  arena.append(
    renderArenaPiece(
      [
        { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 },
        { x: 2, y: 8 }, { x: 2, y: 9 }, { x: 3, y: 9 },
      ],
      'is-blue',
    ),
    renderArenaPiece(
      [
        { x: 13, y: 9 }, { x: 14, y: 9 }, { x: 15, y: 9 },
        { x: 15, y: 10 }, { x: 14, y: 11 }, { x: 15, y: 11 },
      ],
      'is-orange',
    ),
    renderImpactBurst(),
  );
  return arena;
}

function renderArenaPiece(cells, colorClass) {
  const piece = document.createElement('div');
  piece.className = `arena-piece ${colorClass}`;
  for (const cell of cells) {
    const block = document.createElement('span');
    block.className = 'arena-block';
    block.style.left = `${cell.x * 5 + 0.55}%`;
    block.style.top = `${cell.y * 5 + 0.55}%`;
    piece.append(block);
  }
  return piece;
}

function renderImpactBurst() {
  const burst = document.createElement('div');
  burst.className = 'arena-impact';
  for (let index = 0; index < 8; index += 1) {
    const spark = document.createElement('span');
    spark.style.setProperty('--index', index);
    burst.append(spark);
  }
  return burst;
}
