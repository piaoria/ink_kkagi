# Online Roadmap

현재 MVP에서는 온라인 기능을 구현하지 않는다.

## 현재 유지할 경계

다음 데이터는 JSON으로 직렬화 가능한 형태를 유지한다.

- PieceBlueprint
- 플레이어 정보
- 말 배치 정보
- 현재 턴
- 발사 명령
- 경기 결과

발사 명령은 다음 구조를 기준으로 확장한다.

```js
/**
 * @typedef {Object} ShotCommand
 * @property {string} pieceId
 * @property {{ x: number, y: number }} localStrikePoint
 * @property {{ x: number, y: number }} impulse
 * @property {number} turnNumber
 */
```

## 향후 온라인 구조

- GitHub Pages는 프런트엔드만 호스팅한다.
- 온라인 대전에는 별도 서버가 필요하다.
- 초대 코드 기반 일회용 방을 사용한다.
- 방당 인원은 2명이다.
- DB 저장 없이 서버 메모리에 방 상태를 유지한다.
- 일정 시간 미접속 시 방을 삭제한다.
- WebSocket으로 통신한다.
- 서버 권위형 물리 시뮬레이션을 권장한다.
- 클라이언트는 입력 전송과 상태 렌더링을 담당한다.
- 재접속용 일회성 세션 토큰을 검토한다.
- 경기 종료 후 방 데이터를 삭제한다.

## 지금 하지 않을 일

- WebSocket 패키지 설치
- 서버 코드 작성
- 방 생성 또는 초대 코드 UI 작성
- 가짜 네트워크 추상화 작성

