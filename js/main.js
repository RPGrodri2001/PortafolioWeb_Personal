/* ================================
   MAIN JAVASCRIPT
   Funcionalidad principal del portafolio
   ================================ */

// ========== CONFIGURACIÓN GLOBAL ==========
const CONFIG = {
    loadingDuration: 1500,
    typingSpeed: 100,
    backSpeed: 130,
    scrollOffset: 300,
    animationDuration: 800,
    debounceDelay: 100,
    throttleLimit: 16, // ~60fps
    aos: {
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        mirror: false,
        offset: 100
    }
};

// ========== UTILIDADES ==========
const Utils = {
    /**
     * Optimiza funciones que se ejecutan frecuentemente
     * @param {Function} func - Función a optimizar
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} - Función optimizada
     */
    debounce(func, wait = CONFIG.debounceDelay) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Limita la frecuencia de ejecución de una función
     * @param {Function} func - Función a limitar
     * @param {number} limit - Límite en ms
     * @returns {Function} - Función limitada
     */
    throttle(func, limit = CONFIG.throttleLimit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Valida formato de email
     * @param {string} email - Email a validar
     * @returns {boolean} - True si es válido
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Scroll suave optimizado
     * @param {string} target - Selector del elemento destino
     * @param {number} duration - Duración de la animación
     */
    smoothScroll(target, duration = 800) {
        const targetElement = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
            
        if (!targetElement) return;

        const targetPosition = targetElement.offsetTop - 80; // Offset para navbar
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = Utils.easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        requestAnimationFrame(animation);
    },

    /**
     * Función de easing para animaciones suaves
     */
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    },

    /**
     * Detecta si el dispositivo es móvil
     * @returns {boolean}
     */
    isMobile() {
        return window.innerWidth <= 768;
    },

    /**
     * Detecta si el usuario prefiere animaciones reducidas
     * @returns {boolean}
     */
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * Genera un ID único
     * @returns {string}
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Sanitiza texto para prevenir XSS
     * @param {string} text - Texto a sanitizar
     * @returns {string}
     */
    sanitizeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ========== LOADING SCREEN ==========
class LoadingScreen {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.progressBar = null;
        this.init();
    }

    init() {
        if (!this.loadingScreen) return;
        
        this.createProgressBar();
        this.preloadResources()
            .then(() => {
                setTimeout(() => this.hide(), CONFIG.loadingDuration);
            })
            .catch(error => {
                console.warn('Error en precarga:', error);
                setTimeout(() => this.hide(), CONFIG.loadingDuration);
            });
    }

    createProgressBar() {
        // Crear barra de progreso opcional
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            width: 200px;
            height: 4px;
            background: rgba(255,255,255,0.2);
            border-radius: 2px;
            margin-top: 20px;
            overflow: hidden;
        `;
        
        this.progressBar = document.createElement('div');
        this.progressBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: white;
            transition: width 0.3s ease;
        `;
        
        progressContainer.appendChild(this.progressBar);
        this.loadingScreen.appendChild(progressContainer);
    }

    updateProgress(percent) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
        }
    }

    async preloadResources() {
        const resources = [
            './imagen/FotoCV.png',
            // Agregar más recursos críticos aquí
        ];

        const promises = resources.map((src, index) => {
            return new Promise((resolve) => {
                if (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.webp')) {
                    const img = new Image();
                    img.onload = () => {
                        this.updateProgress(((index + 1) / resources.length) * 100);
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn(`Error cargando: ${src}`);
                        this.updateProgress(((index + 1) / resources.length) * 100);
                        resolve();
                    };
                    img.src = src;
                } else {
                    // Para otros tipos de archivos
                    fetch(src)
                        .then(() => {
                            this.updateProgress(((index + 1) / resources.length) * 100);
                            resolve();
                        })
                        .catch(() => {
                            console.warn(`Error cargando: ${src}`);
                            this.updateProgress(((index + 1) / resources.length) * 100);
                            resolve();
                        });
                }
            });
        });

        return Promise.all(promises);
    }

    hide() {
        if (!this.loadingScreen) return;
        
        this.loadingScreen.classList.add('hide');
        
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.initializeApp();
        }, 500);
    }

    initializeApp() {
        // Inicializar AOS solo si no hay preferencia por movimiento reducido
        if (!Utils.prefersReducedMotion()) {
            AOS.init(CONFIG.aos);
        }

        // Inicializar componentes
        new TypingEffect();
        new ScrollEffects();
        new SkillsAnimation();
        new FormHandler();
        new NavigationHandler();
        new PerformanceMonitor();
        
        // Evento personalizado para indicar que la app está lista
        document.dispatchEvent(new CustomEvent('appReady'));
    }
}

