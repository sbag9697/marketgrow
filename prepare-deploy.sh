#!/bin/bash

echo "🚀 MarketGrow 배포 준비 시작..."

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. 환경 변수 확인
echo -e "${YELLOW}1. 환경 변수 파일 확인${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production 파일이 없습니다!${NC}"
    echo "📝 .env.production.example을 참고하여 생성해주세요."
    exit 1
else
    echo -e "${GREEN}✅ .env.production 파일 확인됨${NC}"
fi

# 2. 프론트엔드 빌드
echo -e "\n${YELLOW}2. 프론트엔드 빌드${NC}"
node build.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 프론트엔드 빌드 완료${NC}"
else
    echo -e "${RED}❌ 프론트엔드 빌드 실패${NC}"
    exit 1
fi

# 3. 백엔드 의존성 확인
echo -e "\n${YELLOW}3. 백엔드 의존성 확인${NC}"
cd backend
npm ci --only=production
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 백엔드 의존성 설치 완료${NC}"
else
    echo -e "${RED}❌ 백엔드 의존성 설치 실패${NC}"
    exit 1
fi
cd ..

# 4. 배포 파일 압축
echo -e "\n${YELLOW}4. 배포 파일 압축${NC}"
# 프론트엔드
tar -czf frontend-dist.tar.gz -C dist .
echo -e "${GREEN}✅ frontend-dist.tar.gz 생성됨${NC}"

# 백엔드
cd backend
tar -czf ../backend-dist.tar.gz --exclude=node_modules --exclude=.env --exclude=logs .
cd ..
echo -e "${GREEN}✅ backend-dist.tar.gz 생성됨${NC}"

# 5. 배포 체크리스트
echo -e "\n${YELLOW}5. 배포 전 체크리스트${NC}"
echo "□ MongoDB Atlas 프로덕션 DB 준비됨?"
echo "□ 토스페이먼츠 프로덕션 키 준비됨?"
echo "□ 도메인 준비됨?"
echo "□ SSL 인증서 준비됨?"
echo "□ 백업 계획 수립됨?"

echo -e "\n${GREEN}🎉 배포 준비 완료!${NC}"
echo -e "${YELLOW}다음 단계:${NC}"
echo "1. frontend-dist.tar.gz를 웹 서버에 업로드"
echo "2. backend-dist.tar.gz를 앱 서버에 업로드"
echo "3. 환경 변수 설정"
echo "4. 서비스 시작"