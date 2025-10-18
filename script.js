/**
 * Using an IIFE to encapsulate the script, protecting the global scope.
 */
(() => {
    document.addEventListener('DOMContentLoaded', function() {

        // --- Constants for better maintainability ---
        const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfORVDofJgMwLiBp71S_z7G4hz7_K7mIJ1iH-6YVNCVDmRayw/formResponse';
        const MOBILE_BREAKPOINT = '(max-width: 768px)';

        /**
         * ===================================
         * === DUAL-ACTION SIGNUP LOGIC (MODAL + SCROLL) ===
         * ===================================
         */
        const primaryCtaButton = document.getElementById('cta-primary');
        const signupModal = document.getElementById('signup-modal');
        const desktopForm = document.getElementById('pioneer-form');
        const modalForm = document.getElementById('modal-pioneer-form');
        const formStatusAnnouncer = document.getElementById('form-status');

        function openModal() {
            if (!signupModal) return;
            signupModal.hidden = false;
            document.body.style.overflow = 'hidden';
            signupModal.querySelector('input, button').focus();
        }

        function closeModal() {
            if (!signupModal) return;
            signupModal.hidden = true;
            document.body.style.overflow = '';
            primaryCtaButton?.focus();
        }

        if (primaryCtaButton) {
            primaryCtaButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.matchMedia(MOBILE_BREAKPOINT).matches) {
                    openModal();
                } else {
                    document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }

        if (signupModal) {
            signupModal.addEventListener('click', (e) => {
                if (e.target.dataset.action === 'close-modal') closeModal();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !signupModal.hidden) closeModal();
            });
        }

        /**
         * ===================================
         * === UNIFIED FORM SUBMISSION LOGIC ===
         * ===================================
         */
        const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

        function showError(input, message) {
            const formGroup = input.closest('.form-group');
            const errorElement = formGroup.querySelector('.error-message');
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
                // A11y Enhancement: Link error message to input
                input.setAttribute('aria-invalid', 'true');
                input.setAttribute('aria-describedby', errorElement.id);
            }
        }

        function hideAllErrors(form) {
            form.querySelectorAll('.error-message').forEach(el => {
                el.textContent = '';
                el.style.display = 'none';
            });
            form.querySelectorAll('[aria-invalid]').forEach(input => {
                input.setAttribute('aria-invalid', 'false');
                input.removeAttribute('aria-describedby');
            });
        }

        async function handleFormSubmit(event) {
            event.preventDefault();
            const form = event.target;
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            let isValid = true;

            if (form.querySelector('.honeypot')?.value) {
                console.warn('Bot submission detected and blocked.');
                return;
            }

            hideAllErrors(form);
            const nameInput = form.querySelector('input[type="text"]');
            const emailInput = form.querySelector('input[type="email"]');
            const phoneInput = form.querySelector('input[type="tel"]');

            if (!nameInput.value.trim()) { showError(nameInput, 'الرجاء إدخال اسمك.'); isValid = false; }
            if (!validateEmail(emailInput.value)) { showError(emailInput, 'الرجاء إدخال بريد إلكتروني صالح.'); isValid = false; }
            if (phoneInput.value.trim().length < 5) { showError(phoneInput, 'الرجاء إدخال رقم هاتف صالح.'); isValid = false; }
            if (!isValid) return;

            submitButton.disabled = true;
            submitButton.textContent = 'جاري الإرسال...';
            formStatusAnnouncer.textContent = 'جاري إرسال النموذج...';

            try {
                await fetch(GOOGLE_FORM_URL, {
                    method: 'POST',
                    body: new FormData(form),
                    mode: 'no-cors'
                });

                const formWrapper = form.closest('#form-wrapper, #modal-form-wrapper');
                const thankYouMessage = formWrapper.nextElementSibling;
                formWrapper.style.display = 'none';
                thankYouMessage.style.display = 'block';
                formStatusAnnouncer.textContent = 'تم تسجيل اهتمامك بنجاح. شكراً لك!';

            } catch (error) {
                console.error('Form submission error:', error);
                formStatusAnnouncer.textContent = 'حدث خطأ أثناء الإرسال. الرجاء المحاولة مرة أخرى.';
                alert('حدث خطأ. الرجاء المحاولة مرة أخرى.');
            } finally {
                if (form.closest('#form-wrapper')?.style.display !== 'none') {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        }

        desktopForm?.addEventListener('submit', handleFormSubmit);
        modalForm?.addEventListener('submit', handleFormSubmit);

        /**
         * ===================================
         * === PAGE ANIMATIONS & INTERACTIONS ===
         * ===================================
         */

        // --- FADE-UP SECTIONS ON SCROLL ---
        const sectionsToFade = document.querySelectorAll('.fade-up-section');
        const sectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        sectionsToFade.forEach(section => sectionObserver.observe(section));

        // --- FAQ ACCORDION ---
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            // A11y Enhancement: Set initial ARIA state
            question.setAttribute('aria-expanded', 'false');

            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all other items first
                faqItems.forEach(i => {
                    i.classList.remove('active');
                    i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                });

                // UX Enhancement: Toggle the current item
                if (!isActive) {
                    item.classList.add('active');
                    question.setAttribute('aria-expanded', 'true');
                }
            });
        });

        // --- MOBILE MOSAIC SLIDER PAGINATION ---
        const slider = document.getElementById('card-slider');
        const pagination = document.getElementById('slider-pagination');
        if (slider && pagination) {
            const cards = slider.querySelectorAll('.tile');
            if (cards.length > 0) {
                // Performance Enhancement: Cache the dots
                const dots = [];
                cards.forEach((_, index) => {
                    const dot = document.createElement('div');
                    dot.classList.add('dot');
                    if (index === 0) dot.classList.add('active');
                    pagination.appendChild(dot);
                    dots.push(dot); // Store dot in cache
                });

                const updateDots = () => {
                    const sliderCenter = slider.scrollLeft + slider.clientWidth / 2;
                    let closestCardIndex = 0;
                    let minDistance = Infinity;

                    cards.forEach((card, index) => {
                        const cardCenter = card.offsetLeft + card.clientWidth / 2;
                        const distance = Math.abs(sliderCenter - cardCenter);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestCardIndex = index;
                        }
                    });

                    dots.forEach((dot, index) => {
                        dot.classList.toggle('active', index === closestCardIndex);
                    });
                };

                slider.addEventListener('scroll', updateDots, { passive: true });
                updateDots(); // Initial call
            }
        }
    });

    /**
     * ===================================
     * === HERO BACKGROUND PARALLAX (Mobile Only) ===
     * ===================================
     */
    const hero = document.querySelector('.hero');
    if (window.matchMedia('(max-width: 768px)').matches && hero) {
        let isTicking = false;

        const handleParallax = () => {
            const offset = window.scrollY * 0.3;
            hero.style.backgroundPositionY = `${offset}px`;
            isTicking = false;
        };

        window.addEventListener('scroll', () => {
            if (!isTicking) {
                // Performance Enhancement: Use requestAnimationFrame for smooth animation
                window.requestAnimationFrame(handleParallax);
                isTicking = true;
            }
        }, { passive: true });
    }

})(); // End of IIFE