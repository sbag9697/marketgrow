FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production

# 앱 소스 복사
COPY . .

# 포트 노출
EXPOSE 5001

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# 앱 실행
CMD ["node", "server.js"]