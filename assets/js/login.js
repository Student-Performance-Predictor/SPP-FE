document.addEventListener("DOMContentLoaded", () => {
    const baseUrl = BE_URL;
    const loginForm = document.querySelector(".login-form");
    const emailField = document.getElementById("teacherMail");
    const passwordField = document.getElementById("password");
    const togglePasswordBtn = document.getElementById("togglePassword");

    function login() {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = emailField.value;
            const password = passwordField.value;
            if (!email || !password) {
                alert("Please enter both Teacher ID and Password.");
                return;
            }
            showLoader();
            fetch(`${baseUrl}/login/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            })
                .then(handleResponse)
                .then(data => {
                    localStorage.setItem("access_token", data.access);
                    localStorage.setItem("refresh_token", data.refresh);
                    if (data.type === "admin") {
                        window.location.href = "./admin/schools.html";
                    }
                })
                .catch(showError)
                .finally(() => {
                    hideLoader();
                });
        });
    }

    // PASSWORD TOGGLE HANDLER
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener("click", function () {
            const passwordField = document.getElementById("password");
            const icon = this.querySelector("i");

            if (passwordField && icon) {
                if (passwordField.type === "password") {
                    passwordField.type = "text";
                    icon.classList.replace("fa-eye", "fa-eye-slash");
                } else {
                    passwordField.type = "password";
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

    // Handle API response
    function handleResponse(response) {
        if (!response.ok) {
            return response.json().then(error => {
                throw error;
            });
        }
        return response.json();
    }

    // Show error messages
    function showError(error) {
        console.error("Error: ", error);
        let errorMessage = "An error occurred.";
        if (error?.response?.status === 401) {
            alert("Session expired. Redirecting to login...");
            window.location.href = "../index.html";
            return;
        }
        if (error?.error) {
            errorMessage = error.error;
        } else if (error?.message) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
    
        alert(errorMessage);
    }  

    loadComponent("footer", "../components/footer.html", highlightActiveLink);
    login();
});