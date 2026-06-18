# 잉까기

잉까기는 제한된 잉크로 픽셀 형태의 말을 직접 그리고, 그 형태 그대로 물리
충돌체로 사용해 상대 말을 판 밖으로 밀어내는 로컬 1:1 웹 게임이다.

영문 표기는 현재 `Ink Kkagi`를 사용하지만, 코드 내부에서는 브랜드명을 과도하게
하드코딩하지 않는다.

## 핵심 콘셉트

- 사용자가 그린 픽셀 모양이 화면 표시와 실제 충돌 판정에 모두 사용된다.
- ㄷ, ㄹ, ㅁ, 긴 막대, 구멍, 오목한 부분은 실제 빈 공간과 전략 요소로 유지한다.
- 말 하나는 여러 픽셀 Fixture를 가진 하나의 단단한 Body로 만든다.
- 잉크가 많을수록 질량이 크고, 같은 충격량에서는 무거운 말이 덜 움직인다.
- 중심에서 먼 지점을 치면 회전이 발생해야 한다.

## 기술 스택

- JavaScript ES Modules
- Vite
- HTML, CSS, Vanilla JavaScript
- Canvas 2D
- Planck.js
- Galmuri pixel font
- Vitest
- ESLint
- Prettier
- GitHub Pages, GitHub Actions

## 설치

```bash
npm install
```

Windows PowerShell 실행 정책 때문에 `npm`이 막히면 다음처럼 실행한다.

```bash
npm.cmd install
```

## 실행

```bash
npm run dev
```

## 테스트

```bash
npm run test
```

## 빌드

```bash
npm run build
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 production build를 만들고 GitHub Pages에
배포한다. Vite base 경로는 `/ink_kkagi/`로 설정되어 있다.

## 현재 구현 범위

- Milestone 0 진행 중
- 문서와 기본 프로젝트 구조
- Vite 기반 빈 메인 화면
- 상태 머신의 최소 단위 테스트

## 온라인 모드

현재 MVP에서는 온라인 대전을 구현하지 않는다. 향후 별도 서버와 WebSocket을
붙일 수 있도록 JSON 직렬화 가능한 데이터 모델을 유지한다.
