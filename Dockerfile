# Cloud Run 용 이미지. 빌드는 Node 에서, 서빙은 nginx 에서 한다.
# 최종 이미지에는 dist 결과물만 들어간다 (node_modules 안 들어감).

### 1단계 — 빌더
FROM node:22-alpine AS builder

WORKDIR /app

# 락파일까지 먼저 복사한다. 소스만 바뀌었을 때 이 레이어를 캐시에서 재사용하려는 것.
COPY package.json package-lock.json ./

# npm ci 는 package-lock.json 그대로 설치한다. 배포마다 같은 버전이 나온다.
RUN npm ci

COPY . .

# Vite 환경변수는 빌드 시점에 번들에 박힌다. 런타임(Cloud Run 환경변수)으로는 못 바꾼다.
# 그래서 API 주소는 여기서 넣어야 한다:
#   docker build --build-arg VITE_API_BASE_URL=https://<API URL> .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# tsc -b && vite build. 타입 에러가 있으면 여기서 배포가 멈춘다.
RUN npm run build

### 2단계 — 러너
FROM nginx:1.27-alpine AS runner

# 기본 설정을 통째로 갈아끼운다. 기본값은 80 포트라 Cloud Run 과 맞지 않는다.
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run 이 컨테이너로 트래픽을 넣는 포트.
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
