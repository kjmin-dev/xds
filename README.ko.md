# 크로스플랫폼 디자인 시스템 템플릿

[English](README.md)

여러 클라이언트 환경에 함께 출시하는 제품을 위한 시작 템플릿입니다. 단일 디자인 토큰 셋에서 각 플랫폼의 컴포넌트 라이브러리를 생성하며, 플랫폼마다 이를 실제로 사용하는 작은 앱이 포함되어 있습니다.

| 클라이언트 | 스택 | 컴포넌트 | 앱 |
| --- | --- | --- | --- |
| 웹 | React 19, Vite, Tailwind v4, HeroUI v3 | `packages/ui` | `apps/web` |
| 데스크톱 | Rust, GPUI, GPUI Component | `crates/acme-ui` | `apps/desktop` |
| 모바일 | React Native, Expo | `packages/ui-native` | `apps/mobile` |

`acme`는 임시로 넣어 둔 플레이스홀더 이름이므로 프로젝트에 맞게 바꿔 쓰시면 됩니다.

## 구성

- `design/tokens`에 DTCG 형식의 토큰 원본이 들어 있습니다. 기본 팔레트, 라이트·다크 모드 시맨틱 컬러, 컴포넌트 전용 컬러, 타이포그래피 역할, 여백(space), 모서리 곡률(radius), 모션, 그리고 포인터(마우스)와 터치 입력 환경별 컨트롤 크기를 정의합니다.
- `tools/design-build`는 토큰 파일을 읽어 CSS 커스텀 프로퍼티, Tailwind 테마, TypeScript 상수, Rust 상수 코드를 생성합니다. 색상 조합의 명암비가 WCAG 기준에 미달하면 빌드 단계에서 바로 실패 처리합니다.
- 모든 플랫폼이 동일한 이름과 옵션으로 맞춰진 컴포넌트(Button, TextField, Text, Badge, Banner, Card, Divider, Spinner)를 제공합니다.
- 각 플랫폼 앱에는 모든 토큰과 컴포넌트를 한눈에 확인할 수 있는 디자인 프리뷰 화면이 들어 있습니다.

설계 의도와 세부 규칙은 [디자인 시스템 문서](docs/design-system.md)(영문)에 정리되어 있습니다.

## 시작하기

먼저 [mise](https://mise.jdx.dev)를 설치해 프로젝트에 고정된 버전의 Node, pnpm, Rust를 맞춥니다.

```sh
mise install
mise run check          # CI가 돌리는 것 전부
```

| 작업 | 명령어 |
| --- | --- |
| 웹 앱 실행 | `mise run //web:dev` 실행 후 `http://localhost:5173` 접속 |
| 웹 디자인 프리뷰 열기 | `http://localhost:5173/design` 접속 |
| 데스크톱 앱 실행 | `mise run //desktop:dev` |
| 데스크톱 디자인 프리뷰 열기 | `mise run //desktop:design` |
| 모바일 앱 실행 | `mise run //mobile:ios` 또는 `mise run //mobile:android` |
| 토큰 파일 재생성 | `mise run tokens` |
| 전체 코드 포맷 | `mise run fmt` |

데스크톱 앱은 macOS 환경에서 빌드됩니다. 모바일 앱의 디자인 프리뷰는 홈 화면에 있는 버튼을 눌러 열 수 있습니다.

## 디자인 수정하기

1. `design/tokens` 디렉터리의 JSON 파일을 수정합니다.
2. `mise run tokens`를 실행해 플랫폼별 파일을 다시 생성합니다. 토큰 형식이 잘못되었거나 색상 조합의 명암비가 기준보다 낮아지면 빌드가 중단됩니다.
3. 수정한 토큰 JSON 파일과 생성된 결과물을 함께 커밋합니다.

## 폴더 구조

```text
design/tokens/          원천
tools/design-build/     토큰을 플랫폼 파일로 변환하고 대비를 검사
packages/tokens/        생성된 CSS와 TypeScript
packages/ui/            웹 컴포넌트
packages/ui-native/     React Native 컴포넌트
crates/acme-tokens/     생성된 Rust
crates/acme-ui/         GPUI 컴포넌트
apps/web/               React 앱
apps/desktop/           GPUI 앱
apps/mobile/            Expo 앱
```

## 라이선스

[MIT](LICENSE)
