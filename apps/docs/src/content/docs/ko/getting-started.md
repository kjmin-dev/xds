---
title: 시작하기
description: xds로 새 프로젝트를 생성해 실행하고 디자인을 수정하는 방법을 안내합니다.
---

xds는 의존성으로 설치해 쓰는 패키지가 아니라 프로젝트 템플릿입니다. `xds create`를 실행하면 디자인 토큰과 컴포넌트 라이브러리, 그리고 선택한 각 클라이언트의 작은 앱이 저장소에 복사되며, 이후에는 직접 수정해 사용할 수 있습니다.

## 프로젝트 만들기

아직 배포된 `xds` 릴리스가 없습니다. 첫 릴리스가 나오기 전까지는 저장소를 받아 직접 빌드합니다.

```sh
git clone https://github.com/kjmin-dev/xds && cd xds
mise install
cargo install --path cli
```

그다음 새 프로젝트를 생성합니다.

```sh
xds create my-app
```

기본적으로 `xds`는 프로젝트 이름, 포함할 클라이언트, 컬러 테마를 차례로 묻습니다. 각 프롬프트는 기본값(디렉터리 이름, `web-react` 클라이언트, `indigo` 테마)이 선택된 상태로 시작합니다. 프롬프트를 건너뛰려면 각 옵션을 플래그로 전달하거나, `--yes`를 전달해 기본값을 그대로 사용하세요.

```sh
xds create my-app --name orbit --targets web-react,kotlin-compose --theme ocean
xds create my-app --yes
```

선택할 수 있는 클라이언트는 다음과 같습니다.

| 타깃 | 실행 환경 | 스택 |
| --- | --- | --- |
| `web-react` | 브라우저 | React 19, Vite, Tailwind v4, Zag.js |
| `web-solid` | 브라우저 | SolidJS 2 (release candidate), Vite, Tailwind v4, Zag.js |
| `desktop-gpui` | macOS | Rust, GPUI, GPUI Component |
| `mobile-react-native` | iOS, Android | React Native, Expo |
| `kotlin-compose` | Android, iOS, 데스크톱 | Kotlin Multiplatform, Compose Multiplatform |

두 웹 클라이언트는 한 프로젝트에 함께 넣을 수 있습니다. 각각 앱, 포트, `mise` 별칭이 따로 있습니다.

## 실행하기

프로젝트는 [mise](https://mise.jdx.dev)를 사용해 도구 버전을 고정하고 작업을 실행합니다.

```sh
cd my-app
mise trust
mise install
mise run fmt
mise run check
```

프로젝트 이름이 반영되면서 줄 길이와 import 순서가 달라질 수 있으므로, 첫 `mise run check`를 실행하기 전에 `mise run fmt`를 한 번 먼저 실행하세요. 웹 클라이언트가 있으면 `mise run check`가 웹 컴포넌트를 Google Chrome에서 테스트하므로 Chrome이 설치되어 있어야 합니다. 선택한 각 클라이언트를 시작하는 명령(예: `mise run //web:dev`)도 `xds`가 함께 출력합니다.

각 앱에는 모든 토큰과 컴포넌트를 한 화면에서 확인할 수 있는 디자인 프리뷰가 포함되어 있습니다.

## 디자인 바꾸기

1. `design/tokens` 아래의 토큰 파일을 수정하거나 `xds theme <name>`으로 컬러 테마를 변경합니다.
2. `mise run tokens`를 실행해 플랫폼별 파일을 다시 생성합니다. 토큰 형식이 잘못되었거나 색상 조합의 명암비가 기준치보다 낮으면 빌드가 실패합니다.
3. 수정한 토큰 파일과 생성된 파일을 함께 커밋합니다.

## 다음에 볼 것

- [명령어](/ko/cli/commands/): `xds`의 모든 명령어와 플래그 설명 (영문)
- [구조](/ko/design-system/overview/): 토큰 계층과 컴포넌트 규격 설명 (영문)
- [컬러](/ko/tokens/colors/): 모든 컬러 토큰의 라이트·다크 값 목록 (영문)