// ========== EFECTO DE ESCRITURA ==========
class TypingEffect {
    constructor() {
        this.element = document.getElementById('typingText');
        this.texts = [
            'Desarrollador Full Stack Junior',
            'Especialista en React & Node.js',
            'Creador de Soluciones Digitales',
            'Apasionado por la Tecnología'
        ];
        this.currentTextIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        this.isTyping = false;
        this.init();
    }

    init() {
        if (!this.element) return;
        
        // Respetar preferencias de movimiento reducido
        if (Utils.prefersReducedMotion()) {
            this.element.textContent = this.texts[0];
            return;
        }
        
        this.type();
    }

    type() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        const currentText = this.texts[this.currentTextIndex];
        
        if (this.isDeleting) {
            this.element.textContent = currentText.substring(0, this.currentCharIndex - 1);
            this.currentCharIndex--;
        } else {
            this.element.textContent = currentText.substring(0, this.currentCharIndex + 1);
            this.currentCharIndex++;
        }

        let typeSpeed = this.isDeleting ? CONFIG.backSpeed : CONFIG.typingSpeed;

        if (!this.isDeleting && this.currentCharIndex === currentText.length) {
            typeSpeed = 2000; // Pausa al completar
            this.isDeleting = true;
        } else if (this.isDeleting && this.currentCharIndex === 0) {
            this.isDeleting = false;
            this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
            typeSpeed = 500; // Pausa antes de escribir el siguiente
        }

        this.isTyping = false;
        setTimeout(() => this.type(), typeSpeed);
    }

    destroy() {
        this.isTyping = false;
    }
}

// ========== EFECTOS DE SCROLL ==========
class ScrollEffects {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.scrollTopBtn = document.getElementById('scrollTopBtn');
        this.lastScrollTop = 0;
        this.ticking = false;
        this.init();
    }

    init() {
        // Usar RAF para optimizar el scroll
        window.addEventListener('scroll', () => {
            if (!this.ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        });

        // Configurar botón de scroll to top
        if (this.scrollTopBtn) {
            this.scrollTopBtn.addEventListener('click', () => {
                Utils.smoothScroll('body');
            });
        }
    }

    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        this.handleNavbar(scrollTop);
        this.handleScrollButton(scrollTop);
        this.handleParallax(scrollTop);
        
        this.lastScrollTop = scrollTop;
    }

    handleNavbar(scrollTop) {
        if (!this.navbar) return;
        
        if (scrollTop > 50) {
            this.navbar.classList.add('navbar-scrolled');
        } else {
            this.navbar.classList.remove('navbar-scrolled');
        }
    }

    handleScrollButton(scrollTop) {
        if (!this.scrollTopBtn) return;
        
        if (scrollTop > CONFIG.scrollOffset) {
            this.scrollTopBtn.classList.add('show');
        } else {
            this.scrollTopBtn.classList.remove('show');
        }
    }

    handleParallax(scrollTop) {
        if (Utils.isMobile() || Utils.prefersReducedMotion()) return;
        
        const parallaxElements = document.querySelectorAll('.floating-shape');
        
        parallaxElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.1);
            const yPos = scrollTop * speed;
            element.style.transform = `translateY(${yPos}px)`;
        });
    }
}

// ========== ANIMACIÓN DE SKILLS ==========
class SkillsAnimation {
    constructor() {
        this.progressBars = document.querySelectorAll('.progress-fill');
        this.counters = document.querySelectorAll('.counter');
        this.animatedElements = new Set();
        this.init();
    }

    init() {
        this.observeElements();
    }

    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                    this.animatedElements.add(entry.target);
                    
                    if (entry.target.classList.contains('progress-fill')) {
                        this.animateProgressBar(entry.target);
                    } else if (entry.target.classList.contains('counter')) {
                        this.animateCounter(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '0px 0px -50px 0px'
        });

