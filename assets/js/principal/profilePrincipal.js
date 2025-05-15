// DOM elements
const profileImageEl = document.getElementById("profileImage");
const imageUploadEl = document.getElementById("imageUpload");
const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const phoneEl = document.getElementById("phone");
const dobEl = document.getElementById("date_of_birth");
const schoolEl = document.getElementById("school");
const addressEl = document.getElementById("address");
const cityEl = document.getElementById("city");
const stateEl = document.getElementById("state");
const pincodeEl = document.getElementById("pincode");
const currentPasswordEl = document.getElementById("current_password");
const newPasswordEl = document.getElementById("new_password");
const confirmPasswordEl = document.getElementById("confirm_password");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtnText = document.getElementById("saveBtnText");
const passwordBtnText = document.getElementById("passwordBtnText");
const loader = document.getElementById("loader");
let principalId = null;
let schoolId = null;
const baseUrl = BE_URL;

// Show/hide loader
function showLoader(show) {
    loader.style.display = show ? "block" : "none";
}

// Toggle password visibility
function togglePassword(fieldId, button) {
    const field = document.getElementById(fieldId);
    const icon = button.querySelector("i");

    if (field.type === "password") {
        field.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        field.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}

// Get access token from localStorage
function getAccessToken() {
    return localStorage.getItem("access_token");
}

// Show alert message
function showAlert(message, isError = false) {
    if (isError) {
        alert(`Error: ${message}`);
    } else {
        alert(message);
    }
}

// Fetch principal data using access token
function fetchPrincipalData() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        showAlert("Authentication required. Please login.", true);
        return;
    }

    showLoader(true);
    saveBtnText.textContent = "Loading...";

    fetch(`${baseUrl}/principal/me/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch principal data");
            }
            return response.json();
        })
        .then((data) => {
            principalId = data.id;
            schoolId = data.school_id;
            const profileImageUrl = data.profile_image
                ? `${baseUrl}/${data.profile_image}/`
                : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMggZhOIH1vXmnv0bCyBu8iEuYQO-Dw1kpp7_v2mwhw_SKksetiK0e4VWUak3pm-v-Moc&usqp=CAU";

            profileImageEl.src = profileImageUrl;
            const navbarProfileImg = document.getElementById("profileImage");
            if (navbarProfileImg) {
                navbarProfileImg.src = profileImageUrl;
            }

            // Populate other form fields
            nameEl.value = data.name || "";
            emailEl.value = data.email || "";
            phoneEl.value = data.phone || "";
            dobEl.value = data.date_of_birth || "";
            schoolEl.value = data.school || "";
            addressEl.value = data.address || "";
            cityEl.value = data.city || "";
            stateEl.value = data.state || "";
            pincodeEl.value = data.pincode || "";
        })
        .catch((error) => {
            showAlert(error.message, true);
            console.error("Error fetching principal data:", error);
        })
        .finally(() => {
            showLoader(false);
            saveBtnText.textContent = "Save Changes";
        });
}

// Handle image upload
imageUploadEl.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            profileImageEl.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Save profile changes
function saveProfileChanges() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        showAlert("Authentication required. Please login.", true);
        return;
    }

    if (!principalId) {
        showAlert("Principal ID not found", true);
        return;
    }

    showLoader(true);
    saveBtnText.textContent = "Saving...";

    const formData = new FormData();

    // Add the updated fields to formData
    formData.append("id", principalId);
    formData.append("date_of_birth", dobEl.value.split("-").reverse().join("-"));
    formData.append("name", nameEl.value);
    formData.append("email", emailEl.value);
    formData.append("phone", phoneEl.value);
    formData.append("school", schoolEl.value);
    formData.append("school_id", schoolId);
    formData.append("class_assigned", "1-8");
    formData.append("address", addressEl.value);
    formData.append("city", cityEl.value);
    formData.append("state", stateEl.value);
    formData.append("pincode", pincodeEl.value);

    // Add the image file if changed
    if (imageUploadEl.files[0]) {
        formData.append("profile_image", imageUploadEl.files[0]);
    }

    fetch(`${baseUrl}/updatePrincipal/${principalId}/`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((err) => {
                    throw new Error(err.error || "Failed to update profile");
                });
            }
            return response.json();
        })
        .then((data) => {
            showAlert(data.message || "Profile updated successfully!");

            // Update both profile images after save
            const navbarProfileImg = document.getElementById("profileImage");
            if (navbarProfileImg) {
                navbarProfileImg.src = profileImageEl.src;
            }

            fetchPrincipalData();
        })
        .catch((error) => {
            showAlert(error.message, true);
            console.error("Error updating profile:", error);
        })
        .finally(() => {
            showLoader(false);
            saveBtnText.textContent = "Save Changes";
        });
}

// Change password using dedicated updatePassword endpoint
function changePassword() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        showAlert("Authentication required. Please login.", true);
        return;
    }

    showLoader(true);
    passwordBtnText.textContent = "Updating...";

    const oldPassword = currentPasswordEl.value;
    const newPassword = newPasswordEl.value;
    const confirmPassword = confirmPasswordEl.value;

    // Validation checks
    if (!oldPassword || !newPassword || !confirmPassword) {
        showAlert("All fields are required", true);
        passwordBtnText.textContent = "Change Password";
        showLoader(false);
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert("New passwords do not match", true);
        passwordBtnText.textContent = "Change Password";
        showLoader(false);
        return;
    }

    if (oldPassword === newPassword) {
        showAlert("New password must be different from the old password", true);
        passwordBtnText.textContent = "Change Password";
        showLoader(false);
        return;
    }

    if (newPassword.length < 8) {
        showAlert("New password must be at least 8 characters long", true);
        passwordBtnText.textContent = "Change Password";
        showLoader(false);
        return;
    }

    fetch(`${baseUrl}/updatePassword/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((err) => {
                    throw new Error(err.error || "Failed to change password");
                });
            }
            return response.json();
        })
        .then((data) => {
            showAlert(data.message || "Password changed successfully!");
            // Clear password fields
            currentPasswordEl.value = "";
            newPasswordEl.value = "";
            confirmPasswordEl.value = "";
        })
        .catch((error) => {
            showAlert(error.message, true);
            console.error("Error changing password:", error);
        })
        .finally(() => {
            showLoader(false);
            passwordBtnText.textContent = "Change Password";
        });
}

