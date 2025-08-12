#!/bin/bash

# MarketGrow 자동 배포 스크립트
# 사용법: ./deploy.sh [frontend|backend|all]

set -e  # 에러 발생 시 스크립트 중단

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 백엔드 배포 함수
deploy_backend() {
    log_info "백엔드 배포 시작..."
    
    cd backend
    
    # Git 상태 확인
    if [[ $(git status --porcelain) ]]; then
        log_warn "커밋되지 않은 변경사항이 있습니다. 계속하시겠습니까? (y/n)"
        read -r response
        if [[ "$response" != "y" ]]; then
            log_info "배포 취소됨"
            return 1
        fi
    fi
    
    # 의존성 설치
    log_info "의존성 설치 중..."
    npm install
    
    # 환경 변수 확인
    if [ ! -f .env ]; then
        log_error ".env 파일이 없습니다. .env.example을 참고하여 생성해주세요."
        return 1
    fi
    
    # Railway 배포
    if command -v railway &> /dev/null; then
        log_info "Railway로 배포 중..."
        railway up
        
        # 배포 확인
        sleep 5
        railway status
        
        log_info "백엔드 배포 완료!"
        
        # 헬스체크
        BACKEND_URL=$(railway variables get RAILWAY_STATIC_URL 2>/dev/null || echo "")
        if [ -n "$BACKEND_URL" ]; then
            log_info "헬스체크 실행 중..."
            curl -s "${BACKEND_URL}/api/health" || log_warn "헬스체크 실패"
        fi
    else
        log_error "Railway CLI가 설치되지 않았습니다."
        log_info "설치: npm install -g @railway/cli"
        return 1
    fi
    
    cd ..
}

# 프론트엔드 배포 함수
deploy_frontend() {
    log_info "프론트엔드 배포 시작..."
    
    # Git 상태 확인
    if [[ $(git status --porcelain) ]]; then
        log_warn "커밋되지 않은 변경사항이 있습니다. 계속하시겠습니까? (y/n)"
        read -r response
        if [[ "$response" != "y" ]]; then
            log_info "배포 취소됨"
            return 1
        fi
    fi
    
    # 의존성 설치
    log_info "의존성 설치 중..."
    npm install
    
    # 백엔드 URL 확인 및 설정
    log_info "백엔드 URL 설정 중..."
    if [ -n "$BACKEND_URL" ]; then
        # js/config.js에 백엔드 URL 업데이트
        sed -i.bak "s|https://marketgrow-production.up.railway.app|${BACKEND_URL}|g" js/config.js
        log_info "백엔드 URL 업데이트: ${BACKEND_URL}"
    fi
    
    # 프로덕션 빌드
    log_info "프로덕션 빌드 중..."
    npm run build
    
    # Netlify 배포
    if command -v netlify &> /dev/null; then
        log_info "Netlify로 배포 중..."
        netlify deploy --prod --dir=dist
        
        log_info "프론트엔드 배포 완료!"
        
        # 배포된 URL 표시
        SITE_URL=$(netlify sites:list --json | jq -r '.[0].ssl_url' 2>/dev/null || echo "")
        if [ -n "$SITE_URL" ]; then
            log_info "사이트 URL: ${SITE_URL}"
        fi
    else
        log_error "Netlify CLI가 설치되지 않았습니다."
        log_info "설치: npm install -g netlify-cli"
        return 1
    fi
}

# 전체 배포 함수
deploy_all() {
    log_info "전체 시스템 배포 시작..."
    
    # 백엔드 먼저 배포
    deploy_backend
    
    if [ $? -eq 0 ]; then
        # 백엔드 배포 성공 시 프론트엔드 배포
        deploy_frontend
    else
        log_error "백엔드 배포 실패. 프론트엔드 배포를 건너뜁니다."
        return 1
    fi
    
    log_info "전체 시스템 배포 완료!"
}

# 배포 전 체크
pre_deploy_check() {
    log_info "배포 전 체크 시작..."
    
    # Node.js 버전 확인
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js 18 이상이 필요합니다. 현재 버전: $(node -v)"
        return 1
    fi
    
    # npm 버전 확인
    NPM_VERSION=$(npm -v | cut -d'.' -f1)
    if [ "$NPM_VERSION" -lt 9 ]; then
        log_warn "npm 9 이상을 권장합니다. 현재 버전: $(npm -v)"
    fi
    
    # Git 설치 확인
    if ! command -v git &> /dev/null; then
        log_error "Git이 설치되지 않았습니다."
        return 1
    fi
    
    log_info "배포 전 체크 완료!"
    return 0
}

# 배포 후 체크
post_deploy_check() {
    log_info "배포 후 체크 시작..."
    
    # 백엔드 헬스체크
    if [ -n "$BACKEND_URL" ]; then
        log_info "백엔드 헬스체크..."
        if curl -s "${BACKEND_URL}/api/health" | grep -q "success"; then
            log_info "백엔드 정상 동작 확인!"
        else
            log_error "백엔드 헬스체크 실패"
        fi
    fi
    
    # 프론트엔드 체크
    if [ -n "$SITE_URL" ]; then
        log_info "프론트엔드 체크..."
        if curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" | grep -q "200"; then
            log_info "프론트엔드 정상 동작 확인!"
        else
            log_error "프론트엔드 접근 실패"
        fi
    fi
    
    log_info "배포 후 체크 완료!"
}

# 메인 실행
main() {
    echo "======================================="
    echo "   MarketGrow 자동 배포 스크립트"
    echo "======================================="
    echo ""
    
    # 배포 전 체크
    pre_deploy_check
    if [ $? -ne 0 ]; then
        log_error "배포 전 체크 실패"
        exit 1
    fi
    
    # 배포 타겟 확인
    TARGET=${1:-all}
    
    case $TARGET in
        frontend)
            deploy_frontend
            ;;
        backend)
            deploy_backend
            ;;
        all)
            deploy_all
            ;;
        *)
            log_error "잘못된 옵션: $TARGET"
            echo "사용법: ./deploy.sh [frontend|backend|all]"
            exit 1
            ;;
    esac
    
    # 배포 후 체크
    if [ $? -eq 0 ]; then
        post_deploy_check
        echo ""
        log_info "🎉 배포가 성공적으로 완료되었습니다! 🎉"
    else
        echo ""
        log_error "배포 중 오류가 발생했습니다."
        exit 1
    fi
}

# 스크립트 실행
main "$@"