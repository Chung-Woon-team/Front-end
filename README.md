# AutoYard Copilot — Frontend

MOVE-AI CHALLENGE 2026 · 현대글로비스(Hyundai Glovis) 과제

야드관리자가 자연어로 내린 지시("B02 블록 도색작업으로 폐쇄해줘")를 AI가 파싱해 구조화된 제약 조건으로 만들고, 승인 후 차량 재배치 계획을 야드 그리드·KPI·브리핑으로 보여주는 웹 대시보드의 프론트엔드입니다.

## 관련 문서

| 문서 | 내용 |
|---|---|
| [docs/FRONTEND_CONTRACT.md](docs/FRONTEND_CONTRACT.md) | 서버 → 프론트 payload 전부 |
| [docs/API_CONTRACT.md](docs/API_CONTRACT.md) | Spring ↔ Python 연동 (참고용) |
| [docs/DOMAIN.md](docs/DOMAIN.md) | 슬롯·블록·depth·재취급 같은 용어 |
| [docs/HANDOFF_FRONTEND.md](docs/HANDOFF_FRONTEND.md) | 인수인계 문서 |
| [docs/HANDOFF_AI.md](docs/HANDOFF_AI.md) | AI(Python) 쪽 인수인계 문서 |

## 아키텍처

```
React ──REST──▶ Spring (:8080) ──내부 호출──▶ Python (AI)
                     │
                     ▼
                    DB
```

프론트는 Spring 서버 하나만 호출합니다. AI(Python) 파싱은 Spring이 내부적으로 처리하므로 프론트에서 신경 쓸 필요가 없습니다. API 스펙은 백엔드 팀 Notion 문서 기준이며, 백엔드 컨트롤러가 배포되기 전까지는 동일한 응답 형태를 그대로 mock 데이터로 사용합니다.

**스프링이 유일한 공개 API 창구다.** 파이썬은 직접 부르지 않는다.
API 목록은 백엔드를 띄우고 http://localhost:8080/swagger-ui/index.html 에서 볼 수 있다.

- 응답은 전부 `{"success": true, "data": ...}` 또는 `{"success": false, "error": {...}}` 로 감싸져 온다.
- JSON 필드명은 `snake_case`.

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

## 배포 (Google Cloud Run)

루트의 `Dockerfile` 이 multi-stage 로 빌드한다 — Node 22 에서 `npm ci && npm run build`,
결과물 `dist/` 만 nginx(alpine) 로 서빙. `nginx.conf` 가 **8080 포트**에서 듣고,
`try_files $uri $uri/ /index.html` 로 SPA 새로고침 404 를 막는다.

### ⚠️ API 주소는 이미지 빌드 시점에 번들에 박힌다

`src/api/client.ts` 의 `API_BASE_URL` 이 `import.meta.env.VITE_API_BASE_URL` 을 읽는데,
Vite 는 이 값을 **`npm run build` 때 번들 안에 문자열로 치환해 넣는다.** 최종 이미지는
nginx 가 정적 `dist/` 만 서빙하므로 컨테이너 환경변수를 읽을 JS 런타임이 아예 없다.
→ **Cloud Run 콘솔의 "변수 및 보안 비밀" 에 넣어봐야 효과가 0이다.**

배포 이미지의 값은 `Dockerfile` 의 **`ARG VITE_API_BASE_URL` 기본값**에서 온다.
현재 기본값은 `https://back-end-git-145786632792.asia-northeast3.run.app` 이다.
`.env` 는 이 저장소에 없다 — `.gitignore` 가 `.env` / `.env.*` 를 막고 있어서 커밋이 안 되고,
`.dockerignore` 도 같이 막고 있어 이미지 빌드에서도 안 보인다. 로컬 dev 용으로만
`.env.example` 을 `.env.local` 로 복사해 쓰면 된다.

백엔드 주소가 바뀌면 `Dockerfile` 의 ARG 기본값을 고쳐서 push 하면 된다. 자동배포 트리거가
새 이미지를 만든다. 일회성으로 다른 백엔드를 물릴 때만 `--build-arg` 로 덮어쓴다:

