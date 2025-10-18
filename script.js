/**
 * Using an IIFE to encapsulate the script, protecting the global scope.
 */
(() => {
    // --- Constants for better maintainability ---
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfORVDofJgMwLiBp71S_z7G4hz7_K7mIJ1iH-6YVNCVDmRayw/formResponse';
    const MOBILE_BREAKPOINT = '(max-width: 768px)';

    /**
     * ===================================
     * === UTILITY FUNCTIONS ===
     * ===================================
     */

    /**
     * Throttles a function to limit how often it can be called.
     * @param {Function} func The function to throttle.
     * @param {number} limit The minimum time in milliseconds between invocations.
     * @returns {Function} The throttled function.
     */
    const throttle = (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    /**
     * Validates an email address.
     * @param {string} email The email to validate.
     * @returns {boolean} True if the email is valid.
     */
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());


    /**
     * ===================================
     * === DOM ELEMENT SELECTORS ===
     * ===================================
     */
    const primaryCtaButton = document.getElementById('cta-primary');
    const signupModal = document.getElementById('signup-modal');
    const desktopForm = document.getElementById('pioneer-form');
    const modalForm = document.getElementById('modal-pioneer-form');
    const formStatusAnnouncer = document.getElementById('form-status');
    const fadeUpSections = document.querySelectorAll('.fade-up-section');
    const faqItems = document.querySelectorAll('.faq-item');
    const mosaicSlider = document.getElementById('card-slider');
    const sliderPagination = document.getElementById('slider-pagination');
    let lastActiveElement; // For restoring focus after modal closes


    /**
     * ===================================
     * === MODAL LOGIC & ACCESSIBILITY ===
     * ===================================
     */
    function openModal() {
        if (!signupModal) return;
        lastActiveElement = document.activeElement; // Store focus
        signupModal.hidden = false;
        document.body.style.overflow = 'hidden';
        signupModal.querySelector('input, button').focus(); // Focus first element in modal
    }

    function closeModal() {
        if (!signupModal) return;
        signupModal.hidden = true;
        document.body.style.overflow = '';
        if (lastActiveElement) {
            lastActiveElement.focus(); // Restore focus
        }
    }

    /**
     * Traps focus within the modal when it's open.
     * @param {KeyboardEvent} e The keyboard event.
     */
    function handleModalFocus(e) {
        if (signupModal.hidden || e.key !== 'Tab') return;

        const focusableElements = signupModal.querySelectorAll('button, input');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else { // Tab
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }


    /**
     * ===================================
     * === UNIFIED FORM SUBMISSION LOGIC ===
     * ===================================
     */
    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            input.setAttribute('aria-invalid', 'true');
            input.setAttribute('aria-describedby', errorElement.id || (errorElement.id = `error-${input.id}`));
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
            // The 'no-cors' mode means we won't get a response back, but the submission will go through.
            // This is standard practice for submitting to Google Forms via fetch.
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
            // Only re-enable the button if the submission failed and the form is still visible
            if (form.closest('#form-wrapper')?.style.display !== 'none') {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        }
    }


    /**
     * ===================================
     * === PAGE ANIMATIONS & INTERACTIONS ===
     * ===================================
     */
    function setupScrollAnimations() {
        const sectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        fadeUpSections.forEach(section => sectionObserver.observe(section));
    }

    function setupFaqAccordion() {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.setAttribute('aria-expanded', 'false'); // Set initial state for A11y

            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all other items for a classic accordion behavior
                faqItems.forEach(i => {
                    i.classList.remove('active');
                    i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                });

                // Toggle the current item
                if (!isActive) {
                    item.classList.add('active');
                    question.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    function setupMosaicSlider() {
        if (mosaicSlider && sliderPagination) {
            const cards = mosaicSlider.querySelectorAll('.tile');
            if (cards.length > 0) {
                const dots = Array.from(cards).map((_, index) => {
                    const dot = document.createElement('div');
                    dot.classList.add('dot');
                    if (index === 0) dot.classList.add('active');
                    sliderPagination.appendChild(dot);
                    return dot;
                });

                const updateDots = () => {
                    const sliderCenter = mosaicSlider.scrollLeft + mosaicSlider.clientWidth / 2;
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

                // PERFORMANCE ENHANCEMENT: Throttle the scroll event listener
                mosaicSlider.addEventListener('scroll', throttle(updateDots, 100), { passive: true });
                updateDots(); // Initial call
            }
        }
    }

    /**
     * ===================================
     * === INITIALIZATION ===
     * ===================================
     */
    function init() {
        // Setup CTA button (Modal vs. Scroll)
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

        // Setup Modal closing events
        if (signupModal) {
            signupModal.addEventListener('click', (e) => {
                if (e.target.dataset.action === 'close-modal') closeModal();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !signupModal.hidden) closeModal();
                handleModalFocus(e); // Handle focus trapping
            });
        }

        // Attach form submission handlers
        desktopForm?.addEventListener('submit', handleFormSubmit);
        modalForm?.addEventListener('submit', handleFormSubmit);

        // Initialize UI components
        setupScrollAnimations();
        setupFaqAccordion();
        setupMosaicSlider();
    }

    // Run initialization logic after the DOM is fully loaded.
    document.addEventListener('DOMContentLoaded', init);

})(); // End of IIFE