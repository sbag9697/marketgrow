// 모바일 메뉴 시스템
(function() {
    'use strict';

    // DOM 요소 가져오기
    let mobileToggle = null;
    let navMenu = null;
    let body = null;

    // 초기화 함수
    function init() {
        mobileToggle = document.querySelector('.mobile-menu-toggle');
        navMenu = document.querySelector('.nav-menu');
        body = document.body;

        if (!mobileToggle || !navMenu) {
            console.warn('모바일 메뉴 요소를 찾을 수 없습니다.');
            return;
        }

        // 이벤트 리스너 추가
        setupEventListeners();
    }

    // 이벤트 리스너 설정
    function setupEventListeners() {
        // 모바일 메뉴 토글 클릭
        mobileToggle.addEventListener('click', toggleMenu);

        // 메뉴 링크 클릭 시 메뉴 닫기
        const menuLinks = navMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // 외부 클릭 시 메뉴 닫기
        document.addEventListener('click', handleOutsideClick);

        // ESC 키 누르면 메뉴 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMenu();
            }
        });

        // 화면 크기 변경 시 메뉴 초기화
        window.addEventListener('resize', handleResize);
    }

    // 메뉴 토글
    function toggleMenu(e) {
        e.stopPropagation();
        
        const isActive = navMenu.classList.contains('active');
        
        if (isActive) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    // 메뉴 열기
    function openMenu() {
        mobileToggle.classList.add('active');
        navMenu.classList.add('active');
        body.style.overflow = 'hidden'; // 스크롤 방지
        
        // 애니메이션을 위한 지연
        setTimeout(() => {
            navMenu.style.opacity = '1';
        }, 10);
    }

    // 메뉴 닫기
    function closeMenu() {
        mobileToggle.classList.remove('active');
        navMenu.style.opacity = '0';
        
        setTimeout(() => {
            navMenu.classList.remove('active');
            body.style.overflow = ''; // 스크롤 복원
        }, 300);
    }

    // 외부 클릭 처리
    function handleOutsideClick(e) {
        if (!navMenu.contains(e.target) && 
            !mobileToggle.contains(e.target) && 
            navMenu.classList.contains('active')) {
            closeMenu();
        }
    }

    // 화면 크기 변경 처리
    function handleResize() {
        if (window.innerWidth > 768) {
            closeMenu();
            navMenu.style.opacity = '';
        }
    }

    // DOM 로드 완료 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();