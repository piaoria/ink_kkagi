# 잉까기

직접 그린 픽셀 말을 튕겨 상대 말을 낙장시키는 로컬 1:1 물리 대전 게임입니다.

## 현재 구현 범위

- 빠른 시작
- 직접 말 제작
- 말 3개 제작, 잉크 수 검증, 지우개 모드
- 자동 배치 및 직접 배치
- 1P/2P 경기 화면
- 말 선택, 조준, 발사
- Planck 기반 물리 이동
- 낙장 처리
- 턴 전환
- 승패/무승부 판정
- 경기 종료 화면과 빠른 재시작
- 모바일 터치 조작 보정
- PWA manifest/service worker 기반 설치 지원

## 기술 스택

- JavaScript ES Modules
- Vite
- HTML, CSS, Vanilla JavaScript
- Planck.js
- Galmuri pixel font
- Vitest
- ESLint
- GitHub Pages, GitHub Actions

## 설치

```bash
npm install
```

Windows PowerShell에서 `npm` 실행이 막히면 다음 명령을 사용합니다.

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

`main` 브랜치에 push하면 GitHub Actions가 production build를 만들고 GitHub Pages에 배포합니다.
Vite base 경로는 `/ink_kkagi/`입니다.

배포 페이지: https://piaoria.github.io/ink_kkagi/
