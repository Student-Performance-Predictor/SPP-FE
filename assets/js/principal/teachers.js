document.addEventListener("DOMContentLoaded", function () {
    const baseUrl = BE_URL;
    const token = localStorage.getItem("access_token");
    const teachersTableBody = document.getElementById("teachersTableBody");
    const addTeacherBtn = document.getElementById("addTeacherBtn");
    const viewModal = document.getElementById("viewTeacherModal");
    const formModal = document.getElementById("teacherModal");
    const deleteModal = document.getElementById("deleteModal");
    const closeButtons = document.querySelectorAll(".close-btn");
    const cancelTeacherBtn = document.getElementById("cancelTeacherBtn");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    const searchInput = document.getElementById("searchInput");
    const teacherForm = document.getElementById("teacherForm");
    const classDropdown = document.getElementById("assignedClass");
    let teachers = [];
    let currentTeacherId = null;
    let principalData = [];

    // Initialize the page
    function init() {
        setTimeout(fetchPrincipal, 100);
        loadComponent("../components/principals_navbar.html", "principal_navbar");
        loadComponent("../components/footer.html", "footer");
        fetchTeachers();
        setupEventListeners();
        setTimeout(addEventListenerFunc, 1000);
        setTimeout(toggleBarFunc, 1000);
        populateClassDropdown();
    }

    // Generalized component loader
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

    function fetchPrincipal() {
        showLoader();
        fetch(`${baseUrl}/principal/me/`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then(handleResponse)
            .then((data) => {
                const profileImageUrl = data.profile_image
                    ? `${baseUrl}${data.profile_image}/`
                    : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMggZhOIH1vXmnv0bCyBu8iEuYQO-Dw1kpp7_v2mwhw_SKksetiK0e4VWUak3pm-v-Moc&usqp=CAU";

                const navbarProfileImg = document.getElementById("profileImage");
                if (navbarProfileImg) {
                    navbarProfileImg.src = profileImageUrl;
                }
                principalData = data;
            })
            .catch(showError)
            .finally(() => {
                hideLoader();
            });
    }

    // Fetch all teachers from API
    function fetchTeachers() {
        showLoader();
        fetch(`${baseUrl}/getAllSchoolTeachers/`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then(handleResponse)
            .then((data) => {
                teachers = data.map((teacher) => ({
                    id: teacher.id,
                    name: teacher.name,
                    email: teacher.email,
                    phone: teacher.phone,
                    date_of_birth: teacher.date_of_birth,
                    address: teacher.address,
                    city: teacher.city,
                    state: teacher.state,
                    pincode: teacher.pincode,
                    class_assigned: teacher.class_assigned,
                    school: teacher.school,
                    school_id: teacher.school_id,
                }));
                renderTeachersTable();
            })
            .catch(showError)
            .finally(() => {
                hideLoader();
            });
    }

    // Fetch a specific teacher
    function fetchTeacher(teacherId) {
        showLoader();
        return fetch(`${baseUrl}/viewTeacher/${teacherId}/`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then(handleResponse)
            .catch(showError)
            .finally(() => {
                hideLoader();
            });
    }

    // Populate class dropdown
    function populateClassDropdown() {
        classDropdown.innerHTML = '<option value="">Select Class</option>';
        // Add class options 1-8
        for (let i = 1; i <= 8; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = "Class " + i;
            classDropdown.appendChild(option);
        }
    }

    // Render teachers table
    function renderTeachersTable(filteredTeachers = null) {
        const teachersData = filteredTeachers || teachers;
        const data = teachersData.sort((a,b) => a.class_assigned - b.class_assigned);
        teachersTableBody.innerHTML = "";

        if (data.length === 0) {
            document.getElementById("emptyState").style.display = "block";
            return;
        }

        document.getElementById("emptyState").style.display = "none";

        data.forEach((teacher, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${teacher.name}</td>
                <td>${teacher.email}</td>
                <td>${teacher.phone}</td>
                <td>${teacher.class_assigned
                    ? "Class " + teacher.class_assigned
                    : "Not assigned"
                }</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-success btn-sm view-btn" data-id="${teacher.id
                }">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-secondary btn-sm edit-btn" data-id="${teacher.id
                }">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${teacher.id
                }">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            teachersTableBody.appendChild(row);
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Search functionality
        searchInput.addEventListener("keyup", () => {
            const filter = searchInput.value.toLowerCase();
            const filteredTeachers = teachers.filter(
                (teacher) =>
                    teacher.name.toLowerCase().includes(filter) ||
                    teacher.email.toLowerCase().includes(filter) ||
                    teacher.phone.toLowerCase().includes(filter) ||
                    ("Class " + teacher.class_assigned)
                        .toLowerCase()
                        .includes(String(filter).toLowerCase())
            );
            renderTeachersTable(filteredTeachers);
        });

        // Add Teacher
        addTeacherBtn.addEventListener("click", () => {
            document.getElementById("modalTitle").textContent = "Add New Teacher";
            teacherForm.reset();
            document.getElementById("teacherId").value = "";
            formModal.style.display = "flex";
        });

        // View Teacher (using event delegation)
        document.addEventListener("click", (e) => {
            if (e.target.closest(".view-btn")) {
                const teacherId = parseInt(
                    e.target.closest(".view-btn").getAttribute("data-id")
                );
                fetchTeacher(teacherId)
                    .then((teacher) => {
                        if (teacher) {
                            populateViewModal(teacher);
                            viewModal.style.display = "flex";
                        }
                    })
                    .catch(showError);
            }
        });

        // Edit Teacher (using event delegation)
        document.addEventListener("click", (e) => {
            if (e.target.closest(".edit-btn")) {
                const teacherId = parseInt(
                    e.target.closest(".edit-btn").getAttribute("data-id")
                );
                currentTeacherId = teacherId;
                fetchTeacher(teacherId)
                    .then((teacher) => {
                        if (teacher) {
                            document.getElementById("modalTitle").textContent =
                                "Edit Teacher";
                            populateForm(teacher);
                            formModal.style.display = "flex";
                        }
                    })
                    .catch(showError);
            }
        });

        // Delete Teacher (using event delegation)
        document.addEventListener("click", (e) => {
            if (e.target.closest(".delete-btn")) {
                currentTeacherId = parseInt(
                    e.target.closest(".delete-btn").getAttribute("data-id")
                );
                deleteModal.style.display = "flex";
            }
        });

        // Save Teacher
        teacherForm.addEventListener("submit", (e) => {
            e.preventDefault();
            saveTeacher();
        });

        // Confirm Delete
        confirmDeleteBtn.addEventListener("click", () => {
            deleteTeacher(currentTeacherId);
            deleteModal.style.display = "none";
        });

        // Close modals
        closeButtons.forEach((button) => {
            button.addEventListener(
                "click",
                () => (button.closest(".modal").style.display = "none")
            );
        });

        cancelTeacherBtn.addEventListener(
            "click",
            () => (formModal.style.display = "none")
        );
        cancelDeleteBtn.addEventListener(
            "click",
            () => (deleteModal.style.display = "none")
        );

        // Close modal when clicking outside
        window.addEventListener("click", (event) => {
            if (event.target.classList.contains("modal")) {
                event.target.style.display = "none";
            }
        });
        window.addEventListener("resize", addEventListenerFunc);
    }

    // Populate view modal with teacher data
    function populateViewModal(teacher) {
        document.getElementById("teacher-modal-body").innerHTML = `
            <div class="detail-group">
                <h3>${teacher.name}</h3>
                <p><strong>Email:</strong> ${teacher.email}</p>
                <p><strong>Phone:</strong> ${teacher.phone}</p>
                <p><strong>Date of Birth:</strong> ${teacher.date_of_birth
                .split("-")
                .reverse()
                .join("-")}</p>
                <p><strong>Assigned Class:</strong> ${teacher.class_assigned
            }</p>
            </div>
            
            <div class="detail-group">
                <h4>Address</h4>
                <p>${teacher.address}</p>
                <p>${teacher.city}, ${teacher.state} ${teacher.pincode}</p>
            </div>
        `;
    }

    // Populate form with teacher data
    function populateForm(teacher) {
        document.getElementById("teacherId").value = teacher.id;
        document.getElementById("fullName").value = teacher.name;
        document.getElementById("email").value = teacher.email;
        document.getElementById("phone").value = teacher.phone;
        document.getElementById("dob").value = teacher.date_of_birth;
        document.getElementById("address").value = teacher.address;
        document.getElementById("city").value = teacher.city;
        document.getElementById("state").value = teacher.state;
        document.getElementById("pincode").value = teacher.pincode;
        document.getElementById("assignedClass").value =
            teacher.class_assigned || "";
    }

    // Save teacher (add or update)
    function saveTeacher() {
        const id = document.getElementById("teacherId").value;
        const teacherData = {
            name: document.getElementById("fullName").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            date_of_birth: document
                .getElementById("dob")
                .value.split("-")
                .reverse()
                .join("-"),
            address: document.getElementById("address").value,
            city: document.getElementById("city").value,
            state: document.getElementById("state").value,
            pincode: document.getElementById("pincode").value,
            class_assigned: document.getElementById("assignedClass").value,
            school: principalData.school,
            school_id: principalData.school_id,
        };

        const url = id
            ? `${baseUrl}/updateTeacher/${id}/`
            : `${baseUrl}/addTeacher/`;
        const method = id ? "PUT" : "POST";

        showLoader();
        fetch(url, {
            method: method,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(teacherData),
        })
            .then(handleResponse)
            .then((response) => {
                alert(response.message);
                fetchTeachers();
                formModal.style.display = "none";
            })
            .catch(showError)
            .finally(() => {
                hideLoader();
            });
    }

    // Delete teacher
    function deleteTeacher(id) {
        showLoader();
        fetch(`${baseUrl}/deleteTeacher/${id}/`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then(handleResponse)
            .then((response) => {
                alert(response.message);
                fetchTeachers();
            })
            .catch(showError)
            .finally(() => {
                hideLoader();
            });
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
                    const itemPath = new URL(pathMatch[1], window.location.origin)
                        .pathname;
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

    // Handle API response
    function handleResponse(response) {
        if (!response.ok) {
            return response.json().then((error) => {
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
        } else if (typeof error === "string") {
            errorMessage = error;
        }

        alert(errorMessage);
    }

    // Initialize the page
    init();
});
