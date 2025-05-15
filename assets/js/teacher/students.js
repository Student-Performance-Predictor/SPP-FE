// Global variables
let accessToken = localStorage.getItem("access_token"); // Assuming token is stored
let teacherInfo = {};
let students = [];

// DOM elements
const addStudentBtn = document.getElementById("addStudentBtn");
const studentsTableBody = document.getElementById("studentsTableBody");
const studentModal = document.getElementById("studentModal");
const viewStudentModal = document.getElementById("viewStudentModal");
const closeButtons = document.getElementsByClassName("close");
const closeViewModalBtn = document.getElementsByClassName("closeViewModal")[0];
const cancelBtn = document.getElementById("cancelBtn");
const studentForm = document.getElementById("studentForm");
const saveBtn = document.getElementById("saveBtn");
const searchInput = document.getElementById("searchInput");
const loader = document.getElementById("loader");
let profileImageEl = null;
const baseUrl = BE_URL;

// Fetch teacher information when page loads
document.addEventListener("DOMContentLoaded", init);

function init() {
    // Load components first
    loadComponent("../components/teachers_navbar.html", "teacher_navbar");
    loadComponent("../components/footer.html", "footer");

    // Wait a bit for components to load, then fetch data
    setTimeout(() => {
        fetchTeacherInfo();
        addEventListenerFunc();
        toggleBarFunc();
    }, 1000);
}

function loadComponent(url, elementId) {
    fetch(url)
        .then((response) => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.text();
        })
        .then((html) => {
            document.getElementById(elementId).innerHTML = html;
            profileImageEl = document.getElementById("profileImage");
        })
        .catch((error) => {
            console.error(`Error loading ${elementId}:`, error);
        });
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

// Search functionality
searchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const rows = studentsTableBody.querySelectorAll("tr");
    let visibleRows = 0;

    rows.forEach((row) => {
        if (row.querySelector("td")) {
            // Skip the loading row
            const cells = row.querySelectorAll("td");
            let matches = false;

            // Check each cell (skip S.No and Actions columns)
            for (let i = 1; i < cells.length - 1; i++) {
                if (cells[i].textContent.toLowerCase().includes(searchTerm)) {
                    matches = true;
                    break;
                }
            }

            row.style.display = matches ? "" : "none";
            if (matches) visibleRows++;
        }
    });

    // Show "no results" message if no matches found
    if (visibleRows === 0 && searchTerm !== "") {
        if (!document.getElementById("noResultsRow")) {
            const noResultsRow = document.createElement("tr");
            noResultsRow.id = "noResultsRow";
            noResultsRow.innerHTML =
                '<td colspan="6" class="no-results">No students found matching your search</td>';
            studentsTableBody.appendChild(noResultsRow);
        }
    } else {
        const noResultsRow = document.getElementById("noResultsRow");
        if (noResultsRow) {
            noResultsRow.remove();
        }
    }
});

// Fetch teacher information
function fetchTeacherInfo() {
    showLoader();
    fetch(`${baseUrl}/teacher/me/`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch teacher info");
            }
            return response.json();
        })
        .then((data) => {
            teacherInfo = data;
            const profileImageUrl = data.profile_image
                ? `${baseUrl}/${data.profile_image}/`
                : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMggZhOIH1vXmnv0bCyBu8iEuYQO-Dw1kpp7_v2mwhw_SKksetiK0e4VWUak3pm-v-Moc&usqp=CAU";
            // Update profile image in main content
            profileImageEl.src = profileImageUrl;

            // Update profile image in navbar if it exists
            const navbarProfileImg = document.getElementById("profileImage");
            if (navbarProfileImg) {
                navbarProfileImg.src = profileImageUrl;
            }

            updateSchoolInfo();
            fetchStudents();
        })
        .catch((error) => {
            console.error("Error fetching teacher info:", error);
            alert("Error fetching teacher information. Please try again.");
            hideLoader();
        })
        .finally(() => {
            hideLoader();
        });
}

