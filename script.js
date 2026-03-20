// Mock global payment function if not present
        if (typeof window.__processPayment !== 'function') {
            window.__processPayment = function(amountCents, productName, productDescription) {
                console.log("Processing Mock Payment:", { amountCents, productName, productDescription });
                return new Promise(resolve => setTimeout(resolve, 1500));
            };
        }

        document.addEventListener('DOMContentLoaded', () => {
            
            // Scroll Reveal Animation
            const reveals = document.querySelectorAll('.reveal');
            const revealOptions = {
                threshold: 0.1,
                rootMargin: "0px 0px -50px 0px"
            };

            const revealOnScroll = new IntersectionObserver(function(entries, observer) {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                });
            }, revealOptions);

            reveals.forEach(reveal => {
                revealOnScroll.observe(reveal);
            });

            // Modal Logic
            const modal = document.getElementById('checkout-modal');
            const closeBtn = document.getElementById('close-modal');
            const buyButtons = document.querySelectorAll('.buy-btn');
            const paymentForm = document.getElementById('payment-form');
            
            // UI Containers
            const formContainer = document.getElementById('checkout-form-container');
            const processingContainer = document.getElementById('processing-container');
            const successContainer = document.getElementById('success-container');

            // State
            let currentTier = {};

            buyButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    currentTier = {
                        name: btn.getAttribute('data-tier'),
                        priceCents: parseInt(btn.getAttribute('data-price'), 10),
                        desc: btn.getAttribute('data-desc')
                    };

                    document.getElementById('modal-tier-name').innerText = currentTier.name;
                    document.getElementById('modal-price-display').innerText = '$' + (currentTier.priceCents / 100).toFixed(2);
                    
                    // Reset UI
                    formContainer.style.display = 'block';
                    processingContainer.style.display = 'none';
                    successContainer.style.display = 'none';
                    paymentForm.reset();

                    modal.classList.add('active');
                });
            });

            const closeModal = () => {
                modal.classList.remove('active');
            };

            closeBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            // Handle Form Submission
            paymentForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = document.getElementById('fullName').value;
                const email = document.getElementById('emailAddress').value;

                if(!name || !email) return;

                // Show processing state
                formContainer.style.display = 'none';
                processingContainer.style.display = 'block';

                try {
                    // Call the requested global function
                    await window.__processPayment(
                        currentTier.priceCents, 
                        currentTier.name, 
                        currentTier.desc
                    );

                    // Show success
                    processingContainer.style.display = 'none';
                    successContainer.style.display = 'block';
                    
                    setTimeout(() => {
                        closeModal();
                    }, 3000);

                } catch (error) {
                    alert("Payment failed. Please try again.");
                    processingContainer.style.display = 'none';
                    formContainer.style.display = 'block';
                }
            });
        });