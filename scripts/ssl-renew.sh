#!/bin/bash

# SSL 인증서 자동 갱신 스크립트

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# 설정
DOMAIN=${1:-marketgrow.co}
SSL_DIR="./nginx/ssl"
LOG_FILE="./logs/ssl-renewal.log"

# 로그 디렉토리 생성
mkdir -p "./logs"

log "🔄 SSL 인증서 갱신 시작 - 도메인: $DOMAIN"

# 현재 인증서 만료일 확인
if [ -f "$SSL_DIR/$DOMAIN.crt" ]; then
    EXPIRY_DATE=$(openssl x509 -in "$SSL_DIR/$DOMAIN.crt" -noout -dates | grep notAfter | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
    
    log "📅 현재 인증서 만료일: $EXPIRY_DATE ($DAYS_UNTIL_EXPIRY일 남음)"
    
    # 30일 이상 남은 경우 갱신하지 않음
    if [ $DAYS_UNTIL_EXPIRY -gt 30 ]; then
        log "✅ 인증서가 아직 유효합니다. 갱신을 건너뜁니다."
        exit 0
    fi
else
    warn "⚠️  기존 인증서를 찾을 수 없습니다."
fi

# Let's Encrypt 인증서 갱신
if command -v certbot &> /dev/null; then
    log "🔐 Let's Encrypt 인증서 갱신 중..."
    
    # 백업 생성
    if [ -f "$SSL_DIR/$DOMAIN.crt" ]; then
        cp "$SSL_DIR/$DOMAIN.crt" "$SSL_DIR/$DOMAIN.crt.backup"
        cp "$SSL_DIR/$DOMAIN.key" "$SSL_DIR/$DOMAIN.key.backup"
        log "💾 기존 인증서 백업 완료"
    fi
    
    # Nginx 중지
    docker-compose stop nginx
    
    # 인증서 갱신
    if sudo certbot renew --standalone --quiet --deploy-hook "
        cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/$DOMAIN.crt &&
        cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/$DOMAIN.key &&
        chown $(whoami):$(whoami) $SSL_DIR/* &&
        docker-compose start nginx
    "; then
        log "✅ 인증서 갱신 성공"
        
        # 새 인증서 만료일 확인
        NEW_EXPIRY_DATE=$(openssl x509 -in "$SSL_DIR/$DOMAIN.crt" -noout -dates | grep notAfter | cut -d= -f2)
        log "📅 새 인증서 만료일: $NEW_EXPIRY_DATE"
        
        # 백업 파일 정리
        rm -f "$SSL_DIR/$DOMAIN.crt.backup" "$SSL_DIR/$DOMAIN.key.backup"
        
    else
        error "❌ 인증서 갱신 실패"
        
        # 백업에서 복원
        if [ -f "$SSL_DIR/$DOMAIN.crt.backup" ]; then
            mv "$SSL_DIR/$DOMAIN.crt.backup" "$SSL_DIR/$DOMAIN.crt"
            mv "$SSL_DIR/$DOMAIN.key.backup" "$SSL_DIR/$DOMAIN.key"
            log "🔄 백업에서 인증서 복원 완료"
        fi
        
        docker-compose start nginx
    fi
else
    error "❌ Certbot이 설치되어 있지 않습니다."
fi

# 인증서 검증
log "🧪 갱신된 인증서 검증 중..."
sleep 5

if curl -k -s https://localhost/health > /dev/null; then
    log "✅ HTTPS 연결 테스트 성공"
else
    warn "⚠️  HTTPS 연결 테스트 실패"
fi

# 갱신 로그 기록
echo "$(date): SSL certificate renewed for $DOMAIN" >> "$LOG_FILE"

log "🎉 SSL 인증서 갱신이 완료되었습니다!"