# 멀티 스테이지 빌드 사용
# Stage 1: Build stage
FROM node:18-alpine AS build

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./
COPY server/package*.json ./server/

# 의존성 설치
RUN npm ci --only=production --no-audit --no-fund
RUN cd server && npm ci --only=production --no-audit --no-fund

# 소스 코드 복사
COPY . .

# 프론트엔드 빌드
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

# 보안을 위한 비-루트 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S marketgrow -u 1001

# 필요한 시스템 패키지 설치
RUN apk add --no-cache \
    dumb-init \
    tini

# 작업 디렉토리 설정
WORKDIR /app

# 빌드된 파일들 복사
COPY --from=build --chown=marketgrow:nodejs /app/dist ./dist
COPY --from=build --chown=marketgrow:nodejs /app/server ./server
COPY --from=build --chown=marketgrow:nodejs /app/server/node_modules ./server/node_modules

# 필요한 디렉토리 생성
RUN mkdir -p logs uploads && \
    chown -R marketgrow:nodejs logs uploads

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3001

# 포트 노출
EXPOSE 3001

# 비-루트 사용자로 전환
USER marketgrow

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 애플리케이션 시작
ENTRYPOINT ["tini", "--"]
CMD ["node", "server/server.js"]