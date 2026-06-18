# Changelog

## 0.1.0

### Added

- 프로젝트 문서 초안 추가
- Vite 기반 프로젝트 설정 추가
- GitHub Pages용 Vite base 설정 추가
- 기본 메인 화면 추가
- 1P 말 제작 화면과 초기 8x8 그리드 추가
- Galmuri 기반 픽셀 도트 폰트 적용
- 데모 아트 컨셉의 픽셀 로고와 각진 UI 스타일 추가
- 말 3개 제작 흐름, 지우개 모드, 잉크 검증 로직 추가
- 1P/2P 말 배치 화면, 회전, 진영/겹침/보드 경계 검증 추가
- 게임 상태 머신 최소 구조 추가
- 상태 전이 단위 테스트 추가
- GitHub Pages 배포 workflow 추가

### Changed

- Planck.js 의존성을 공식 `planck` 패키지로 설정
- Windows 원격 개발 환경에서 Vite 설정을 로드할 수 있도록 `--configLoader runner` 적용
- 로컬 대전 버튼을 실제 제작 화면으로 이동하도록 변경
- 배치 난이도를 낮추기 위해 총 잉크를 42칸으로 줄이고, 보드를 12x18 및 진영 9줄로 조정
- 배치 공간을 더 확보하기 위해 보드를 14x20 및 진영 10줄로 확대
- Vite와 Vitest를 업데이트해 `esbuild` 개발 서버 취약점 알림 제거
- CI clean install을 위해 `@emnapi` peer dependency 명시

### Known Issues

- 현재 `npm audit` 기준 보고된 취약점 없음
