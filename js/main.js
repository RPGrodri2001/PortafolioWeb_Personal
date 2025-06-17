// ===============================
// 🚀 MAIN.JS OPTIMIZADO
// REEMPLAZAR TODO EL CONTENIDO
// ===============================

// 📊 Variables globales optimizadas
let lastScrollTop = 0;
let isScrolling = false;
const navbar = document.getElementById('navbar');
const loadingScreen = document.getElementById('loadingScreen');

// 🎯 INICIALIZACIÓN OPTIMIZADA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando optimizaciones...');
    
    // Inicializar todas las funciones
    initPreloader();
    initScrollAnimations(); // Reemplazo de AOS
    initNavbarBehavior();
    initTypingAnimation();
    initCounters();
    initSmoothScroll();
    initContactForm();
    initScrollToTop();
    initProgressBars();
    
    console.log('✅ Todas las optimizaciones cargadas');
});

// 🎭 PRELOADER OPTIMIZADO
function initPreloader() {
    // Ocultar preloader más rápido
    window.addEventListener('load', function() {
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                // Iniciar animaciones después del preloader
                startInitialAnimations();
            }
        }, 1000); // Reducido de posibles 3+ segundos a 1 segundo
    });
    
    // Fallback si algo falla
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }, 3000);
}

// 🎨 REEMPLAZO DE AOS - ANIMACIONES NATIVAS
function initScrollAnimations() {
    // Intersection Observer optimizado (reemplaza AOS)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Agregar clase de animación
                entry.target.classList.add('aos-animate');
                // Dejar de observar una vez animado
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observar todos los elementos con data-aos
    const elementsToAnimate = document.querySelectorAll('[data-aos]');
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });
    
    console.log(`🎭 Animaciones iniciadas para ${elementsToAnimate.length} elementos`);
}

// 🎬 ANIMACIONES INICIALES
function startInitialAnimations() {
    // Animar elementos del hero inmediatamente
    const heroElements = document.querySelectorAll('.fade-in-up');
    heroElements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('animate');
        }, index * 200);
    });
}

// 📱 NAVBAR OPTIMIZADO
function initNavbarBehavior() {
    if (!navbar) return;
    
    // Throttle optimizado para scroll
    const throttledScroll = throttle(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Comportamiento del navbar
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        // Cambiar opacidad del navbar
        if (scrollTop > 50) {
            navbar.style.background = 'rgba(15, 15, 15, 0.98)';
        } else {
            navbar.style.background = 'rgba(15, 15, 15, 0.95)';
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, 10);
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
    console.log('📱 Navbar behavior initialized');
}

// ⌨️ TYPING ANIMATION OPTIMIZADA
function initTypingAnimation() {
    const typingElement = document.getElementById('typingText');
    if (!typingElement) return;
    
    const texts = [
        'Desarrollador Full Stack Junior',
        'Especialista en React & Node.js', 
        'Creador de Soluciones Web',
        'Apasionado por la Tecnología'
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function typeText() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typeSpeed = isDeleting ? 50 : 100;
        
        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000; // Pausa al final
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typeSpeed = 500; // Pausa antes del siguiente
        }
        
        setTimeout(typeText, typeSpeed);
    }
    
    // Iniciar después del preloader
    setTimeout(typeText, 2000);
    console.log('⌨️ Typing animation initialized');
}

// 🔢 COUNTERS OPTIMIZADOS
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000; // 2 segundos
                const increment = target / (duration / 16); // 60fps
                let current = 0;
                
                const updateCounter = () => {
                    if (current < target) {
                        current += increment;
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => counterObserver.observe(counter));
    console.log(`🔢 Counters initialized: ${counters.length}`);
}

// 🌊 SMOOTH SCROLL OPTIMIZADO
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = navbar ? navbar.offsetHeight : 0;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    console.log(`🌊 Smooth scroll for ${links.length} links`);
}


// ⬆️ SCROLL TO TOP OPTIMIZADO
function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (!scrollTopBtn) return;
    
    // Mostrar/ocultar botón
    const toggleScrollBtn = throttle(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 300) {
            scrollTopBtn.style.opacity = '1';
            scrollTopBtn.style.visibility = 'visible';
        } else {
            scrollTopBtn.style.opacity = '0';
            scrollTopBtn.style.visibility = 'hidden';
        }
    }, 100);
    
    window.addEventListener('scroll', toggleScrollBtn, { passive: true });
    
    // Click handler
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    console.log('⬆️ Scroll to top initialized');
}

// 📊 PROGRESS BARS OPTIMIZADAS
function initProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.getAttribute('data-width');
                
                setTimeout(() => {
                    bar.style.width = width + '%';
                }, 500);
                
                progressObserver.unobserve(bar);
            }
        });
    }, { threshold: 0.5 });
    
    progressBars.forEach(bar => progressObserver.observe(bar));
    console.log(`📊 Progress bars initialized: ${progressBars.length}`);
}

// 🛠️ UTILIDADES OPTIMIZADAS
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 📱 RESPONSIVE UTILITIES
window.addEventListener('resize', debounce(() => {
    console.log('🔄 Window resized, recalculating...');
    // Recalcular posiciones si es necesario
}, 250));

// 🚀 PERFORMANCE MONITORING
window.addEventListener('load', function() {
    setTimeout(function() {
        if (performance && performance.getEntriesByType) {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                const loadTime = perfData.loadEventEnd - perfData.fetchStart;
                console.log(`⚡ Tiempo de carga optimizado: ${Math.round(loadTime)}ms`);
                
                // Enviar métrica si es muy lento
                if (loadTime > 5000) {
                    console.warn('⚠️ Sitio aún puede optimizarse más');
                } else {
                    console.log('🚀 ¡Excelente rendimiento!');
                }
            }
        }
    }, 100);
});

// 🛡️ ERROR HANDLING
window.addEventListener('error', function(e) {
    console.error('Error capturado:', e.message);
});

// 📱 MOBILE OPTIMIZATIONS
if ('ontouchstart' in window) {
    // Optimizaciones específicas para móvil
    document.body.classList.add('touch-device');
    console.log('📱 Mobile optimizations applied');
}

// 🎉 INITIALIZATION COMPLETE
console.log('🎉 Portfolio optimizado cargado exitosamente!');