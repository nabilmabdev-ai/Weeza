document.addEventListener('DOMContentLoaded', function() {

    /**
     * FADE-UP SECTIONS ON SCROLL
     * Animates sections into view when they become visible in the viewport.
     */
    const sections = document.querySelectorAll('.fade-up-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Stop observing the element once it's visible
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    }); // Trigger when 10% of the section is visible
    sections.forEach(section => observer.observe(section));


    /**
     * FAQ ACCORDION
     * Toggles the active state for FAQ items to show/hide answers.
     */
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const wasActive = item.classList.contains('active');

            // Close all other FAQ items first
            faqItems.forEach(i => i.classList.remove('active'));

            // If the clicked item was not already active, open it
            if (!wasActive) {
                item.classList.add('active');
            }
        });
    });


    /**
     * PIONEER SIGNUP FORM LOGIC
     * Handles client-side validation and submission feedback.
     */
    const form = document.getElementById('pioneer-form');
    const formWrapper = document.getElementById('form-wrapper');
    const thankYouMessage = document.getElementById('form-thank-you');

    if (form) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');

        // --- Validation Helper Functions ---
        function validateEmail(email) {
            // Simple regex for email validation
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
        }

        function showError(input, message) {
            const errorElement = input.parentElement.querySelector('.error-message');
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        }

        function hideError(input) {
            const errorElement = input.parentElement.querySelector('.error-message');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }

        // --- Form Submit Event Listener ---
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            let isValid = true;

            // Hide previous errors
            [nameInput, emailInput, phoneInput].forEach(hideError);

            // Validate Name
            if (nameInput.value.trim() === '') {
                showError(nameInput, 'الرجاء إدخال اسمك.');
                isValid = false;
            }

            // Validate Email
            if (!validateEmail(emailInput.value)) {
                showError(emailInput, 'الرجاء إدخال بريد إلكتروني صالح.');
                isValid = false;
            }

            // Validate Phone
            if (phoneInput.value.trim() === '') {
                showError(phoneInput, 'الرجاء إدخال رقم هاتفك.');
                isValid = false;
            }

            // If form is not valid, stop here
            if (!isValid) return;

            // --- Handle Form Submission (Simulated) ---
            const formData = new FormData(form);
            const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfORVDofJgMwLiBp71S_z7G4hz7_K7mIJ1iH-6YVNCVDmRayw/formResponse';

            // Post to Google Forms endpoint. 'no-cors' mode means we won't get a response,
            // but the data will be submitted. We handle errors gracefully.
            fetch(googleFormUrl, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors'
                })
                .catch(error => console.error('Form submission error:', error.message));

            // --- Show Thank You Message ---
            formWrapper.style.transition = 'opacity 0.5s ease';
            formWrapper.style.opacity = '0';

            setTimeout(() => {
                formWrapper.style.display = 'none';
                thankYouMessage.style.display = 'block';
                // Use a short delay to allow the display property to apply before changing opacity
                setTimeout(() => {
                    thankYouMessage.style.opacity = '1';
                }, 20);
            }, 500); // Match timeout to CSS transition duration
        });
    }


    /**
     * MOBILE MOSAIC SLIDER PAGINATION
     * Creates and updates pagination dots for the horizontal slider on mobile.
     */
    const slider = document.getElementById('card-slider');
    const pagination = document.getElementById('slider-pagination');

    if (slider && pagination) {
        const cards = slider.querySelectorAll('.tile');

        // Only run this logic if there are cards to paginate
        if (cards.length > 0) {
            // 1. Create dots for each card
            cards.forEach((_, index) => {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                if (index === 0) dot.classList.add('active'); // First dot is active by default
                pagination.appendChild(dot);
            });

            // 2. Function to update which dot is active
            const updateDots = () => {
                const dots = pagination.querySelectorAll('.dot');
                const sliderCenter = slider.scrollLeft + slider.clientWidth / 2;
                let closestCardIndex = 0;
                let minDistance = Infinity;

                // Find the card closest to the center of the viewport
                cards.forEach((card, index) => {
                    const cardCenter = card.offsetLeft + card.clientWidth / 2;
                    const distance = Math.abs(sliderCenter - cardCenter);

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCardIndex = index;
                    }
                });

                // Update the 'active' class on the corresponding dot
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === closestCardIndex);
                });
            };

            // 3. Add scroll event listener and run once on load
            slider.addEventListener('scroll', updateDots);
            updateDots(); // Initial call to set the correct dot on page load
        }
    }

});