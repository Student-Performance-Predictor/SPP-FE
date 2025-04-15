document.addEventListener("DOMContentLoaded", () => {
    function loadComponent(id, file) {
        fetch(file)
            .then(response => response.text())
            .then(data => {
                document.getElementById(id).innerHTML = data;
            });
    }

    function highlightActiveLink() {
        const footer = document.querySelector("footer");
        function checkScrollbar() {
            if (document.body.scrollHeight <= window.innerHeight) {
                footer.classList.add("fixed");
            } else {
                footer.classList.remove("fixed");
            }
        }
        checkScrollbar();
        window.addEventListener("resize", checkScrollbar);
    }

    document.querySelectorAll('#loginBtn, #heroLoginBtn, #ctaLoginBtn, .mobile-login-btn, .role-card .login-btn').forEach(button => {
        button.addEventListener('click', function () {
            window.location.href = '../login.html';
        });
    });

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenuBtn.addEventListener('click', function () {
        mobileMenu.classList.toggle('active');
    });

    const counters = document.querySelectorAll('.counter');
    function animateCounters() {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 2000; // 2 seconds
            const startTime = performance.now();

            const updateCounter = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                const value = Math.floor(progress * target);

                counter.textContent = value;

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.classList.add('counting');
                }
            };

            requestAnimationFrame(updateCounter);
        });
    }

    const statsSection = document.querySelector('.stats');
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            animateCounters();
            observer.unobserve(statsSection);
        }
    }, { threshold: 0.5 });
    observer.observe(statsSection);

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
            mobileMenu.classList.remove('active');
        });
    });

    loadComponent("footer", "../components/footer.html");
    setTimeout(highlightActiveLink, 100);
});