document.addEventListener('DOMContentLoaded', function() {

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

    // Function to open the modal
    function openModal() {
        if (!signupModal) return;
        signupModal.hidden = false;
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        // Focus on the first interactive element in the modal for accessibility
        signupModal.querySelector('input, button').focus();
    }

    // Function to close the modal
    function closeModal() {
        if (!signupModal) return;
        signupModal.hidden = true;
        document.body.style.overflow = ''; // Restore scrolling
        // Return focus to the button that opened the modal
        primaryCtaButton.focus();
    }

    // Main CTA button logic
    if (primaryCtaButton) {
        primaryCtaButton.addEventListener('click', (e) => {
            e.preventDefault();
            // On smaller screens (mobile), open the modal
            if (window.matchMedia('(max-width: 768px)').matches) {
                openModal();
            } else {
                // On larger screens (desktop), scroll to the form section
                const signupSection = document.getElementById('signup');
                if (signupSection) {
                    signupSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }

    // Add event listeners to close the modal
    if (signupModal) {
        signupModal.addEventListener('click', (e) => {
            // Close if the backdrop or a specific close button is clicked
            if (e.target.dataset.action === 'close-modal') {
                closeModal();
            }
        });
        // Close with the Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !signupModal.hidden) {
                closeModal();
            }
        });
    }


    /**
     * ===================================
     * === UNIFIED FORM SUBMISSION LOGIC ===
     * ===================================
     */

    // --- Validation Helper Functions ---
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function hideAllErrors(form) {
        form.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }

    // --- Main Submission Handler ---
    async function handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        let isValid = true;

        // 1. Check honeypot for bots
        if (form.querySelector('.honeypot')?.value) {
            console.warn('Bot submission detected and blocked.');
            return; // Silently fail
        }

        // 2. Hide previous errors and validate fields
        hideAllErrors(form);
        const nameInput = form.querySelector('input[name*="entry."][type="text"]');
        const emailInput = form.querySelector('input[type="email"]');
        const phoneInput = form.querySelector('input[type="tel"]');

        if (!nameInput.value.trim()) { showError(nameInput, 'الرجاء إدخال اسمك.'); isValid = false; }
        if (!validateEmail(emailInput.value)) { showError(emailInput, 'الرجاء إدخال بريد إلكتروني صالح.'); isValid = false; }
        if (phoneInput.value.trim().length < 5) { showError(phoneInput, 'الرجاء إدخال رقم هاتف صالح.'); isValid = false; }
        if (!isValid) return;

        // 3. Update UI to loading state
        submitButton.disabled = true;
        submitButton.textContent = 'جاري الإرسال...';
        formStatusAnnouncer.textContent = 'جاري إرسال النموذج...';

        // 4. Submit the data
        const formData = new FormData(form);
        const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfORVDofJgMwLiBp71S_z7G4hz7_K7mIJ1iH-6YVNCVDmRayw/formResponse';

        try {
            // Using fetch in 'no-cors' mode. We won't get a response, but the data will be sent.
            await fetch(googleFormUrl, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            });

            // 5. Handle success UI
            const formWrapper = form.closest('#form-wrapper, #modal-form-wrapper');
            const thankYouMessage = formWrapper.nextElementSibling; // Assumes thank you div is next sibling

            formWrapper.style.display = 'none';
            thankYouMessage.style.display = 'block';
            formStatusAnnouncer.textContent = 'تم تسجيل اهتمامك بنجاح. شكراً لك!';

        } catch (error) {
            // 6. Handle error UI
            console.error('Form submission error:', error);
            formStatusAnnouncer.textContent = 'حدث خطأ أثناء الإرسال. الرجاء المحاولة مرة أخرى.';
            alert('حدث خطأ. الرجاء المحاولة مرة أخرى.'); // Simple fallback alert
        
        } finally {
            // 7. Reset button state regardless of outcome (unless on success, where it's hidden)
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }

    // Attach the handler to both forms
    desktopForm?.addEventListener('submit', handleFormSubmit);
    modalForm?.addEventListener('submit', handleFormSubmit);


    /**
     * ===================================
     * === PAGE ANIMATIONS & INTERACTIONS ===
     * ===================================
     */

    // --- FADE-UP SECTIONS ON SCROLL ---
    const sections = document.querySelectorAll('.fade-up-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    sections.forEach(section => observer.observe(section));

    // --- FAQ ACCORDION ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const wasActive = item.classList.contains('active');
            faqItems.forEach(i => i.classList.remove('active'));
            if (!wasActive) {
                item.classList.add('active');
            }
        });
    });

    // --- MOBILE MOSAIC SLIDER PAGINATION ---
    const slider = document.getElementById('card-slider');
    const pagination = document.getElementById('slider-pagination');
    if (slider && pagination) {
        const cards = slider.querySelectorAll('.tile');
        if (cards.length > 0) {
            cards.forEach((_, index) => {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                if (index === 0) dot.classList.add('active');
                pagination.appendChild(dot);
            });

            const updateDots = () => {
                const dots = pagination.querySelectorAll('.dot');
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
            updateDots();
        }
    }
});