// Update school information in the UI
function updateSchoolInfo() {
    document.getElementById("schoolName").textContent = teacherInfo.school;
    document.getElementById("className").textContent = teacherInfo.class_assigned;

    // Set values in the form
    document.getElementById("school").value = teacherInfo.school;
    document.getElementById("class_assigned").value = teacherInfo.class_assigned;
}

// Fetch students for the class
function fetchStudents() {
    showLoader();
    fetch(
        `${baseUrl}/getAllClassStudents/${teacherInfo.class_assigned}/`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    )
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch students");
            }
            return response.json();
        })
        .then((data) => {
            students = data.sort((a, b) => a.full_name.localeCompare(b.full_name));
            renderStudentsTable();
            hideLoader();
        })
        .catch((error) => {
            console.error("Error fetching students:", error);
            alert("Error fetching students. Please try again.");
            hideLoader();
        })
        .finally(() => {
            hideLoader();
        });
}

// Render students table with basic info
function renderStudentsTable() {
    if (students.length === 0) {
        studentsTableBody.innerHTML =
            '<tr><td colspan="6" class="no-results">No students found</td></tr>';
        return;
    }

    studentsTableBody.innerHTML = "";
    students.forEach((student, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${student.student_id}</td>
                    <td>${student.full_name}</td>
                    <td>${student.email}</td>
                    <td>${student.phone}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-success btn-sm view-btn" data-id="${student.id
            }" title="View">
                                <i class="fas fa-eye"></i> <span class="btn-text">View</span>
                            </button>
                            <button class="btn btn-secondary btn-sm edit-btn" data-id="${student.id
            }" title="Edit">
                                <i class="fas fa-edit"></i> <span class="btn-text">Edit</span>
                            </button>
                            <button class="btn btn-danger btn-sm delete-btn" data-id="${student.id
            }" title="Delete">
                                <i class="fas fa-trash"></i> <span class="btn-text">Delete</span>
                            </button>
                        </div>
                    </td>
                `;
        studentsTableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll(".view-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const studentId = this.getAttribute("data-id");
            viewStudent(studentId);
        });
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const studentId = this.getAttribute("data-id");
            editStudent(studentId);
        });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const studentId = this.getAttribute("data-id");
            deleteStudent(studentId);
        });
    });
}

// View student details
function viewStudent(studentId) {
    showLoader();
    fetch(`${baseUrl}/viewStudent/${studentId}/`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch student details");
            }
            return response.json();
        })
        .then((student) => {
            // Populate view modal
            document.getElementById("viewFullName").textContent = student.full_name;
            document.getElementById("viewStudentId").textContent = student.student_id;
            document.getElementById("viewEmail").textContent = student.email;
            document.getElementById("viewPhone").textContent = student.phone;
            document.getElementById(
                "viewAttendance"
            ).textContent = `${student.attendance_percentage}%`;
            document.getElementById("viewSchool").textContent = student.school;
            document.getElementById("viewClass").textContent = student.class_assigned;
            document.getElementById("viewParentalEducation").textContent =
                student.parental_education;
            document.getElementById("viewStudyHours").textContent =
                student.study_hours;
            document.getElementById("viewFailures").textContent = student.failures;
            document.getElementById("viewExtracurricular").textContent =
                student.extracurricular ? "Yes" : "No";
            document.getElementById("viewParticipation").textContent =
                student.participation;
            document.getElementById("viewRating").textContent = student.rating;
            document.getElementById("viewDiscipline").textContent =
                student.discipline;
            document.getElementById("viewLateSubmissions").textContent =
                student.late_submissions;
            document.getElementById("viewPrevGrade1").textContent =
                student.prev_grade1;
            document.getElementById("viewPrevGrade2").textContent =
                student.prev_grade2;
            document.getElementById("viewFinalGrade").textContent =
                student.final_grade || "0";

            // Show view modal
            viewStudentModal.style.display = "block";
            hideLoader();
        })
        .catch((error) => {
            console.error("Error viewing student:", error);
            alert("Error viewing student details. Please try again.");
        })
        .finally(() => {
            hideLoader();
        });
}

// Edit student
function editStudent(studentId) {
    showLoader();
    fetch(`${baseUrl}/viewStudent/${studentId}/`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch student details");
            }
            return response.json();
        })
        .then((student) => {
            // Set modal title
            document.getElementById("modalTitle").textContent = "Edit Student";

            // Populate form
            document.getElementById("studentId").value = student.id;
            document.getElementById("fullName").value = student.full_name;
            document.getElementById("studentIdInput").value = student.student_id;
            document.getElementById("email").value = student.email;
            document.getElementById("phone").value = student.phone;
            document.getElementById("attendance").value =
                student.attendance_percentage;
            document.getElementById("parental_education").value =
                student.parental_education;
            document.getElementById("study_hours").value = student.study_hours;
            document.getElementById("failures").value = student.failures;
            document.getElementById("extracurricular").value = student.extracurricular
                ? "1"
                : "0";
            document.getElementById("participation").value = student.participation;
            document.getElementById("rating").value = student.rating;
            document.getElementById("discipline").value = student.discipline;
            document.getElementById("late_submissions").value =
                student.late_submissions;
            document.getElementById("prev_grade1").value = student.prev_grade1;
            document.getElementById("prev_grade2").value = student.prev_grade2;
            document.getElementById("final_grade").value = student.final_grade || "0";

            // Set school and class info
            document.getElementById("school").value = student.school;
            document.getElementById("class_assigned").value = student.class_assigned;

            // Show modal
            studentModal.style.display = "block";
            hideLoader();
        })
        .catch((error) => {
            console.error("Error fetching student for edit:", error);
            alert("Error loading student for editing. Please try again.");
        })
        .finally(() => {
            hideLoader();
        });
}

document.getElementById('studentsFile').addEventListener('change', function (e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'No file selected';
    document.getElementById('fileName').textContent = fileName;
});

// Import form submission
document.getElementById('importForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const fileInput = document.getElementById('studentsFile');
    const file = fileInput.files[0];

    if (!file) {
        showAlert('Please select a CSV file', 'error');
        return;
    }

    if (!file.name.endsWith('.csv')) {
        showAlert('Please upload a valid CSV file', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    showLoader();
    fetch(`${baseUrl}/importStudents/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
        body: formData
    })
        .then(response => response.json().then(data => ({ status: response.ok, data })))
        .then(({ status, data }) => {
            if (status) {
                showImportResults(data);
            } else {
                throw new Error(data.message || 'Import failed');
            }
        })
        .catch(error => {
            showAlert(`Error during import: ${error.message}`, 'error');
            console.error('Import error:', error);
        })
        .finally(() => {
            hideLoader();
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-upload"></i> <span class="btn-text">Upload</span>';
            window.location.reload();
        });
});