        [...this.progressBars, ...this.counters].forEach(el => {
            observer.observe(el);
        });
    }

    animateProgressBar(element) {
        const width = element.getAttribute('data-width');
        
        // Delay para efecto visual
        setTimeout(() => {
            element.style.width = width + '%';
        }, 300);
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = Utils.prefersReducedMotion() ? 100 : 2000;
        const frameDuration = 1000 / 60; // 60 FPS
        const totalFrames = Math.round(duration / frameDuration);
        const easeOutQuad = t => t * (2 - t);
        
        let frame = 0;
        const countTo = () => {
            frame++;
            const progress = easeOutQuad(frame / totalFrames);
            const currentCount = Math.round(target * progress);
            
            element.textContent = currentCount;
            
            if (frame < totalFrames) {
                requestAnimationFrame(countTo);
            } else {
                element.textContent = target;
            }
        };
        
        countTo();
    }
}

// ========== MANEJADOR DE NAVEGACIÓN ==========
class NavigationHandler {
    constructor() {
        this.activeSection = null;
        this.sections = document.querySelectorAll('section[id]');
        this.navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        this.init();
    }

    init() {
        this.setupSmoothScrolling();
        this.setupActiveSection();
        this.setupMobileNavigation();
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = anchor.getAttribute('href');
                
                if (target && target !== '#') {
                    Utils.smoothScroll(target);
                    
                    // Cerrar navbar en móvil
                    this.closeMobileNav();
                }
            });
        });
    }

    setupActiveSection() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                    this.updateActiveNavLink(entry.target.id);
                }
            });
        }, {
            threshold: [0.3],
            rootMargin: '-80px 0px -80px 0px'
        });

        this.sections.forEach(section => observer.observe(section));
    }

    updateActiveNavLink(sectionId) {
        // Remover clase activa de todos los enlaces
        this.navLinks.forEach(link => link.classList.remove('active'));
        
        // Añadir clase activa al enlace correspondiente
        const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        this.activeSection = sectionId;
    }

    setupMobileNavigation() {
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');
        
        if (navbarToggler && navbarCollapse) {
            // Cerrar nav al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.navbar') && navbarCollapse.classList.contains('show')) {
                    this.closeMobileNav();
                }
            });
            
            // Cerrar nav al presionar ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && navbarCollapse.classList.contains('show')) {
                    this.closeMobileNav();
                }
            });
        }
    }

    closeMobileNav() {
        const navbarCollapse = document.querySelector('.navbar-collapse');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) {
                bsCollapse.hide();
            }
        }
    }
}

