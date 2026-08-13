# AutoYard Copilot — 프론트엔드

MOVE-AI CHALLENGE 2026 · 현대글로비스 과제의 화면 담당 저장소.

> 아직 껍데기다. 앱 스캐폴딩 전에 계약 문서부터 읽는 것을 권한다.

## 어디를 보면 되나

| 문서 | 내용 |
|---|---|
| [docs/FRONTEND_CONTRACT.md](docs/FRONTEND_CONTRACT.md) | **여기부터.** 서버 → 프론트 payload 전부 |
| [docs/API_CONTRACT.md](docs/API_CONTRACT.md) | Spring ↔ Python 연동 (참고용) |
| [docs/DOMAIN.md](docs/DOMAIN.md) | 슬롯·블록·depth·재취급 같은 용어 |
| [docs/HANDOFF_FRONTEND.md](docs/HANDOFF_FRONTEND.md) | 인수인계 문서 |

## 붙는 곳

```
React (여기) ──REST──▶ Spring (:8080) ──내부 호출──▶ Python FastAPI (:8000)
```

**스프링이 유일한 공개 API 창구다.** 파이썬은 직접 부르지 않는다.
API 목록은 백엔드를 띄우고 http://localhost:8080/swagger-ui/index.html 에서 볼 수 있다.

- 응답은 전부 `{"success": true, "data": ...}` 또는 `{"success": false, "error": {...}}` 로 감싸져 온다.
- JSON 필드명은 `snake_case`.

## 야드 격자

화면에 그릴 야드는 **56 × 56** 이다. 도면: 4 + 22 + 4 + 22 + 4.

```
열 →   0    4              26   30              52   56
행 0  ┌────────────────────────────────────────────┐
      │            외곽 도로 (폭 4)                 │
   4  ├────┬──────────────┬────┬──────────────┬────┤
      │도로│  B01 22×22   │통로│  B02 22×22   │도로│
  26  ├────┼──────────────┼────┼──────────────┼────┤
      │            십자 통로 (폭 4)                 │
  30  ├────┼──────────────┼────┼──────────────┼────┤
      │도로│  B03 22×22   │통로│  B04 22×22   │도로│
  52  ├────┴──────────────┴────┴──────────────┴────┤
      │            외곽 도로 (폭 4)                 │
  56  └────────────────────────────────────────────┘
```

- 주차칸 1,936 (블록 4개 × 22×22) / 도로칸 1,200
- 슬롯 ID 가 좌표를 품는다: `B01-R04-C07` = 블록 B01, 행 4, 열 7. 파싱해서 그대로 격자에 찍으면 된다.
- 블록 원점은 `GET /api/yard/state` 의 `blocks[].origin_row / origin_col` 로도 내려온다.

## 시작하기

아직 앱이 없다. 스캐폴딩할 때 이 폴더 안에서:

```bash
npm create vite@latest . -- --template react-ts
```

`node_modules/`, `dist/`, `.env` 는 `.gitignore` 에 이미 들어 있다.

## 작업 방식

브랜치를 파서 PR 로 올리고, 다른 사람이 리뷰·머지한다. `main` 에 직접 푸시하지 않는다.

```bash
git switch -c feat/yard-map
# 작업
git push -u origin feat/yard-map
```
