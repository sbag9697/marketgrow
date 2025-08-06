#!/bin/bash

# SSL 인증서 설정 스크립트

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

# 도메인 설정
DOMAIN=${1:-marketgrow.co}
EMAIL=${2:-admin@marketgrow.co}
SSL_DIR="./nginx/ssl"

log "🔐 SSL 인증서 설정 시작 - 도메인: $DOMAIN"

# SSL 디렉토리 생성
mkdir -p "$SSL_DIR"

# Let's Encrypt 설치 확인
if ! command -v certbot &> /dev/null; then
    log "📦 Certbot 설치 중..."
    
    # Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    # CentOS/RHEL
    elif command -v yum &> /dev/null; then
        sudo yum install -y epel-release
        sudo yum install -y certbot python3-certbot-nginx
    # macOS
    elif command -v brew &> /dev/null; then
        brew install certbot
    else
        error "지원되지 않는 운영체제입니다. Certbot을 수동으로 설치해주세요."
    fi
fi

# 웹서버 중지 (포트 80 사용을 위해)
log "🛑 기존 웹서버 중지 중..."
docker-compose stop nginx || true

# 인증서 발급 방법 선택
echo "SSL 인증서 발급 방법을 선택하세요:"
echo "1) Let's Encrypt (무료, 자동 갱신)"
echo "2) 자체 서명 인증서 (개발/테스트용)"
echo "3) 기존 인증서 사용"
read -p "선택 (1-3): " SSL_METHOD

case $SSL_METHOD in
    1)
        log "🔐 Let's Encrypt 인증서 발급 중..."
        
        # Standalone 모드로 인증서 발급
        sudo certbot certonly \
            --standalone \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN" \
            -d "www.$DOMAIN"
        
        # 인증서 파일 복사
        sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/$DOMAIN.crt"
        sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/$DOMAIN.key"
        sudo chown $(whoami):$(whoami) "$SSL_DIR"/*
        
        log "✅ Let's Encrypt 인증서 발급 완료"
        
        # 자동 갱신 설정
        log "🔄 자동 갱신 설정 중..."
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose restart nginx") | crontab -
        ;;
        
    2)
        log "🔐 자체 서명 인증서 생성 중..."
        
        # 개인키 생성
        openssl genrsa -out "$SSL_DIR/$DOMAIN.key" 2048
        
        # CSR 생성을 위한 설정 파일
        cat > "$SSL_DIR/csr.conf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=KR
ST=Seoul
L=Seoul
O=MarketGrow
OU=IT Department
CN=$DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = www.$DOMAIN
DNS.3 = localhost
EOF
        
        # CSR 생성
        openssl req -new -key "$SSL_DIR/$DOMAIN.key" -out "$SSL_DIR/$DOMAIN.csr" -config "$SSL_DIR/csr.conf"
        
        # 자체 서명 인증서 생성
        openssl x509 -req -in "$SSL_DIR/$DOMAIN.csr" -signkey "$SSL_DIR/$DOMAIN.key" -out "$SSL_DIR/$DOMAIN.crt" -days 365 -extensions v3_req -extfile "$SSL_DIR/csr.conf"
        
        # 임시 파일 정리
        rm "$SSL_DIR/csr.conf" "$SSL_DIR/$DOMAIN.csr"
        
        warn "⚠️  자체 서명 인증서는 브라우저에서 보안 경고가 표시됩니다."
        log "✅ 자체 서명 인증서 생성 완료"
        ;;
        
    3)
        log "📁 기존 인증서 사용"
        echo "다음 파일들을 $SSL_DIR 디렉토리에 배치해주세요:"
        echo "  - $DOMAIN.crt (인증서 파일)"
        echo "  - $DOMAIN.key (개인키 파일)"
        read -p "파일 배치가 완료되었으면 Enter를 눌러주세요..."
        
        if [ ! -f "$SSL_DIR/$DOMAIN.crt" ] || [ ! -f "$SSL_DIR/$DOMAIN.key" ]; then
            error "인증서 파일이 없습니다!"
        fi
        
        log "✅ 기존 인증서 사용 설정 완료"
        ;;
        
    *)
        error "잘못된 선택입니다."
        ;;
esac

# DH 파라미터 생성 (없는 경우)
if [ ! -f "$SSL_DIR/dhparam.pem" ]; then
    log "🔐 DH 파라미터 생성 중... (시간이 오래 걸릴 수 있습니다)"
    openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048
fi

# 인증서 권한 설정
chmod 600 "$SSL_DIR"/*.key
chmod 644 "$SSL_DIR"/*.crt "$SSL_DIR"/*.pem

# Nginx 설정에서 HTTPS 활성화
log "🔧 Nginx HTTPS 설정 활성화 중..."
NGINX_CONF="./nginx/conf.d/marketgrow.conf"

if [ -f "$NGINX_CONF" ]; then
    # HTTPS 서버 블록의 주석 제거
    sed -i 's/^# \(server {\)/\1/' "$NGINX_CONF"
    sed -i 's/^#     \(.*\)/    \1/' "$NGINX_CONF"
    sed -i 's/^# \(}\)/\1/' "$NGINX_CONF"
    
    # HTTP에서 HTTPS 리다이렉트 활성화
    sed -i 's/^    # return 301/    return 301/' "$NGINX_CONF"
    
    log "✅ Nginx HTTPS 설정 활성화 완료"
else
    warn "Nginx 설정 파일을 찾을 수 없습니다: $NGINX_CONF"
fi

# 서비스 재시작
log "🔄 서비스 재시작 중..."
docker-compose up -d nginx

# SSL 테스트
log "🧪 SSL 설정 테스트 중..."
sleep 5

if command -v curl &> /dev/null; then
    if curl -k -s https://localhost/health > /dev/null; then
        log "✅ HTTPS 연결 테스트 성공!"
    else
        warn "⚠️  HTTPS 연결 테스트 실패. 설정을 확인해주세요."
    fi
fi

# SSL 점수 확인 안내
log "📊 SSL 설정 점검 도구:"
log "   - SSL Labs: https://www.ssllabs.com/ssltest/"
log "   - testssl.sh: https://testssl.sh/"

# 갱신 명령어 안내
if [ "$SSL_METHOD" == "1" ]; then
    log "🔄 인증서 수동 갱신 명령어:"
    log "   sudo certbot renew && docker-compose restart nginx"
fi

log "🎉 SSL 인증서 설정이 완료되었습니다!"
log "🌐 HTTPS 접속: https://$DOMAIN"