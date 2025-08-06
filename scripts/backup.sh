#!/bin/bash

# MarketGrow 백업 스크립트

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# 설정
BACKUP_TYPE=${1:-full}  # full, db, files
BACKUP_BASE_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$TIMESTAMP"
RETENTION_DAYS=${RETENTION_DAYS:-7}  # 백업 보관 기간

log "🗂️  MarketGrow 백업 시작 - 타입: $BACKUP_TYPE"

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# 백업 정보 파일 생성
cat > "$BACKUP_DIR/backup_info.txt" <<EOF
Backup Information
==================
Date: $(date)
Type: $BACKUP_TYPE
Hostname: $(hostname)
User: $(whoami)
Docker Compose Status:
$(docker-compose ps)
EOF

# 전체 백업 또는 데이터베이스 백업
if [ "$BACKUP_TYPE" == "full" ] || [ "$BACKUP_TYPE" == "db" ]; then
    log "💾 데이터베이스 백업 중..."
    
    # MongoDB 백업
    if docker-compose ps mongo | grep -q "Up"; then
        log "📄 MongoDB 백업 진행 중..."
        
        # 컨테이너 내부에서 mongodump 실행
        docker-compose exec -T mongo mongodump \
            --archive --gzip \
            --db marketgrow > "$BACKUP_DIR/mongodb_backup.gz"
        
        # 백업 크기 확인
        MONGO_SIZE=$(du -h "$BACKUP_DIR/mongodb_backup.gz" | cut -f1)
        log "✅ MongoDB 백업 완료 - 크기: $MONGO_SIZE"
        
        # 백업 검증
        if [ -s "$BACKUP_DIR/mongodb_backup.gz" ]; then
            log "✅ MongoDB 백업 파일 검증 성공"
        else
            error "❌ MongoDB 백업 파일이 비어있습니다!"
        fi
    else
        warn "⚠️  MongoDB 컨테이너가 실행 중이 아닙니다."
    fi
    
    # Redis 백업
    if docker-compose ps redis | grep -q "Up"; then
        log "📄 Redis 백업 진행 중..."
        
        # Redis RDB 파일 복사
        docker-compose exec -T redis redis-cli BGSAVE
        sleep 2  # 백그라운드 저장 완료 대기
        
        docker cp $(docker-compose ps -q redis):/data/dump.rdb "$BACKUP_DIR/redis_backup.rdb"
        
        if [ -s "$BACKUP_DIR/redis_backup.rdb" ]; then
            REDIS_SIZE=$(du -h "$BACKUP_DIR/redis_backup.rdb" | cut -f1)
            log "✅ Redis 백업 완료 - 크기: $REDIS_SIZE"
        else
            warn "⚠️  Redis 백업 파일이 생성되지 않았습니다."
        fi
    else
        warn "⚠️  Redis 컨테이너가 실행 중이 아닙니다."
    fi
fi

# 전체 백업 또는 파일 백업
if [ "$BACKUP_TYPE" == "full" ] || [ "$BACKUP_TYPE" == "files" ]; then
    log "📁 파일 백업 중..."
    
    # 업로드 파일 백업
    if [ -d "uploads" ]; then
        log "📤 업로드 파일 백업 중..."
        tar -czf "$BACKUP_DIR/uploads_backup.tar.gz" uploads/
        
        UPLOADS_SIZE=$(du -h "$BACKUP_DIR/uploads_backup.tar.gz" | cut -f1)
        log "✅ 업로드 파일 백업 완료 - 크기: $UPLOADS_SIZE"
    else
        warn "⚠️  uploads 디렉토리가 없습니다."
    fi
    
    # 로그 파일 백업
    if [ -d "logs" ]; then
        log "📋 로그 파일 백업 중..."
        tar -czf "$BACKUP_DIR/logs_backup.tar.gz" logs/
        
        LOGS_SIZE=$(du -h "$BACKUP_DIR/logs_backup.tar.gz" | cut -f1)
        log "✅ 로그 파일 백업 완료 - 크기: $LOGS_SIZE"
    else
        warn "⚠️  logs 디렉토리가 없습니다."
    fi
    
    # 설정 파일 백업
    log "⚙️  설정 파일 백업 중..."
    tar -czf "$BACKUP_DIR/config_backup.tar.gz" \
        --exclude='.env' \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='dist' \
        --exclude='backups' \
        .
    
    CONFIG_SIZE=$(du -h "$BACKUP_DIR/config_backup.tar.gz" | cut -f1)
    log "✅ 설정 파일 백업 완료 - 크기: $CONFIG_SIZE"