// ========== MANEJADOR DE FORMULARIO ==========
class FormHandler {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.btnText = this.submitBtn?.querySelector('.btn-text');
        this.isSubmitting = false;
        this.validationRules = {
            name: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            },
            subject: {
                maxLength: 100
            },
            message: {
                required: true,
                minLength: 10,
                maxLength: 1000
            }
        };
        this.init();
    }

    init() {
        if (!this.form) return;
        
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Validación en tiempo real
        this.form.querySelectorAll('input, textarea').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', Utils.debounce(() => {
                this.clearErrors(field);
                if (field.value.trim()) {
                    this.validateField(field);
                }
            }, 300));
        });
        
        // Prevenir envío múltiple
        this.form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.handleSubmit(e);
            }
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        const rules = this.validationRules[fieldName];
        
        if (!rules) return true;
        
        // Limpiar errores previos
        this.clearErrors(field);
        
        // Validar campo requerido
        if (rules.required && !value) {
            this.showFieldError(field, `El campo ${this.getFieldLabel(fieldName)} es requerido`);
            return false;
        }
        
        // Si el campo está vacío y no es requerido, es válido
        if (!value && !rules.required) return true;
        
        // Validar longitud mínima
        if (rules.minLength && value.length < rules.minLength) {
            this.showFieldError(field, `Mínimo ${rules.minLength} caracteres`);
            return false;
        }
        
        // Validar longitud máxima
        if (rules.maxLength && value.length > rules.maxLength) {
            this.showFieldError(field, `Máximo ${rules.maxLength} caracteres`);
            return false;
        }
        
        // Validar patrón
        if (rules.pattern && !rules.pattern.test(value)) {
            let message = '';
            switch (fieldName) {
                case 'email':
                    message = 'Por favor ingresa un email válido';
                    break;
                case 'name':
                    message = 'Solo se permiten letras y espacios';
                    break;
                default:
                    message = 'Formato inválido';
            }
            this.showFieldError(field, message);
            return false;
        }
        
        return true;
    }

    getFieldLabel(fieldName) {
        const labels = {
            name: 'nombre',
            email: 'email',
            subject: 'asunto',
            message: 'mensaje'
        };
        return labels[fieldName] || fieldName;
    }

    showFieldError(field, message) {
        field.classList.add('is-invalid');
        const errorDiv = document.getElementById(field.name + 'Error');
        if (errorDiv) {
            errorDiv.textContent = message;
        }
    }

    clearErrors(field) {
        field.classList.remove('is-invalid');
        const errorDiv = document.getElementById(field.name + 'Error');
        if (errorDiv) {
            errorDiv.textContent = '';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;
        
        // Validar todos los campos
        const fields = this.form.querySelectorAll('input[required], textarea[required], input[name], textarea[name]');
        let isFormValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });
        
        if (!isFormValid) {
            this.showFormMessage('Por favor corrige los errores antes de enviar', 'error');
            this.focusFirstError();
            return;
        }
        
        // Procesar envío
        await this.processSubmission();
    }

    focusFirstError() {
        const firstError = this.form.querySelector('.is-invalid');
        if (firstError) {
            firstError.focus();
        }
    }

    async processSubmission() {
        this.isSubmitting = true;
        this.setSubmitState('loading');
        
        try {
            // Recopilar datos del formulario
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData.entries());
            
            // Sanitizar datos
            Object.keys(data).forEach(key => {
                data[key] = Utils.sanitizeText(data[key]);
            });
            
            // Simular envío (en producción, hacer llamada real al servidor)
            await this.simulateFormSubmission(data);
            
            this.setSubmitState('success');
            this.showFormMessage('¡Mensaje enviado correctamente! Te contactaré pronto.', 'success');
            this.form.reset();
            
        } catch (error) {
            console.error('Error al enviar formulario:', error);
            this.setSubmitState('error');
            this.showFormMessage('Error al enviar el mensaje. Por favor intenta nuevamente.', 'error');
        } finally {
            this.isSubmitting = false;
            // Resetear botón después de 3 segundos
            setTimeout(() => this.setSubmitState('default'), 3000);
        }
    }

    async simulateFormSubmission(data) {
        // Simular tiempo de procesamiento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // En producción, aquí iría:
        /*
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Error en el servidor');
        }
        
        return await response.json();
        */
        
        // Simular éxito
        return { success: true };
    }

    setSubmitState(state) {
        if (!this.submitBtn) return;
        
        switch (state) {
            case 'loading':
                this.submitBtn.disabled = true;
                this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i><span class="btn-text">Enviando...</span>';
                break;
            
            case 'success':
                this.submitBtn.innerHTML = '<i class="fas fa-check me-2"></i><span class="btn-text">¡Enviado!</span>';
                break;
            
            case 'error':
                this.submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i><span class="btn-text">Error</span>';
                break;
            
            default:
                this.submitBtn.disabled = false;
                this.submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i><span class="btn-text">Enviar Mensaje</span>';
                break;
        }
    }

    showFormMessage(message, type) {
        // Remover mensaje anterior si existe
        const existingMessage = document.getElementById('form-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Crear nuevo mensaje
        const messageDiv = document.createElement('div');
        messageDiv.id = 'form-message';
        messageDiv.className = `alert ${type === 'success' ? 'alert-success' : 'alert-danger'}`;
        messageDiv.style.cssText = `
            margin-top: 1rem;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            font-weight: 500;
            opacity: 0;
            transition: opacity 0.3s ease;
            background-color: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
        `;
        
        messageDiv.textContent = message;
        this.form.appendChild(messageDiv);
        
        // Mostrar mensaje con animación
        requestAnimationFrame(() => {
            messageDiv.style.opacity = '1';
        });
        
        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }
}

