# Architecture

## 방향

잉까기는 Canvas와 물리 루프가 중심인 게임이다. React나 Vue 같은 UI 프레임워크
없이 Vanilla JavaScript와 명시적인 상태 머신으로 구성한다.

## 책임 분리

다음 네 가지 책임은 반드시 분리한다.

- 게임 규칙
- 물리 시뮬레이션
- Canvas 렌더링
- 사용자 입력

## 주요 디렉터리

```text
src/
  app/
  config/
  drawing/
  game/
  input/
  models/
  physics/
  rendering/
  screens/
  styles/
  utils/
tests/
docs/
```

Milestone 0에서는 실제로 사용하는 최소 파일만 만든다. 이후 기능이 들어갈 때
관련 디렉터리와 모듈을 확장한다.

## 상태 머신

화면과 경기 진행은 `GameStateMachine`에서 관리한다.

```js
const GamePhase = {
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
};
```

`SIMULATING` 상태에서는 새 입력을 받지 않는다. 모든 말이 정지한 뒤에만 다음
`AIMING` 상태로 전환한다.

## 데이터 모델

사용자가 그린 말의 원본 데이터는 JSON으로 직렬화 가능한 순수 데이터로 유지한다.

```js
/**
 * @typedef {Object} PieceBlueprint
 * @property {string} id
 * @property {1 | 2} ownerId
 * @property {{ x: number, y: number }[]} cells
 * @property {number} pixelCount
 * @property {string} color
 */
```

Planck Body는 런타임 객체이므로 `PieceBlueprint`에 넣지 않는다.

## 좌표계

입력과 렌더링은 다음 변환을 거친다.

```text
Pointer Client Coordinate
-> Canvas Coordinate
-> Game World Coordinate
```

좌표 변환 로직은 한 곳에 모아 PC와 모바일 터치에서 같은 규칙을 사용한다.

## 배포

Vite base는 `/ink_kkagi/`로 설정한다. 라우터가 필요하지 않은 단일 페이지 구조를
유지하고, 게임 상태에 따라 화면만 전환한다.

