#!/bin/bash

# 모니터링 시스템 시작 스크립트

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "📊 MarketGrow 모니터링 시스템 시작"

# 환경 변수 확인
if [ ! -f .env ]; then
    warn "⚠️  .env 파일이 없습니다. 모니터링 서비스에 기본값이 사용됩니다."
fi

# 모니터링 디렉토리 생성
log "📁 모니터링 디렉토리 준비 중..."
mkdir -p monitoring/grafana/dashboards monitoring/grafana/datasources

# Grafana 데이터소스 설정
log "📈 Grafana 데이터소스 설정 중..."
cat > monitoring/grafana/datasources/prometheus.yml <<EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

# Grafana 대시보드 설정
log "📊 Grafana 대시보드 설정 중..."
cat > monitoring/grafana/dashboards/dashboard-provider.yml <<EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

# 메인 애플리케이션이 실행 중인지 확인
log "🔍 메인 애플리케이션 상태 확인 중..."
if ! docker-compose ps | grep -q "Up"; then
    warn "⚠️  메인 애플리케이션이 실행 중이 아닙니다. 먼저 애플리케이션을 시작해주세요."
    info "💡 실행 명령어: ./scripts/deploy.sh"
    exit 1
fi

# 모니터링 서비스 시작
log "🚀 모니터링 서비스 시작 중..."
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# 서비스 상태 확인
log "⏳ 서비스 시작 대기 중..."
sleep 30

# Prometheus 헬스체크
log "🔍 Prometheus 상태 확인 중..."
RETRY_COUNT=0
while [ $RETRY_COUNT -lt 10 ]; do
    if curl -f -s http://localhost:9090/-/healthy > /dev/null; then
        log "✅ Prometheus가 정상적으로 시작되었습니다!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    warn "⏳ Prometheus 시작 대기 중... ($RETRY_COUNT/10)"
    sleep 5
done

# Grafana 헬스체크
log "🔍 Grafana 상태 확인 중..."
RETRY_COUNT=0
while [ $RETRY_COUNT -lt 10 ]; do
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        log "✅ Grafana가 정상적으로 시작되었습니다!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    warn "⏳ Grafana 시작 대기 중... ($RETRY_COUNT/10)"
    sleep 5
done

# 서비스 상태 출력
log "📊 모니터링 서비스 상태:"
docker-compose -f monitoring/docker-compose.monitoring.yml ps

# 접속 정보 안내
log "🌐 모니터링 대시보드 접속 정보:"
log "   📊 Grafana: http://localhost:3000 (admin/admin123)"
log "   📈 Prometheus: http://localhost:9090"
log "   🚨 AlertManager: http://localhost:9093"
log "   💻 Node Exporter: http://localhost:9100"
log "   🐳 cAdvisor: http://localhost:8080"

# 기본 Grafana 대시보드 추천
log "📈 추천 Grafana 대시보드 ID:"
log "   - Node Exporter Full: 1860"
log "   - Docker Container & Host Metrics: 179"
log "   - MongoDB Dashboard: 2583"
log "   - Redis Dashboard: 763"
log "   - Nginx Dashboard: 12559"

# 사용법 안내
log "🔧 모니터링 시스템 관리 명령어:"
log "   서비스 중지: docker-compose -f monitoring/docker-compose.monitoring.yml down"
log "   로그 확인: docker-compose -f monitoring/docker-compose.monitoring.yml logs -f"
log "   서비스 재시작: docker-compose -f monitoring/docker-compose.monitoring.yml restart"

# 알림 설정 안내
warn "⚠️  알림을 받으려면 .env 파일에 SMTP 설정을 추가하고 서비스를 재시작하세요."
info "💡 SMTP 설정 예시:"
info "   SMTP_HOST=smtp.gmail.com"
info "   SMTP_PORT=587"
info "   SMTP_USER=your-email@gmail.com"
info "   SMTP_PASS=your-app-password"

log "🎉 모니터링 시스템이 성공적으로 시작되었습니다!"

# 자동 대시보드 임포트 (선택사항)
read -p "기본 대시보드를 자동으로 임포트하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "📊 기본 대시보드 임포트 중..."
    
    # Node Exporter 대시보드 임포트
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "dashboard": {
                "id": 1860,
                "title": "Node Exporter Full"
            },
            "folderId": 0,
            "overwrite": true
        }' \
        http://admin:admin123@localhost:3000/api/dashboards/import
    
    log "✅ 기본 대시보드 임포트 완료"
fi