```bash
docker build --build-arg VITE_API_BASE_URL=https://<다른 API URL> \
  -t asia-northeast3-docker.pkg.dev/<PROJECT>/chungwoon/front:latest .
docker push asia-northeast3-docker.pkg.dev/<PROJECT>/chungwoon/front:latest
gcloud run deploy autoyard-copilot-front \
  --image asia-northeast3-docker.pkg.dev/<PROJECT>/chungwoon/front:latest \
  --region asia-northeast3 --allow-unauthenticated
```

> `--source .` 나 Cloud Run 의 GitHub 자동배포는 `--build-arg` 를 넘길 수단이 없다.
> ARG 기본값이 없으면 API 주소가 `http://localhost:8080` 으로 박힌 채 올라가고,
> 배포된 화면에서 API 호출이 전부 실패한다. (2026-08-13 실제로 이 사고가 났다.)

로컬에서 이미지 그대로 확인하려면:

```bash
docker build -t chungwoon-front . && docker run --rm -p 8080:8080 chungwoon-front
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
├── context/         # 전역 React context (언어 설정 등)
├── hooks/           # 커스텀 훅
├── i18n/            # 다국어 텍스트
├── lib/             # 유틸 함수
├── pages/           # 라우트 단위 화면 (LoginPage, InstructionsPage)
├── store/           # 전역 상태 관리
├── types/           # 공통 타입 정의 (API 응답, 도메인 모델)
└── styles/          # 전역 스타일
```

## 야드 격자

화면에 그릴 야드는 **22 × 46** (행 × 열) 이다. 도면: 행 4 + 5 + 4 + 5 + 4, 열 4 + 17 + 4 + 17 + 4.

```
열 →   0    4              21   25              42   46
행 0  ┌────────────────────────────────────────────┐
      │            외곽 도로 (폭 4)                 │
   4  ├────┬──────────────┬────┬──────────────┬────┤
      │도로│  B01 5×17    │통로│  B02 5×17    │도로│
   9  ├────┼──────────────┼────┼──────────────┼────┤
      │            십자 통로 (폭 4)                 │
  13  ├────┼──────────────┼────┼──────────────┼────┤
      │도로│  B03 5×17    │통로│  B04 5×17    │도로│
  18  ├────┴──────────────┴────┴──────────────┴────┤
      │            외곽 도로 (폭 4)                 │
  22  └────────────────────────────────────────────┘
```

- 주차칸 340 (블록 4개 × 5×17) / 도로칸 672
- 슬롯 ID 가 좌표를 품는다: `B01-R04-C07` = 블록 B01, 행 4, 열 7. 파싱해서 그대로 격자에 찍으면 된다.
- 블록 원점은 `GET /api/yard/state` 의 `blocks[].origin_row / origin_col` 로도 내려온다.

## 디자인 시스템

`src/index.css`의 Tailwind `@theme`에 `primary` / `secondary` / `tertiary` / `neutral` 4개 색상 팔레트(각 50~950 스케일)와 `Inter` 폰트를 정의해두었습니다. 같은 색상을 차트 등 클래스 기반 스타일링이 어려운 곳에서 쓸 수 있도록 `src/constants/colors.ts`에 JS 상수로도 노출합니다.

## API 연동 상태

백엔드 API는 아직 미구현 상태(`GET /api/ping`만 응답)이며, 응답 payload 모양은 확정되어 있어 `src/api/instructions.ts`에 동일한 형태로 mock 처리해두었습니다. 실제 엔드포인트가 배포되면 각 함수 내부의 로직만 실제 `fetch` 호출로 교체하면 됩니다. 서버 베이스 URL은 `src/api/client.ts`에서 관리합니다.

## 작업 방식

브랜치를 파서 PR 로 올리고, 다른 사람이 리뷰·머지한다. `main` 에 직접 푸시하지 않는다.

```bash
git switch -c feat/yard-map
# 작업
git push -u origin feat/yard-map
```
