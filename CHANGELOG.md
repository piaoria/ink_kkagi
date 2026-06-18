# Changelog

## 0.1.0

### Added

- 프로젝트 문서 초안 추가
- Vite 기반 프로젝트 설정 추가
- GitHub Pages용 Vite base 설정 추가
- 기본 메인 화면 추가
- 1P 말 제작 화면의 초기 8x8 그리드 추가
- 게임 상태 머신의 최소 구조 추가
- 상태 전이 단위 테스트 추가
- GitHub Pages 배포 workflow 추가

### Changed

- Planck.js 의존성을 공식 `planck` 패키지로 설정
- Windows 원격 개발 환경에서 Vite 설정을 로드할 수 있도록 `--configLoader runner` 적용
- 로컬 대전 버튼을 누른 뒤 placeholder 문구 대신 제작 화면을 렌더링하도록 변경

### Known Issues

- `npm install` 기준 낮은 심각도 보안 알림 1건이 보고됨