// Event listeners
saveProfileBtn.addEventListener("click", saveProfileChanges);
changePasswordBtn.addEventListener("click", changePassword);
cancelBtn.addEventListener("click", () => {
    // Reset form to original values
    fetchPrincipalData();
});

document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", function () {
        const targetId = this.getAttribute("data-target");
        togglePassword(targetId, this);
    });
});

function addEventListenerFunc() {
    const currentPath = window.location.pathname.split(/[?#]/)[0];
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
        item.classList.remove("active");
    });
    navItems.forEach((item) => {
        const onclickAttr = item.getAttribute("onclick");
        if (onclickAttr) {
            const pathMatch = onclickAttr.match(
                /window\.location\.href\s*=\s*'([^']*)'/
            );
            if (pathMatch && pathMatch[1]) {
                const itemPath = new URL(pathMatch[1], window.location.origin).pathname;
                if (currentPath === itemPath) {
                    item.classList.add("active");
                }
            }
        }
    });

    // Fix footer stickiness
    const footer = document.querySelector("footer");
    if (!footer) return;
    footer.classList.toggle(
        "fixed",
        document.body.scrollHeight <= window.innerHeight
    );

    // Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.clear();
            window.location.href = "../login.html";
        });
    }
}

function toggleBarFunc() {
    const toggleBtn = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const mainContainer = document.getElementById("mainContainer");
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
            if (mainContainer) {
                mainContainer.classList.toggle("sidebar-active");
            }
        });
    } else {
        console.log("Toggle button or Sidebar not found");
    }
}

function init() {
    // Load components first
    loadComponent("../components/principals_navbar.html", "principal_navbar");
    loadComponent("../components/footer.html", "footer");

    // Wait a bit for components to load, then fetch data
    setTimeout(() => {
        fetchPrincipalData();
        addEventListenerFunc();
        toggleBarFunc();
    }, 500);
}

function loadComponent(url, elementId) {
    fetch(url)
        .then((response) => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.text();
        })
        .then((html) => {
            document.getElementById(elementId).innerHTML = html;
        })
        .catch((error) => {
            console.error(`Error loading ${elementId}:`, error);
        });
}

// Initialize the page
document.addEventListener("DOMContentLoaded", init);