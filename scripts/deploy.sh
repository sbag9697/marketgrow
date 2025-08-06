#!/bin/bash

# MarketGrow 배포 스크립트

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# 환경 변수 설정
ENVIRONMENT=${1:-production}
PROJECT_NAME="marketgrow-sns-marketing"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

log "🚀 MarketGrow 배포 시작 - 환경: $ENVIRONMENT"

# 사전 체크
log "📋 사전 체크 진행 중..."

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    error "Docker가 설치되어 있지 않습니다."
fi

# Docker Compose 설치 확인
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose가 설치되어 있지 않습니다."
fi

# .env 파일 확인
if [ ! -f .env ]; then
    warn ".env 파일이 없습니다. .env.example을 복사해서 설정해주세요."
    if [ ! -f .env.example ]; then
        error ".env.example 파일도 없습니다!"
    fi
    log "📁 .env.example을 .env로 복사 중..."
    cp .env.example .env
    warn "⚠️  .env 파일의 설정값들을 실제 값으로 변경해주세요!"
    exit 1
fi

# 백업 생성 (기존 서비스가 있는 경우)
if docker-compose ps | grep -q "Up"; then
    log "💾 기존 데이터 백업 중..."
    mkdir -p "$BACKUP_DIR"
    
    # MongoDB 백업
    if docker-compose ps mongo | grep -q "Up"; then
        log "📄 MongoDB 백업 중..."
        docker-compose exec -T mongo mongodump --archive --gzip > "$BACKUP_DIR/mongodb_backup.gz"
    fi
    
    # 업로드 파일 백업
    if [ -d "uploads" ]; then
        log "📁 업로드 파일 백업 중..."
        cp -r uploads "$BACKUP_DIR/"
    fi
    
    # 로그 파일 백업
    if [ -d "logs" ]; then
        log "📋 로그 파일 백업 중..."
        cp -r logs "$BACKUP_DIR/"
    fi
    
    log "✅ 백업 완료: $BACKUP_DIR"
fi

# 기존 컨테이너 중지 및 제거
log "🛑 기존 서비스 중지 중..."
docker-compose down --remove-orphans

# 이미지 빌드
log "🔨 Docker 이미지 빌드 중..."
if [ "$ENVIRONMENT" == "development" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
else
    docker-compose build --no-cache
fi

# 필요한 디렉토리 생성
log "📁 필요한 디렉토리 생성 중..."
mkdir -p logs uploads nginx/ssl

# SSL 인증서 확인 (프로덕션 환경)
if [ "$ENVIRONMENT" == "production" ]; then
    if [ ! -f "nginx/ssl/dhparam.pem" ]; then
        log "🔐 DH 파라미터 생성 중... (시간이 오래 걸릴 수 있습니다)"
        openssl dhparam -out nginx/ssl/dhparam.pem 2048
    fi
fi

# 서비스 시작
log "🚀 서비스 시작 중..."
if [ "$ENVIRONMENT" == "development" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
else
    docker-compose up -d
fi

# 서비스 상태 확인
log "🔍 서비스 상태 확인 중..."
sleep 10

# 헬스체크
log "🏥 헬스체크 진행 중..."
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s http://localhost:3001/health > /dev/null; then
        log "✅ 애플리케이션이 정상적으로 시작되었습니다!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log "⏳ 헬스체크 재시도 ($RETRY_COUNT/$MAX_RETRIES)..."
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    error "❌ 애플리케이션 시작에 실패했습니다. 로그를 확인해주세요."
fi

# 최종 상태 확인
log "📊 배포 상태 확인..."
docker-compose ps

# 로그 확인 안내
log "📋 실시간 로그 확인: docker-compose logs -f"
log "🔧 서비스 중지: docker-compose down"
log "🔄 서비스 재시작: docker-compose restart"

# 접속 정보 안내
log "🌐 서비스 접속 정보:"
if [ "$ENVIRONMENT" == "development" ]; then
    log "   - 프론트엔드: http://localhost:3000"
    log "   - API 서버: http://localhost:3001"
    log "   - MongoDB 관리: http://localhost:8081 (admin/admin)"
    log "   - Redis 관리: http://localhost:8082"
else
    log "   - 메인 사이트: http://localhost"
    log "   - API 서버: http://localhost:3001"
fi

log "✅ 배포가 성공적으로 완료되었습니다!"

# 정리 작업
log "🧹 정리 작업 중..."
docker system prune -f

log "🎉 MarketGrow 배포 완료!"