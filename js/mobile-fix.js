// 간단한 모바일 메뉴 시스템 - 호환성 최대화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mobile fix script loaded');
    
    // 모바일 메뉴 토글 버튼 찾기
    var mobileToggle = document.querySelector('.mobile-menu-toggle');
    var navMenu = document.querySelector('.nav-menu');
    
    if (!mobileToggle || !navMenu) {
        console.warn('Mobile menu elements not found');
        return;
    }
    
    // 클릭 이벤트 - 가장 기본적인 방식
    mobileToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // 메뉴 토글
        if (navMenu.style.display === 'flex') {
            // 메뉴 닫기
            navMenu.style.display = 'none';
            mobileToggle.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            // 메뉴 열기
            navMenu.style.display = 'flex';
            mobileToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
    
    // 메뉴 링크 클릭 시 메뉴 닫기
    var menuLinks = navMenu.querySelectorAll('a');
    for (var i = 0; i < menuLinks.length; i++) {
        menuLinks[i].addEventListener('click', function() {
            navMenu.style.display = 'none';
            mobileToggle.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // 화면 크기 변경 시 리셋
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navMenu.style.display = '';
            mobileToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});