// ========== MONITOR DE PERFORMANCE ==========
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            interactionTime: 0
        };
        this.init();
    }

    init() {
        this.measureLoadTime();
        this.measureRenderTime();
        this.setupPerformanceObserver();
    }

    measureLoadTime() {
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            this.metrics.loadTime = loadTime;
            console.log(`⚡ Tiempo de carga: ${loadTime.toFixed(2)}ms`);
        });
    }

    measureRenderTime() {
        const renderStart = performance.now();
        requestAnimationFrame(() => {
            const renderTime = performance.now() - renderStart;
            this.metrics.renderTime = renderTime;
            console.log(`🎨 Tiempo de render: ${renderTime.toFixed(2)}ms`);
        });
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Observar Core Web Vitals
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    switch (entry.entryType) {
                        case 'largest-contentful-paint':
                            console.log(`📊 LCP: ${entry.startTime.toFixed(2)}ms`);
                            break;
                        case 'first-input':
                            console.log(`⚡ FID: ${entry.processingStart - entry.startTime}ms`);
                            break;
                        case 'layout-shift':
                            if (!entry.hadRecentInput) {
                                console.log(`📐 CLS: ${entry.value}`);
                            }
                            break;
                    }
                }
            });

            try {
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
            } catch (e) {
                console.warn('PerformanceObserver no soportado completamente');
            }
        }
    }

    getMetrics() {
        return { ...this.metrics };
    }
}

// ========== INICIALIZACIÓN ==========
class App {
    constructor() {
        this.components = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    start() {
        if (this.isInitialized) return;
        
        try {
            // Inicializar loading screen
            const loadingScreen = new LoadingScreen();
            
            // Configurar event listeners globales
            this.setupGlobalEventListeners();
            
            // Configurar manejo de errores
            this.setupErrorHandling();
            
            this.isInitialized = true;
            console.log('🚀 Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error al inicializar la aplicación:', error);
            this.handleInitializationError(error);
        }
    }

    setupGlobalEventListeners() {
        // Manejo de resize optimizado
        window.addEventListener('resize', Utils.debounce(() => {
            // Recalcular dimensiones si es necesario
            document.dispatchEvent(new CustomEvent('windowResize'));
        }, 250));

        // Manejo de cambio de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('orientationChange'));
            }, 100);
        });

        // Manejo de visibilidad de página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pausar animaciones costosas cuando la página no es visible
                document.dispatchEvent(new CustomEvent('pageHidden'));
            } else {
                document.dispatchEvent(new CustomEvent('pageVisible'));
            }
        });
    }

    setupErrorHandling() {
        // Manejo de errores JavaScript globales
        window.addEventListener('error', (event) => {
            console.error('Error JavaScript:', event.error);
            this.reportError(event.error);
        });

        // Manejo de promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesa rechazada:', event.reason);
            this.reportError(event.reason);
        });
    }

    reportError(error) {
        // En producción, aquí se podría enviar el error a un servicio de logging
        if (process?.env?.NODE_ENV === 'production') {
            // Enviar a servicio de logging como Sentry, LogRocket, etc.
        }
    }

    handleInitializationError(error) {
        // Mostrar mensaje de error al usuario de forma elegante
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            z-index: 10000;
            font-family: system-ui, sans-serif;
        `;
        errorMessage.innerHTML = `
            <h3>Error de Inicialización</h3>
            <p>Por favor, recarga la página</p>
            <button onclick="window.location.reload()" style="
                background: white;
                color: #ef4444;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                margin-top: 1rem;
                cursor: pointer;
            ">Recargar</button>
        `;
        document.body.appendChild(errorMessage);
    }

    destroy() {
        // Limpiar componentes y event listeners
        this.components.forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        this.components = [];
        this.isInitialized = false;
    }
}

// ========== SERVICE WORKER (PWA) ==========
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ SW registrado:', registration.scope);
            })
            .catch(error => {
                console.warn('❌ SW falló:', error);
            });
    });
}

// ========== INICIALIZACIÓN GLOBAL ==========
const app = new App();

// Exponer utilidades globalmente para debugging
if (typeof window !== 'undefined') {
    window.PortfolioApp = {
        app,
        utils: Utils,
        config: CONFIG
    };
}