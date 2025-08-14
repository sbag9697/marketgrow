// Keywords Pages JavaScript (Video & Live Keywords)

document.addEventListener('DOMContentLoaded', () => {
    initializePlatformTabs();
    initializeAnimations();
    initializeModal();
});

// Platform tabs functionality
function initializePlatformTabs() {
    const platformTabs = document.querySelectorAll('.platform-tab');
    const platformContents = document.querySelectorAll('.platform-content');

    platformTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetPlatform = this.getAttribute('data-platform');

            // Remove active class from all tabs and contents
            platformTabs.forEach(t => t.classList.remove('active'));
            platformContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const targetContent = document.querySelector(`[data-platform="${targetPlatform}"].platform-content`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Scroll animations
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';

                // Add staggered animation for grid items
                if (entry.target.classList.contains('work-item') ||
                    entry.target.classList.contains('package-card') ||
                    entry.target.classList.contains('story-card')) {
                    const delay = Array.from(entry.target.parentNode.children).indexOf(entry.target) * 100;
                    entry.target.style.transitionDelay = `${delay}ms`;
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.work-item, .package-card, .story-card, .guarantee-item');

    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease';
        observer.observe(element);
    });
}

// Modal functionality
function initializeModal() {
    const modal = document.getElementById('consultationModal');
    const form = document.getElementById('consultationForm');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleConsultationSubmit();
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeConsultation();
        }
    });
}

// Open consultation modal
function openConsultation() {
    const modal = document.getElementById('consultationModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Focus on first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }
}

// Close consultation modal
function closeConsultation() {
    const modal = document.getElementById('consultationModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Reset form
        const form = document.getElementById('consultationForm');
        if (form) {
            form.reset();
        }
    }
}

// Handle consultation form submission
function handleConsultationSubmit() {
    const form = document.getElementById('consultationForm');
    const submitBtn = form.querySelector('.submit-btn');

    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 전송 중...';
    submitBtn.disabled = true;

    // Get form data
    const formData = new FormData(form);
    const consultationData = {
        name: formData.get('consultName') || document.getElementById('consultName').value,
        email: formData.get('consultEmail') || document.getElementById('consultEmail').value,
        phone: formData.get('consultPhone') || document.getElementById('consultPhone').value,
        platform: formData.get('consultPlatform') || document.getElementById('consultPlatform').value,
        keywords: formData.get('consultKeywords') || document.getElementById('consultKeywords').value
    };

    // Simulate API call
    setTimeout(() => {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        // Show success message
        showNotification('상담 신청이 완료되었습니다! 24시간 내에 연락드리겠습니다.', 'success');

        // Close modal
        closeConsultation();

        // In real implementation, you would send this data to your backend
        console.log('Consultation request:', consultationData);
    }, 2000);
}

// Package selection
function selectPackage(packageType, platform) {
    // Show confirmation
    const confirmMessage = `${platform} ${packageType} 패키지를 선택하시겠습니까?`;

    if (confirm(confirmMessage)) {
        // In real implementation, redirect to order page or open order modal
        showNotification('주문 페이지로 이동합니다...', 'info');

        setTimeout(() => {
            // Redirect to order page with package info
            window.location.href = `order-method.html?package=${packageType}&platform=${platform}`;
        }, 1000);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        success: '#48bb78',
        error: '#e53e3e',
        warning: '#ed8936',
        info: '#4299e1'
    };
    return colors[type] || '#4299e1';
}

// Add CSS animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 5px;
        margin-left: auto;
        opacity: 0.8;
        transition: opacity 0.3s ease;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
`;
document.head.appendChild(notificationStyles);

// Package button click handlers
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('package-btn')) {
        const packageCard = e.target.closest('.package-card');
        const packageName = packageCard.querySelector('.package-header h4').textContent;
        const platform = packageCard.closest('.platform-content').getAttribute('data-platform');

        selectPackage(packageName, platform);
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add hover effects for interactive elements
document.addEventListener('DOMContentLoaded', () => {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.package-btn, .cta-btn, .submit-btn');

    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            if (this.querySelector('.ripple')) {
                this.querySelector('.ripple').remove();
            }

            const circle = document.createElement('span');
            const diameter = Math.max(this.clientWidth, this.clientHeight);
            const radius = diameter / 2;

            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${e.clientX - this.offsetLeft - radius}px`;
            circle.style.top = `${e.clientY - this.offsetTop - radius}px`;
            circle.classList.add('ripple');

            this.appendChild(circle);

            setTimeout(() => circle.remove(), 600);
        });
    });
});

// Add ripple effect styles
const rippleStyles = document.createElement('style');
rippleStyles.textContent = `
    .package-btn, .cta-btn, .submit-btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyles);

// Form validation
function validateConsultationForm() {
    const form = document.getElementById('consultationForm');
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = '#e53e3e';
            isValid = false;
        } else {
            input.style.borderColor = '#e2e8f0';
        }
    });

    // Email validation
    const emailInput = document.getElementById('consultEmail');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailInput.value && !emailRegex.test(emailInput.value)) {
        emailInput.style.borderColor = '#e53e3e';
        isValid = false;
    }

    // Phone validation
    const phoneInput = document.getElementById('consultPhone');
    const phoneRegex = /^[0-9-+\s()]+$/;
    if (phoneInput.value && !phoneRegex.test(phoneInput.value)) {
        phoneInput.style.borderColor = '#e53e3e';
        isValid = false;
    }

    return isValid;
}

// Real-time form validation
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('consultationForm');
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                validateConsultationForm();
            });

            input.addEventListener('input', function () {
                if (this.style.borderColor === 'rgb(229, 62, 62)') {
                    this.style.borderColor = '#e2e8f0';
                }
            });
        });
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('consultationModal');

    // Close modal with Escape key
    if (e.key === 'Escape' && modal && modal.style.display === 'block') {
        closeConsultation();
    }

    // Submit form with Ctrl+Enter
    if (e.ctrlKey && e.key === 'Enter' && modal && modal.style.display === 'block') {
        const form = document.getElementById('consultationForm');
        if (form && validateConsultationForm()) {
            handleConsultationSubmit();
        }
    }
});

// Performance optimization - lazy load animations
const lazyAnimationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            lazyAnimationObserver.unobserve(entry.target);
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const animatableElements = document.querySelectorAll('.work-item, .package-card, .story-card');
    animatableElements.forEach(el => {
        lazyAnimationObserver.observe(el);
    });
});
