/**
 * 전역 인증 체크 시스템
 * 모든 페이지에서 로그인 상태를 확인하고 UI를 업데이트
 */

(function() {
    'use strict';
    
    // 인증 상태 체크
    function checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const userInfo = localStorage.getItem('userInfo');
        
        if (token && userInfo) {
            try {
                const user = JSON.parse(userInfo);
                return { isLoggedIn: true, user };
            } catch (e) {
                console.error('Invalid user info:', e);
                return { isLoggedIn: false, user: null };
            }
        }
        
        return { isLoggedIn: false, user: null };
    }
    
    // 네비게이션 업데이트
    function updateNavigation(authStatus) {
        // 로그인/회원가입 링크
        const loginLinks = document.querySelectorAll('a[href*="login"], a[href*="signin"]');
        const signupLinks = document.querySelectorAll('a[href*="signup"], a[href*="register"]');
        
        // 대시보드 링크
        const dashboardLinks = document.querySelectorAll('a[href*="dashboard"]');
        
        // 사용자 정보 표시 영역
        const userMenus = document.querySelectorAll('.user-menu, .nav-user, #userMenu');
        
        if (authStatus.isLoggedIn) {
            // 로그인 상태
            
            // 로그인/회원가입 링크 숨기기 또는 대시보드로 변경
            loginLinks.forEach(link => {
                if (link.parentElement && link.parentElement.tagName === 'LI') {
                    // 리스트 아이템인 경우
                    link.parentElement.style.display = 'none';
                } else {
                    link.style.display = 'none';
                }
            });
            
            signupLinks.forEach(link => {
                if (link.parentElement && link.parentElement.tagName === 'LI') {
                    link.parentElement.style.display = 'none';
                } else {
                    link.style.display = 'none';
                }
            });
            
            // 대시보드 링크 표시
            dashboardLinks.forEach(link => {
                if (link.parentElement && link.parentElement.tagName === 'LI') {
                    link.parentElement.style.display = 'block';
                } else {
                    link.style.display = 'inline-block';
                }
            });
            
            // 사용자 메뉴 표시 및 정보 업데이트
            userMenus.forEach(menu => {
                menu.style.display = 'block';
                
                // 사용자 이름 표시
                const userName = menu.querySelector('.user-name, .username, #userName');
                if (userName) {
                    userName.textContent = authStatus.user.name || authStatus.user.username || authStatus.user.email;
                }
            });
            
            // 동적으로 사용자 메뉴 생성 (없는 경우)
            if (userMenus.length === 0) {
                createUserMenu(authStatus.user);
            }
            
        } else {
            // 로그아웃 상태
            
            // 로그인/회원가입 링크 표시
            loginLinks.forEach(link => {
                if (link.parentElement && link.parentElement.tagName === 'LI') {
                    link.parentElement.style.display = 'block';
                } else {
                    link.style.display = 'inline-block';
                }
            });
            
            signupLinks.forEach(link => {
                if (link.parentElement && link.parentElement.tagName === 'LI') {
                    link.parentElement.style.display = 'block';
                } else {
                    link.style.display = 'inline-block';
                }
            });
            
            // 대시보드 링크 숨기기
            dashboardLinks.forEach(link => {
                if (link.parentElement && link.parentElement.tagName === 'LI') {
                    link.parentElement.style.display = 'none';
                } else {
                    link.style.display = 'none';
                }
            });
            
            // 사용자 메뉴 숨기기
            userMenus.forEach(menu => {
                menu.style.display = 'none';
            });
        }
    }
    
    // 사용자 메뉴 생성
    function createUserMenu(user) {
        const navMenu = document.querySelector('.nav-menu, .navbar-nav, nav ul');
        if (!navMenu) return;
        
        // 기존 로그인/회원가입 항목 숨기기
        const existingAuthItems = navMenu.querySelectorAll('li');
        existingAuthItems.forEach(item => {
            const link = item.querySelector('a');
            if (link && (link.href.includes('login') || link.href.includes('signup'))) {
                item.style.display = 'none';
            }
        });
        
        // 사용자 메뉴 HTML
        const userMenuItem = document.createElement('li');
        userMenuItem.className = 'nav-item dropdown user-menu-item';
        userMenuItem.innerHTML = `
            <a href="#" class="nav-link dropdown-toggle" id="userDropdown" role="button" data-toggle="dropdown">
                <i class="fas fa-user-circle"></i>
                <span class="user-name">${user.name || user.username || '사용자'}</span>
            </a>
            <div class="dropdown-menu dropdown-menu-right">
                <a class="dropdown-item" href="/dashboard.html">
                    <i class="fas fa-tachometer-alt"></i> 대시보드
                </a>
                <a class="dropdown-item" href="/profile.html">
                    <i class="fas fa-user"></i> 내 프로필
                </a>
                <a class="dropdown-item" href="/orders.html">
                    <i class="fas fa-shopping-bag"></i> 주문 내역
                </a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="#" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> 로그아웃
                </a>
            </div>
        `;
        
        // 대시보드 링크 추가
        const dashboardItem = document.createElement('li');
        dashboardItem.innerHTML = '<a href="/dashboard.html">대시보드</a>';
        navMenu.appendChild(dashboardItem);
        
        // 로그아웃 링크 추가
        const logoutItem = document.createElement('li');
        logoutItem.innerHTML = '<a href="#" onclick="logout()">로그아웃</a>';
        navMenu.appendChild(logoutItem);
    }
    
    // 보호된 페이지 체크
    function checkProtectedPage() {
        const currentPath = window.location.pathname;
        const protectedPaths = [
            '/dashboard',
            '/profile',
            '/orders',
            '/payment',
            '/cart',
            '/admin'
        ];
        
        const isProtected = protectedPaths.some(path => currentPath.includes(path));
        
        if (isProtected) {
            const authStatus = checkAuthStatus();
            if (!authStatus.isLoggedIn) {
                // 로그인 페이지로 리다이렉트
                const returnUrl = encodeURIComponent(window.location.href);
                window.location.href = `/login.html?return=${returnUrl}`;
            }
        }
    }
    
    // 로그아웃 함수
    window.logout = function() {
        // 확인 메시지
        if (confirm('로그아웃 하시겠습니까?')) {
            // 토큰 및 사용자 정보 삭제
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('cart_items');
            
            // 세션 스토리지도 클리어
            sessionStorage.clear();
            
            // 홈페이지로 리다이렉트
            alert('로그아웃 되었습니다.');
            window.location.href = '/index.html';
        }
    };
    
    // 토큰 만료 체크
    function checkTokenExpiry() {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        try {
            // JWT 디코드 (간단한 방법)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000; // 밀리초로 변환
            const now = Date.now();
            
            if (now > expiry) {
                // 토큰 만료
                console.log('Token expired, logging out...');
                localStorage.removeItem('authToken');
                localStorage.removeItem('userInfo');
                
                // 로그인 페이지로 리다이렉트
                if (!window.location.pathname.includes('login')) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.');
                    window.location.href = '/login.html';
                }
            }
        } catch (e) {
            console.error('Token validation error:', e);
        }
    }
    
    // 페이지 로드 시 실행
    document.addEventListener('DOMContentLoaded', function() {
        const authStatus = checkAuthStatus();
        
        // 네비게이션 업데이트
        updateNavigation(authStatus);
        
        // 보호된 페이지 체크
        checkProtectedPage();
        
        // 토큰 만료 체크
        checkTokenExpiry();
        
        // 주기적으로 토큰 체크 (5분마다)
        setInterval(checkTokenExpiry, 5 * 60 * 1000);
        
        console.log('Auth check initialized:', authStatus);
    });
    
    // 전역 함수로 내보내기
    window.authCheck = {
        checkAuthStatus,
        updateNavigation,
        checkProtectedPage,
        logout: window.logout
    };
    
})();