fi

# SSL 인증서 백업 (있는 경우)
if [ -d "nginx/ssl" ] && [ "$(ls -A nginx/ssl)" ]; then
    log "🔐 SSL 인증서 백업 중..."
    tar -czf "$BACKUP_DIR/ssl_backup.tar.gz" nginx/ssl/
    
    SSL_SIZE=$(du -h "$BACKUP_DIR/ssl_backup.tar.gz" | cut -f1)
    log "✅ SSL 인증서 백업 완료 - 크기: $SSL_SIZE"
fi

# 백업 압축
log "🗜️  백업 파일 압축 중..."
cd "$BACKUP_BASE_DIR"
tar -czf "${TIMESTAMP}_marketgrow_backup.tar.gz" "$TIMESTAMP/"

# 압축된 백업 크기 확인
FINAL_SIZE=$(du -h "${TIMESTAMP}_marketgrow_backup.tar.gz" | cut -f1)
log "✅ 최종 백업 파일 생성 완료 - 크기: $FINAL_SIZE"

# 개별 백업 디렉토리 삭제 (압축 파일만 보관)
rm -rf "$TIMESTAMP/"

cd - > /dev/null

# 백업 보관 정책 적용
log "🧹 오래된 백업 파일 정리 중..."
find "$BACKUP_BASE_DIR" -name "*_marketgrow_backup.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(find "$BACKUP_BASE_DIR" -name "*_marketgrow_backup.tar.gz" -type f | wc -l)
log "📊 보관 중인 백업 파일 수: $REMAINING_BACKUPS"

# 백업 검증
BACKUP_FILE="$BACKUP_BASE_DIR/${TIMESTAMP}_marketgrow_backup.tar.gz"
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    log "✅ 백업 검증 성공"
    
    # 백업 파일 정보
    info "📋 백업 완료 정보:"
    info "   파일: $BACKUP_FILE"
    info "   크기: $FINAL_SIZE"
    info "   타입: $BACKUP_TYPE"
    info "   생성일: $(date)"
else
    error "❌ 백업 파일 생성에 실패했습니다!"
fi

# 복원 방법 안내
log "🔄 백업 복원 방법:"
log "   1. 백업 파일 압축 해제: tar -xzf $BACKUP_FILE"
log "   2. 복원 스크립트 실행: ./scripts/restore.sh $TIMESTAMP"

# 자동 백업 설정 안내
if ! crontab -l 2>/dev/null | grep -q "backup.sh"; then
    log "⏰ 자동 백업 설정 (선택사항):"
    log "   매일자 자동 백업: (crontab -l; echo '0 2 * * * $(pwd)/scripts/backup.sh full') | crontab -"
    log "   주간 DB 백업: (crontab -l; echo '0 1 * * 0 $(pwd)/scripts/backup.sh db') | crontab -"
fi

# S3/클라우드 업로드 안내 (선택사항)
if command -v aws &> /dev/null; then
    log "☁️  클라우드 백업 (선택사항):"
    log "   AWS S3 업로드: aws s3 cp $BACKUP_FILE s3://your-bucket/backups/"
fi

log "🎉 백업이 성공적으로 완료되었습니다!"