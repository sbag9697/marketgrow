# 🚀 MarketGrow 서버 호스팅 옵션

## 현재 상황
- **프론트엔드**: Netlify에 배포됨 (marketgrow.kr)
- **백엔드**: 로컬에서만 실행 중 (PM2)
- **문제**: 외부에서 백엔드 API 접속 불가

## 📊 호스팅 옵션 비교

### 1. Railway (기존 시도)
- **장점**: 
  - 쉬운 배포 (GitHub 연동)
  - 자동 HTTPS
  - 환경변수 관리 편리
- **단점**: 
  - 무료 플랜 제한 (월 $5 크레딧, 500시간)
  - 현재 배포 실패 상태
- **비용**: 월 $5부터

### 2. Render (추천) ⭐
- **장점**:
  - 무료 플랜 제공 (750시간/월)
  - 자동 배포 (GitHub 연동)
  - 무료 MongoDB 호스팅 가능
  - SSL 인증서 자동
- **단점**:
  - 무료 플랜은 15분 비활성 시 슬립
  - 콜드 스타트 시간 (30초)
- **비용**: 무료 ~ 월 $7

### 3. Vercel
- **장점**:
  - 완전 무료
  - 빠른 배포
  - Serverless Functions 지원
- **단점**:
  - Express.js 직접 호스팅 불가
  - API Routes로 변환 필요
- **비용**: 무료

### 4. Fly.io
- **장점**:
  - 무료 플랜 제공
  - Docker 기반 배포
  - 전 세계 리전 선택 가능
- **단점**:
  - 신용카드 등록 필요
  - 설정이 복잡함
- **비용**: 무료 ~ 월 $1.94

### 5. Koyeb
- **장점**:
  - 무료 플랜 (1개 앱)
  - GitHub 자동 배포
  - 간단한 설정
- **단점**:
  - 무료 플랜 제한적
  - 한국 리전 없음
- **비용**: 무료 ~ 월 $7.60

### 6. Glitch
- **장점**:
  - 완전 무료
  - 온라인 에디터
  - 즉시 배포
- **단점**:
  - 5분 비활성 시 슬립
  - 성능 제한
- **비용**: 무료

## 🎯 추천 방안

### 옵션 1: Render 무료 플랜 사용 (추천)
```bash
# 1. Render 계정 생성
https://render.com

# 2. New → Web Service → GitHub 연결

# 3. 설정
- Build Command: npm install
- Start Command: node server.js
- Environment: Node
- Region: Singapore (한국과 가까움)

# 4. 환경변수 설정
- MONGODB_URI
- JWT_SECRET
- NODE_ENV=production
```

### 옵션 2: Netlify Functions로 전환
```javascript
// netlify/functions/api.js
const serverless = require('serverless-http');
const app = require('../../backend/server');

exports.handler = serverless(app);
```

### 옵션 3: 로컬 서버 + ngrok (임시)
```bash
# ngrok 설치
npm install -g ngrok

# 로컬 서버 실행
pm2 start ecosystem.config.js

# ngrok으로 터널링
ngrok http 5001

# 생성된 URL을 프론트엔드에 설정
# https://xxxx.ngrok.io
```

## 📝 빠른 시작 가이드 (Render)

### 1. backend 폴더 준비
```bash
# package.json 확인
{
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 2. render.yaml 생성
```yaml
services:
  - type: web
    name: marketgrow-backend
    env: node
    region: singapore
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        value: mongodb+srv://...
      - key: JWT_SECRET
        generateValue: true
```

### 3. 배포
1. https://render.com 접속
2. GitHub 연결
3. 자동 배포 시작

### 4. Netlify 설정 수정
```toml
# netlify.toml
[[redirects]]
  from = "/api/*"
  to = "https://marketgrow-backend.onrender.com/api/:splat"
  status = 200
```

## 💡 MongoDB 호스팅

### MongoDB Atlas (현재 사용 중)
- 무료 512MB
- 클러스터 생성됨
- 연결 문자열 있음

### 대안
- **Render PostgreSQL**: 무료 90일
- **Supabase**: PostgreSQL 무료 500MB
- **PlanetScale**: MySQL 무료 5GB

## 🔧 즉시 적용 가능한 솔루션

### 1. Render에 즉시 배포
```bash
# 1. GitHub에 푸시
git add .
git commit -m "Deploy to Render"
git push origin main

# 2. Render Dashboard에서
# - New Web Service
# - Connect GitHub repo
# - 자동 배포 시작
```

### 2. 환경변수 설정
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://marketgrow:JXcmH4vNz26QKjEo@cluster0.c586sbu.mongodb.net/marketgrow
JWT_SECRET=marketgrow2024secretkey!@#$
```

### 3. 프론트엔드 API URL 수정
```javascript
// config.js
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://marketgrow-backend.onrender.com/api'
  : 'http://localhost:5001/api';
```

## 📞 지원

문제 발생 시:
1. 서버 로그 확인
2. MongoDB 연결 상태 확인
3. 환경변수 설정 확인
4. CORS 설정 확인