# AutoYard Copilot — Frontend

MOVE-AI CHALLENGE 2026 · 현대글로비스(Hyundai Glovis) 과제

야드관리자가 자연어로 내린 지시("B02 블록 도색작업으로 폐쇄해줘")를 AI가 파싱해 구조화된 제약 조건으로 만들고, 승인 후 차량 재배치 계획을 야드 그리드·KPI·브리핑으로 보여주는 웹 대시보드의 프론트엔드입니다.

## 아키텍처

```
React ──REST──▶ Spring (:8080) ──내부 호출──▶ Python (AI)
                     │
                     ▼
                    DB
```

프론트는 Spring 서버 하나만 호출합니다. AI(Python) 파싱은 Spring이 내부적으로 처리하므로 프론트에서 신경 쓸 필요가 없습니다. API 스펙은 백엔드 팀 Notion 문서 기준이며, 백엔드 컨트롤러가 배포되기 전까지는 동일한 응답 형태를 그대로 mock 데이터로 사용합니다.

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | React 19 + TypeScript |
| 빌드 도구 | Vite 8 |
| 스타일링 | Tailwind CSS v4 (`@theme` 기반 디자인 토큰) |
| 라우팅 | React Router 7 |
| 아이콘 | lucide-react |
| 린트 | ESLint (typescript-eslint, react-hooks, react-refresh) |

## 시작하기

```bash
npm install
npm run dev
```

기타 명령어:

```bash
npm run build     # 타입체크 + 프로덕션 빌드
npm run lint       # ESLint 검사
npm run preview    # 빌드 결과 로컬 미리보기
```

## 디렉터리 구조

```
src/
├── api/            # 서버 통신 함수 (현재는 백엔드 컨트롤러 미배포로 mock 구현)
├── assets/         # 이미지 등 정적 리소스
├── components/
│   ├── common/     # 범용 UI 컴포넌트
│   ├── layout/     # 화면 셸 (AuthLayout, DashboardLayout)
│   ├── charts/     # 차트/그래프 컴포넌트
│   └── instructions/ # 지시·제약 검토 화면 전용 컴포넌트
├── constants/       # 색상 토큰 등 상수
├── hooks/           # 커스텀 훅
├── lib/             # 유틸 함수
├── pages/           # 라우트 단위 화면 (LoginPage, InstructionsPage)
├── store/           # 전역 상태 관리
├── types/           # 공통 타입 정의 (API 응답, 도메인 모델)
└── styles/          # 전역 스타일
```

## 디자인 시스템

`src/index.css`의 Tailwind `@theme`에 `primary` / `secondary` / `tertiary` / `neutral` 4개 색상 팔레트(각 50~950 스케일)와 `Inter` 폰트를 정의해두었습니다. 같은 색상을 차트 등 클래스 기반 스타일링이 어려운 곳에서 쓸 수 있도록 `src/constants/colors.ts`에 JS 상수로도 노출합니다.

## API 연동 상태

백엔드 API는 아직 미구현 상태(`GET /api/ping`만 응답)이며, 응답 payload 모양은 확정되어 있어 `src/api/instructions.ts`에 동일한 형태로 mock 처리해두었습니다. 실제 엔드포인트가 배포되면 각 함수 내부의 로직만 실제 `fetch` 호출로 교체하면 됩니다. 서버 베이스 URL은 `src/api/client.ts`에서 관리합니다.