// Show import results in modal
function showImportResults(data) {
    const modal = document.getElementById('importResultModal');
    const content = document.getElementById('importResultsContent');

    let html = `
        <div class="import-summary">
            <p><strong>Total Processed:</strong> ${data.success + data.failed}</p>
            <p class="text-success"><strong>Successful:</strong> ${data.success}</p>
            ${data.failed > 0 ? `<p class="text-danger"><strong>Failed:</strong> ${data.failed}</p>` : ''}
        </div>
    `;

    if (data.errors && data.errors.length > 0) {
        html += `<div class="import-errors">
            <h4>Errors:</h4>
            <ul>`;
        data.errors.forEach(error => {
            html += `<li>${error}</li>`;
        });
        html += `</ul></div>`;
    }

    content.innerHTML = html;
    modal.style.display = 'block';

    // Close modal when clicking X
    document.querySelector('.close-modal').onclick = function () {
        modal.style.display = 'none';
    };

    // Close modal when clicking outside
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

// Helper function to show alerts
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Export button handler
document.getElementById('exportStudentsBtn').addEventListener('click', function () {
    const exportBtn = this;
    exportBtn.disabled = true;
    exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';

    showLoader();
    fetch(`${baseUrl}/exportStudents/`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Export failed');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `class-${teacherInfo.class_assigned}_students.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        })
        .catch(error => {
            showAlert(`Export failed: ${error.message}`, 'error');
        })
        .finally(() => {
            hideLoader();
            exportBtn.disabled = false;
            exportBtn.innerHTML = '<i class="fas fa-file-export"></i> <span class="btn-text">Export</span>';
        });
});


addStudentBtn.addEventListener("click", function () {
    // Set modal title
    document.getElementById("modalTitle").textContent = "Add New Student";

    // Reset form
    studentForm.reset();
    document.getElementById("studentId").value = "";
    document.getElementById("final_grade").value = "0";

    // Set school and class info
    document.getElementById("school").value = teacherInfo.school;
    document.getElementById("class_assigned").value = teacherInfo.class_assigned;

    // Show modal
    studentModal.style.display = "block";
});

// Delete student
function deleteStudent(studentId) {
    if (!confirm("Are you sure you want to delete this student?")) return;

    showLoader();
    fetch(`${baseUrl}/deleteStudent/${studentId}/`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to delete student");
            }
            return response.json();
        })
        .then(() => {
            alert("Student deleted successfully");
            fetchStudents(); // Refresh the list
        })
        .catch((error) => {
            console.error("Error deleting student:", error);
            alert("Error deleting student. Please try again.");
        })
        .finally(() => {
            hideLoader();
        });
}

