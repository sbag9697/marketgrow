// 방문자 추적
function trackVisitor() {
    // 총 방문자 수 증가
    let totalVisitors = parseInt(localStorage.getItem('total_visitors') || '0');
    totalVisitors++;
    localStorage.setItem('total_visitors', totalVisitors.toString());
    
    // 오늘 방문자 수 증가
    const today = new Date().toISOString().split('T')[0];
    const todayKey = `visitors_${today}`;
    let todayVisitors = parseInt(localStorage.getItem(todayKey) || '0');
    todayVisitors++;
    localStorage.setItem(todayKey, todayVisitors.toString());
    
    // 일일 방문 기록 (최근 30일)
    const visitHistory = JSON.parse(localStorage.getItem('visit_history') || '{}');
    visitHistory[today] = todayVisitors;
    
    // 30일 이상 된 데이터 제거
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    Object.keys(visitHistory).forEach(date => {
        if (new Date(date) < thirtyDaysAgo) {
            delete visitHistory[date];
        }
    });
    
    localStorage.setItem('visit_history', JSON.stringify(visitHistory));
}

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // 방문자 추적
    trackVisitor();
    
    // 모바일 메뉴 토글
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // FAQ 아코디언 기능
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // 현재 아이템이 이미 활성화되어 있는지 확인
            const isActive = item.classList.contains('active');
            
            // 모든 FAQ 아이템을 닫기
            faqItems.forEach(faqItem => {
                faqItem.classList.remove('active');
            });
            
            // 클릭한 아이템이 활성화되지 않았다면 열기
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
    
    // 스크롤 시 네비게이션 배경 변경
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(26, 54, 93, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = '#1a365d';
            navbar.style.backdropFilter = 'none';
        }
    });
    
    // 부드러운 스크롤
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // 네비게이션 높이만큼 조정
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
            
            // 모바일 메뉴가 열려있다면 닫기
            if (navMenu.classList.contains('active')) {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });
    
    // 로그인 폼 처리 - auth.js에서 처리하므로 주석 처리
    /*
    const loginForm = document.querySelector('.login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = this.querySelector('input[type="text"]').value;
            const password = this.querySelector('input[type="password"]').value;
            
            if (username && password) {
                alert('로그인 기능은 개발 중입니다.');
                // 실제 로그인 로직은 여기에 추가
            } else {
                alert('아이디와 비밀번호를 입력해주세요.');
            }
        });
    }
    */

    // 서비스 버튼 클릭 이벤트
    const serviceButtons = document.querySelectorAll('.service-btn');
    
    serviceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const serviceName = this.closest('.service-card').querySelector('h3').textContent;
            alert(`${serviceName} 서비스 페이지로 이동합니다.`);
            // 실제로는 해당 서비스 페이지로 리다이렉트
        });
    });
    
    // 연락처 클릭 이벤트
    const contactItems = document.querySelectorAll('.contact-item');
    
    contactItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const contactType = this.querySelector('span').textContent;
            
            if (contactType.includes('카카오톡')) {
                alert('카카오톡 ID: @marketgrow\n\n카카오톡으로 문의해주세요!');
            } else if (contactType.includes('인스타그램')) {
                alert('인스타그램: @marketgrow_official\n\nDM으로 문의해주세요!');
            } else if (contactType.includes('텔레그램')) {
                alert('텔레그램: @marketgrow_support\n\n텔레그램으로 문의해주세요!');
            }
        });
    });
    
    // 서비스 카드 애니메이션
    const serviceCards = document.querySelectorAll('.service-card');
    
    // 특징 카드 애니메이션
    const featureItems = document.querySelectorAll('.feature-item');
    
    // Intersection Observer로 스크롤 애니메이션
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // 애니메이션을 위한 초기 스타일 설정
    featureItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'all 0.6s ease';
        observer.observe(item);
    });
    
    serviceCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
    
    // 숫자 카운트업 애니메이션 (나중에 통계 섹션 추가 시 사용)
    function animateCounter(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            element.textContent = current.toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    
    // 로딩 애니메이션
    window.addEventListener('load', function() {
        const loader = document.querySelector('.loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    });
});

// 통계 카운터 애니메이션
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const text = stat.textContent;
        const isPercentage = text.includes('%');
        const isKPlus = text.includes('K+');
        const isSlash = text.includes('/');
        
        let finalValue;
        if (isPercentage) {
            finalValue = parseInt(text);
        } else if (isKPlus) {
            finalValue = parseInt(text) * 1000;
        } else if (isSlash) {
            return; // 24/7은 애니메이션 하지 않음
        } else {
            finalValue = parseInt(text);
        }
        
        if (!isNaN(finalValue)) {
            animateCounter(stat, 0, finalValue, 2000, text);
        }
    });
}

function animateCounter(element, start, end, duration, originalText) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        
        // 원래 형식에 맞춰 표시
        if (originalText.includes('K+')) {
            element.textContent = (current / 1000).toFixed(1) + 'K+';
        } else if (originalText.includes('%')) {
            element.textContent = current + '%';
        } else {
            element.textContent = current.toLocaleString();
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// 통계 섹션이 보일 때 애니메이션 시작
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
            statsObserver.unobserve(entry.target);
        }
    });
});

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// 모바일 메뉴 CSS 추가 (동적으로)
const style = document.createElement('style');
style.textContent = `
    @media (max-width: 768px) {
        .nav-menu {
            position: fixed;
            left: -100%;
            top: 80px;
            flex-direction: column;
            background: rgba(26, 54, 93, 0.95);
            width: 100%;
            text-align: center;
            transition: 0.3s;
            backdrop-filter: blur(10px);
            padding: 20px 0;
        }
        
        .nav-menu.active {
            left: 0;
        }
        
        .nav-menu li {
            margin: 10px 0;
        }
        
        .mobile-menu-toggle.active span:nth-child(1) {
            transform: rotate(-45deg) translate(-5px, 6px);
        }
        
        .mobile-menu-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-toggle.active span:nth-child(3) {
            transform: rotate(45deg) translate(-5px, -6px);
        }
    }
`;
document.head.appendChild(style);