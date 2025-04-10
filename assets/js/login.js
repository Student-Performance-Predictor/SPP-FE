document.addEventListener("DOMContentLoaded", () => {

    // LOGIN BUTTON HANDLER
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        const loginForm = document.querySelector(".login-form");
        if (loginForm) {
            loginForm.addEventListener("submit", function (event) {
                event.preventDefault();

                const usernameField = document.getElementById("teacherId")?.value || "";
                const passwordField = document.getElementById("password")?.value || "";

                if (!usernameField || !passwordField) {
                    alert("Please enter both Teacher ID and Password.");
                    return;
                }

                if(usernameField==="admin" && passwordField==="Admin@123") {
                    window.location.href = "./admin/schools.html";
                }
                else {
                    alert("User not Found");
                }
            });
        }
    }

    // PASSWORD TOGGLE HANDLER
    const togglePasswordBtn = document.getElementById("togglePassword");
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener("click", function () {
            const passwordInput = document.getElementById("password");
            const icon = this.querySelector("i");

            if (passwordInput && icon) {
                if (passwordInput.type === "password") {
                    passwordInput.type = "text";
                    icon.classList.replace("fa-eye", "fa-eye-slash");
                } else {
                    passwordInput.type = "password";
                    icon.classList.replace("fa-eye-slash", "fa-eye");
                }
            }
        });
    }

    function loadComponent(id, file, callback) {
        fetch(file)
            .then(response => response.text())
            .then(data => {
                const element = document.getElementById(id);
                if (element) {
                    element.innerHTML = data;
                    if (callback) callback();
                }
            })
            .catch(error => console.error("Component load error:", error));
    }

    function highlightActiveLink() {
        const footer = document.querySelector("footer");
        function checkScrollbar() {
            if (document.body.scrollHeight <= window.innerHeight) {
                footer?.classList.add("fixed");
            } else {
                footer?.classList.remove("fixed");
            }
        }
        checkScrollbar();
        window.addEventListener("resize", checkScrollbar);
    }

    loadComponent("footer", "../components/footer.html", highlightActiveLink);
});