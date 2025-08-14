// Order Method JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // FAQ Accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all FAQ items
            faqItems.forEach(faqItem => {
                faqItem.classList.remove('active');
            });

            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
});

// Demo variables
let currentDemoStep = 1;
let selectedService = '';
let demoUrl = '';

// Service selection
function selectService(serviceType) {
    selectedService = serviceType;

    // Remove previous selection
    document.querySelectorAll('.service-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Add selection to clicked option
    document.querySelector(`[onclick="selectService('${serviceType}')"]`).classList.add('selected');

    // Enable next button
    document.querySelector('[onclick="nextDemoStep(2)"]').disabled = false;
}

// URL validation
function validateUrl() {
    const urlInput = document.getElementById('demoUrl');
    const validation = document.querySelector('.url-validation');
    const nextBtn = document.querySelector('[onclick="nextDemoStep(3)"]');

    const url = urlInput.value;

    if (url && isValidUrl(url)) {
        demoUrl = url;
        validation.classList.add('show');
        nextBtn.disabled = false;
        urlInput.style.borderColor = '#48bb78';
    } else {
        validation.classList.remove('show');
        nextBtn.disabled = true;
        urlInput.style.borderColor = '#e53e3e';
    }
}

// URL validation helper
function isValidUrl(string) {
    try {
        const url = new URL(string);
        const validDomains = [
            'instagram.com',
            'youtube.com',
            'youtu.be',
            'tiktok.com',
            'facebook.com',
            'twitter.com',
            'x.com'
        ];

        return validDomains.some(domain => url.hostname.includes(domain));
    } catch (_) {
        return false;
    }
}

// Demo price update
function updateDemoPrice() {
    const quantity = document.getElementById('demoQuantity').value;
    const priceElement = document.getElementById('demoTotalPrice');

    // Simple price calculation for demo
    const prices = {
        100: '₩10,000',
        500: '₩45,000',
        1000: '₩85,000',
        2500: '₩200,000'
    };

    priceElement.textContent = prices[quantity] || '₩10,000';
}

// Demo navigation
function nextDemoStep(step) {
    const currentStep = document.querySelector('.form-step.active');
    const nextStep = document.querySelector(`[data-step="${step}"]`);

    if (currentStep && nextStep) {
        currentStep.classList.remove('active');
        nextStep.classList.add('active');
        currentDemoStep = step;
    }
}

function prevDemoStep(step) {
    const currentStep = document.querySelector('.form-step.active');
    const prevStep = document.querySelector(`[data-step="${step}"]`);

    if (currentStep && prevStep) {
        currentStep.classList.remove('active');
        prevStep.classList.add('active');
        currentDemoStep = step;
    }
}

// Restart demo
function restartDemo() {
    // Reset all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show first step
    document.querySelector('[data-step="1"]').classList.add('active');

    // Reset selections
    document.querySelectorAll('.service-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Reset form fields
    document.getElementById('demoUrl').value = '';
    document.getElementById('demoQuantity').selectedIndex = 0;
    document.querySelector('.url-validation').classList.remove('show');

    // Reset variables
    currentDemoStep = 1;
    selectedService = '';
    demoUrl = '';

    // Disable buttons
    document.querySelector('[onclick="nextDemoStep(2)"]').disabled = true;
    document.querySelector('[onclick="nextDemoStep(3)"]').disabled = true;

    // Reset price
    updateDemoPrice();
}

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

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.step-card, .payment-card, .benefit-item');

    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease';
        observer.observe(element);
    });
});

// Add loading animation for buttons
document.querySelectorAll('.cta-btn, .next-btn, .prev-btn').forEach(button => {
    button.addEventListener('click', function (e) {
        // Don't add loading if it's a demo button or disabled
        if (this.classList.contains('next-btn') ||
            this.classList.contains('prev-btn') ||
            this.classList.contains('restart-btn') ||
            this.disabled) {
            return;
        }

        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리중...';
        this.disabled = true;

        // Simulate loading for demo
        setTimeout(() => {
            this.innerHTML = originalText;
            this.disabled = false;
        }, 2000);
    });
});

// Add form validation feedback
document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('demoUrl');

    if (urlInput) {
        urlInput.addEventListener('input', function () {
            clearTimeout(this.validationTimeout);

            this.validationTimeout = setTimeout(() => {
                validateUrl();
            }, 500);
        });
    }
});

// Add hover effects for service options
document.querySelectorAll('.service-option').forEach(option => {
    option.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-5px) scale(1.02)';
    });

    option.addEventListener('mouseleave', function () {
        if (!this.classList.contains('selected')) {
            this.style.transform = 'translateY(0) scale(1)';
        }
    });
});

// Add ripple effect to buttons
function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);
}

// Add ripple effect to buttons
document.querySelectorAll('.next-btn, .prev-btn, .restart-btn, .cta-btn').forEach(button => {
    button.addEventListener('click', createRipple);
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
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
    
    .next-btn, .prev-btn, .restart-btn, .cta-btn {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(style);
