---
title: 시작하기
description: xds로 새 프로젝트를 만들고 로컬에서 실행한 뒤 디자인 토큰을 수정하는 방법을 안내합니다.
---

xds는 패키지로 설치해 쓰는 라이브러리가 아니라 프로젝트 템플릿입니다. `xds create`를 실행하면 디자인 토큰과 컴포넌트 라이브러리, 선택한 타깃별 샘플 앱이 새 저장소에 복사되므로 코드를 직접 수정해 쓸 수 있습니다.

## 프로젝트 만들기

아직 정식 릴리스 전이라 저장소를 클론해 CLI를 직접 빌드해야 합니다.

```sh
git clone https://github.com/kjmin-dev/xds && cd xds
mise install
cargo install --path cli
```

빌드가 끝나면 새 프로젝트를 생성합니다.

```sh
xds create my-app
```

옵션 없이 실행하면 프로젝트 이름, 포함할 타깃, 컬러 테마를 차례로 입력받습니다. 기본값은 디렉터리 이름, `web-react`, `indigo`입니다. 대화형 입력을 건너뛰려면 플래그를 직접 넘기거나 `--yes`로 기본값을 그대로 사용합니다.

```sh
xds create my-app --name orbit --targets web-react,kotlin-compose --theme ocean
xds create my-app --yes
```

선택할 수 있는 타깃은 다음과 같습니다.

| 타깃 | 실행 환경 | 스택 |
| --- | --- | --- |
| `web-react` | 브라우저 | React 19, Vite, Tailwind v4, Zag.js |
| `web-solid` | 브라우저 | SolidJS 2 (release candidate), Vite, Tailwind v4, Zag.js |
| `web-vue` | 브라우저 | Vue 3, Vite, Tailwind v4, Zag.js |
| `web-svelte` | 브라우저 | Svelte 5, Vite, Tailwind v4, Zag.js |
| `desktop-electron` | macOS, Windows, Linux | Electron (웹 타깃 래핑) |
| `desktop-tauri` | macOS, Windows, Linux | Tauri 2 (웹 타깃 래핑) |
| `desktop-gpui` | macOS | Rust, GPUI, GPUI Component |
| `mobile-react-native` | iOS, Android | React Native, Expo |
| `kotlin-compose` | Android, iOS, 데스크톱 | Kotlin Multiplatform, Compose Multiplatform |
| `dart-flutter` | Android, iOS | Dart, Flutter widgets |

웹 타깃은 한 프로젝트에 여러 개를 함께 넣을 수 있습니다. 타깃마다 앱 디렉터리와 개발 서버 포트, `mise` 별칭이 분리됩니다.

## 실행하기

도구 버전 고정과 작업 실행에는 [mise](https://mise.jdx.dev)를 씁니다.

```sh
cd my-app
mise trust
mise install
mise run fmt
mise run check
```

프로젝트 이름이 치환되면서 줄 길이와 import 정렬 순서가 달라지므로, 처음 `mise run check`를 돌리기 전에 `mise run fmt`를 실행해야 합니다. 웹 타깃이 있으면 Google Chrome에서 컴포넌트 동작 테스트를 실행하므로 Chrome이 설치되어 있어야 합니다. `mobile-react-native`가 포함된 경우에는 Expo 앱을 iOS·Android용으로 번들하고 네이티브 패키지가 Expo SDK 기준 버전에 맞는지도 확인합니다. 생성 직후 터미널에 각 타깃의 실행 명령(예: `mise run //web:dev`)이 함께 출력됩니다.

모든 샘플 앱에는 토큰과 컴포넌트를 한 화면에 모아 보는 디자인 프리뷰 화면이 들어 있습니다.

## 디자인 수정하기

1. `design/tokens` 아래 토큰 JSON을 수정하거나 `xds theme <name>`으로 컬러 테마를 바꿉니다.
2. `mise run tokens`를 실행해 플랫폼별 파일을 다시 생성합니다. 토큰 형식이 잘못됐거나 WCAG 명암비 기준에 못 미치는 색상 조합이 있으면 빌드가 중단됩니다.
3. 수정한 토큰 원본과 생성된 파일을 함께 커밋합니다.

## 다음 문서

- [명령어](/ko/cli/commands/) — `xds` 명령어와 플래그 전체 레퍼런스 (영문)
- [구조](/ko/design-system/overview/) — 토큰 계층과 컴포넌트 규격 (영문)
- [컬러](/ko/tokens/colors/) — 라이트·다크 모드 전체 컬러 토큰 목록 (영문)
