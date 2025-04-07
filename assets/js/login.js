document.addEventListener("DOMContentLoaded", () => {
    function loadComponent(id, file) {
        fetch(file)
            .then(response => response.text())
            .then(data => {
                document.getElementById(id).innerHTML = data;
                attachNavbarEventListeners();
            });
    }

    // function attachNavbarEventListeners() {
    //     const logoutBtn = document.getElementById("logoutBtn");
    //     if (logoutBtn) {
    //         logoutBtn.addEventListener("click", () => {
    //             localStorage.clear();
    //             window.location.href = "../index.html";
    //         });
    //     }
    // }

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
        // const currentPath = window.location.pathname;
        // const navLinks = document.querySelectorAll("nav ul li a");
        // navLinks.forEach(link => {
        //     if (currentPath.endsWith(link.getAttribute("href"))) {
        //         link.classList.add("active");
        //     }
        // });
    }

    document.getElementById('togglePassword').addEventListener('click', function () {
        const passwordInput = document.getElementById('password');
        const icon = this.querySelector('i');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    loadComponent("footer", "../components/footer.html");
    setTimeout(highlightActiveLink, 100);
});