// Handle form submission
studentForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const studentId = document.getElementById("studentId").value;
    const isEdit = !!studentId;

    const studentData = {
        full_name: document.getElementById("fullName").value,
        student_id: document.getElementById("studentIdInput").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        school: document.getElementById("school").value,
        school_id: teacherInfo.school_id,
        class_assigned: document.getElementById("class_assigned").value,
        attendance_percentage: parseFloat(
            document.getElementById("attendance").value
        ),
        parental_education: parseInt(
            document.getElementById("parental_education").value
        ),
        study_hours: parseInt(document.getElementById("study_hours").value),
        failures: parseInt(document.getElementById("failures").value),
        extracurricular: parseInt(document.getElementById("extracurricular").value),
        participation: parseInt(document.getElementById("participation").value),
        rating: parseInt(document.getElementById("rating").value),
        discipline: parseInt(document.getElementById("discipline").value),
        late_submissions: parseInt(
            document.getElementById("late_submissions").value
        ),
        prev_grade1: parseFloat(document.getElementById("prev_grade1").value),
        prev_grade2: parseFloat(document.getElementById("prev_grade2").value),
        final_grade: 0,
    };

    // Show loading state
    saveBtn.innerHTML = '<span class="loading"></span>';
    saveBtn.disabled = true;

    const url = isEdit
        ? `${baseUrl}/updateStudent/${studentId}/`
        : `${baseUrl}/addStudent/`;

    const method = isEdit ? "PUT" : "POST";
    showLoader();
    fetch(url, {
        method: method,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    isEdit ? "Failed to update student" : "Failed to add student"
                );
            }
            return response.json();
        })
        .then(() => {
            alert(`Student ${isEdit ? "updated" : "added"} successfully`);
            studentModal.style.display = "none";
            fetchStudents(); // Refresh the list
        })
        .catch((error) => {
            console.error(`Error ${isEdit ? "updating" : "adding"} student:`, error);
            alert(
                `Error ${isEdit ? "updating" : "adding"} student. Please try again.`
            );
        })
        .finally(() => {
            saveBtn.innerHTML =
                '<i class="fas fa-save"></i> <span class="btn-text">Save</span>';
            saveBtn.disabled = false;
            hideLoader();
        });
});

// Close modals
Array.from(closeButtons).forEach((btn) => {
    btn.addEventListener("click", function () {
        studentModal.style.display = "none";
        viewStudentModal.style.display = "none";
    });
});

closeViewModalBtn.addEventListener("click", function () {
    viewStudentModal.style.display = "none";
});

cancelBtn.addEventListener("click", function () {
    studentModal.style.display = "none";
});

// Close modals when clicking outside
window.addEventListener("click", function (event) {
    if (event.target === studentModal) {
        studentModal.style.display = "none";
    }
    if (event.target === viewStudentModal) {
        viewStudentModal.style.display = "none";
    }
});
