// Global variables
let accessToken = localStorage.getItem("access_token");
let students = [];
let teacherInfo = {};
let selectedFile = null;
let profileImageEl = null;
const baseUrl = BE_URL;

function init() {
    loadComponent("../components/teachers_navbar.html", "teacher_navbar");
    loadComponent("../components/footer.html", "footer");
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
            profileImageEl.src = profileImageUrl;
            const navbarProfileImg = document.getElementById("profileImage");
            if (navbarProfileImg) {
                navbarProfileImg.src = profileImageUrl;
            }

            fetchStudents();
            setupEventListeners();
        })
        .catch((error) => {
            console.error("Error fetching teacher info:", error);
            alert("Error fetching teacher information. Please try again.");
        })
        .finally(() => {
            hideLoader();
        });
}

// Fetch students list
function fetchStudents() {
    showLoader();
    fetch(`${baseUrl}/getAllClassStudents/${teacherInfo.class_assigned}/`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch students");
            }
            return response.json();
        })
        .then((data) => {
            // Sort students by name
            students = data.sort((a, b) => a.full_name.localeCompare(b.full_name));
            renderStudentsTable(students);
        })
        .catch((error) => {
            console.error("Error fetching students:", error);
            document.getElementById("studentsTableBody").innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; color: var(--red);">
                            Error loading students. Please try again.
                        </td>
                    </tr>
                `;
        })
        .finally(() => {
            hideLoader();
        });
}

function renderStudentsTable(studentsToRender) {
    const tableBody = document.getElementById("studentsTableBody");

    if (studentsToRender.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-results">
                    No students found matching your search.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = studentsToRender
        .map(
            (student, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${student.student_id}</td>
                <td>${student.full_name}</td>
                <td>${student.email}</td>
                <td>${student.phone}</td>
                <td class="final-grade ${getGradeClass(student.final_grade)}">
                    ${student.final_grade
                    ? student.final_grade
                    : "Not predicted"
                }
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-success btn-sm view-btn" data-id="${student.student_id
                }">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-secondary btn-sm predict-btn" data-id="${student.student_id
                }">
                            <i class="fas fa-magic"></i> Predict
                        </button>
                        <button class="btn btn-danger btn-sm reset-btn" data-id="${student.student_id
                }" ${!student.final_grade ? "disabled" : ""}>
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                </td>
            </tr>
        `
        )
        .join("");
}

// Helper function to determine grade class
function getGradeClass(grade) {
    if (!grade) return "";
    if (grade >= 75) return "predictedGreat";
    if (grade >= 40) return "predictedMedium";
    return "predictedLow";
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    document
        .getElementById("searchInput")
        .addEventListener("input", function (e) {
            const searchTerm = e.target.value.toLowerCase();
            if (searchTerm === "") {
                renderStudentsTable(students);
                return;
            }

            const filteredStudents = students.filter(
                (student) =>
                    student.full_name.toLowerCase().includes(searchTerm) ||
                    student.student_id.toLowerCase().includes(searchTerm) ||
                    student.email.toLowerCase().includes(searchTerm) ||
                    student.phone.toLowerCase().includes(searchTerm)
            );

            renderStudentsTable(filteredStudents);
        });

    // View button click
    document.addEventListener("click", function (e) {
        if (
            e.target.classList.contains("view-btn") ||
            e.target.closest(".view-btn")
        ) {
            const btn = e.target.classList.contains("view-btn")
                ? e.target
                : e.target.closest(".view-btn");
            const studentId = btn.getAttribute("data-id");
            showStudentDetails(studentId);
        }

        // Predict button click
        if (
            e.target.classList.contains("predict-btn") ||
            e.target.closest(".predict-btn")
        ) {
            const btn = e.target.classList.contains("predict-btn")
                ? e.target
                : e.target.closest(".predict-btn");
            const studentId = btn.getAttribute("data-id");
            predictFinalGrade(btn, studentId);
        }

        // Reset button click
        if (
            e.target.classList.contains("reset-btn") ||
            e.target.closest(".reset-btn")
        ) {
            const btn = e.target.classList.contains("reset-btn")
                ? e.target
                : e.target.closest(".reset-btn");
            const studentId = btn.getAttribute("data-id");
            resetFinalGrade(btn, studentId);
        }

        // Reset Grades button
        if (
            e.target.id === "resetGradesBtn" ||
            e.target.closest("#resetGradesBtn")
        ) {
            openResetConfirmModal();
        }

        if (e.target.id === "selectFileBtn" || e.target.closest("#selectFileBtn")) {
            document.getElementById("csvFileUpload").click();
        }
        if (
            e.target.id === "startPredictionBtn" ||
            e.target.closest("#startPredictionBtn")
        ) {
            startBulkPrediction();
        }

        // Reset Confirm Modal buttons
        if (
            e.target.id === "closeResetModal" ||
            e.target.closest("#closeResetModal")
        ) {
            closeResetConfirmModal();
        }
        if (e.target.id === "cancelReset" || e.target.closest("#cancelReset")) {
            closeResetConfirmModal();
        }
        if (e.target.id === "confirmReset" || e.target.closest("#confirmReset")) {
            resetAllGrades();
        }
    });

    document
        .getElementById("importCsvBtn")
        .addEventListener("click", function () {
            document.getElementById("csvFileInput").click();
        });

    document
        .getElementById("csvFileInput")
        .addEventListener("change", function (e) {
            const file = e.target.files[0];
            if (file) {
                if (file.name.endsWith(".csv")) {
                    document.getElementById("uploadCsvBtn").style.display = "inline-flex";
                    document.getElementById("uploadCsvBtn").dataset.fileName = file.name;
                } else {
                    alert("Please select a CSV file.");
                    e.target.value = "";
                }
            }
        });

    document
        .getElementById("uploadCsvBtn")
        .addEventListener("click", function () {
            const fileInput = document.getElementById("csvFileInput");
            if (!fileInput.files.length) return;

            const file = fileInput.files[0];
            startBulkPrediction(file);
        });

    // Modal close buttons
    document.getElementById("closeModal").addEventListener("click", closeModal);
    document.getElementById("cancelModal").addEventListener("click", closeModal);

    // Close modal when clicking outside
    document
        .getElementById("studentModal")
        .addEventListener("click", function (e) {
            if (e.target === this) {
                closeModal();
            }
        });
}

// Show student details in modal
function showStudentDetails(studentId) {
    const student = students.find((s) => s.student_id === studentId);
    if (!student) return;

    // Create modal content with new design
    const modalBody = document.getElementById("modalBody");
    modalBody.innerHTML = `
                <div class="student-details-container">
                    <div class="student-info-header">
                        <div class="student-main-info">
                            <div class="student-name">${student.full_name}</div>
                            <div class="student-id">ID: ${student.student_id
        }</div>
                            ${student.final_grade
            ? `<div class="final-grade ${getGradeClass(student.final_grade)}">Final Grade: ${student.final_grade}</div>`
            : ""
        }
                        </div>
                    </div>
                    
                    <div class="detail-sections">
                        <div class="detail-section">
                            <div class="section-title">Personal Information</div>
                            <div class="detail-row">
                                <span class="detail-label">School</span>
                                <span class="detail-value">${student.school
        }</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Class</span>
                                <span class="detail-value">${student.class_assigned
        }</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Email</span>
                                <span class="detail-value">${student.email
        }</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Phone</span>
                                <span class="detail-value">${student.phone
        }</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Parent Education</span>
                                <span class="detail-value">${student.parental_education
        }</span>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <div class="section-title">Academic Performance</div>
                            <div class="detail-row">
                                <span class="detail-label">Attendance</span>
                                <span class="detail-value">${student.attendance_percentage
        }%</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Study Hours</span>
                                <span class="detail-value">${student.study_hours
        } hrs/week</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Past Failures</span>
                                <span class="detail-value">${student.failures
        }</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Late Submissions</span>
                                <span class="detail-value">${student.late_submissions
        }</span>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <div class="section-title">Previous Grades</div>
                            <div class="detail-row">
                                <span class="detail-label">Previous Grade 1</span>
                                <span class="detail-value">${student.prev_grade1
        }</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Previous Grade 2</span>
                                <span class="detail-value">${student.prev_grade2
        }</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Final Grade</span>
                                <span class="detail-value final-grade ${getGradeClass(student.final_grade)
        }">
                                    ${student.final_grade || "Not predicted yet"
        }
                                </span>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <div class="section-title">Behavior & Activities</div>
                            <div class="detail-row">
                                <span class="detail-label">Extracurricular</span>
                                <span class="detail-value">${student.extracurricular ? "Yes" : "No"
        }</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Participation</span>
                                <span class="detail-value">${student.participation
        }</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Discipline Issues</span>
                                <span class="detail-value">${student.discipline
        }</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

    // Show modal
    document.getElementById("studentModal").style.display = "flex";
}

// Predict final grade for a student
function predictFinalGrade(button, studentId) {
    const originalText = button.innerHTML;
    button.innerHTML = `<i class="fas fa-magic"></i> Predicting...`;
    button.disabled = true;

    // Clear any existing messages
    const existingMessages = button
        .closest("td")
        .querySelectorAll(".success-message, .error-message");
    existingMessages.forEach((msg) => msg.remove());
    showLoader();
    fetch(`${baseUrl}/predictStudent/?student_id=${studentId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Prediction failed");
            }
            return response.json();
        })
        .then((data) => {
            // Update the student's final grade in the table
            const studentRow = button.closest("tr");
            const gradeCell = studentRow.querySelector(".final-grade");

            gradeCell.textContent = data.final_grade;
            gradeCell.className = "final-grade " + getGradeClass(data.final_grade);

            // Also update the student object in our array
            const studentIndex = students.findIndex(
                (s) => s.student_id === studentId
            );
            if (studentIndex !== -1) {
                students[studentIndex].final_grade = data.final_grade;
            }

            // Enable the reset button for this student
            const resetBtn = studentRow.querySelector(".reset-btn");
            if (resetBtn) {
                resetBtn.disabled = false;
            }

            // Call updateStudent API to save the final grade
            return updateStudentFinalGrade(students[studentIndex], data.final_grade);
        })
        .then(() => {
            // Show success message
            const messageDiv = document.createElement("div");
            messageDiv.className = "success-message";
            messageDiv.innerHTML =
                '<i class="fas fa-check-circle"></i> Grade predicted and saved successfully!';
            button.closest("td").appendChild(messageDiv);

            // Remove message after 3 seconds
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        })
        .catch((error) => {
            console.error("Prediction error:", error);

            // Show error message
            const messageDiv = document.createElement("div");
            messageDiv.className = "error-message";
            messageDiv.innerHTML =
                '<i class="fas fa-exclamation-circle"></i> Failed to predict grade. Please try again.';
            button.closest("td").appendChild(messageDiv);
        })
        .finally(() => {
            hideLoader();
            button.innerHTML = originalText;
            button.disabled = false;
        });
}

// Reset final grade for a student
function resetFinalGrade(button, studentId) {
    const originalText = button.innerHTML;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Resetting...`;
    button.disabled = true;

    // Clear any existing messages
    const existingMessages = button
        .closest("td")
        .querySelectorAll(".success-message, .error-message");
    existingMessages.forEach((msg) => msg.remove());

    // Find the student
    const studentIndex = students.findIndex((s) => s.student_id === studentId);
    if (studentIndex === -1) {
        showErrorMessage(button, "Student not found");
        button.innerHTML = originalText;
        button.disabled = false;
        return;
    }

    const student = students[studentIndex];

    // Update the student's final grade to 0 in the database
    updateStudentFinalGrade(student, 0)
        .then(() => {
            // Update the UI
            const studentRow = button.closest("tr");
            const gradeCell = studentRow.querySelector(".final-grade");

            gradeCell.textContent = "Not predicted";
            gradeCell.className = "final-grade";

            // Update the local student data
            students[studentIndex].final_grade = 0;

            // Disable the reset button
            button.disabled = true;

            // Show success message
            const messageDiv = document.createElement("div");
            messageDiv.className = "success-message";
            messageDiv.innerHTML =
                '<i class="fas fa-check-circle"></i> Grade reset successfully!';
            button.closest("td").appendChild(messageDiv);

            // Remove message after 3 seconds
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        })
        .catch((error) => {
            console.error("Reset error:", error);
            showErrorMessage(button, "Failed to reset grade. Please try again.");
        })
        .finally(() => {
            button.innerHTML = `<i class="fas fa-undo"></i> Reset`;
        });
}

// Bulk Prediction Functions
function openBulkPredictModal() {
    document.getElementById("bulkPredictModal").style.display = "flex";
}

function closeBulkPredictModal() {
    document.getElementById("bulkPredictModal").style.display = "none";
    resetBulkPredictModal();
}

function resetBulkPredictModal() {
    selectedFile = null;
    document.getElementById("fileName").textContent = "No file selected";
    document.getElementById("startPredictionBtn").disabled = true;
    document.getElementById("uploadStatus").textContent = "";
    document.getElementById("uploadStatus").className = "";
    document.getElementById("uploadProgress").style.display = "none";
    document.getElementById("fileProgress").value = 0;
    document.getElementById("progressPercent").textContent = "0%";
    document.getElementById("csvFileUpload").value = "";
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.name.endsWith(".csv")) {
            selectedFile = file;
            document.getElementById("fileName").textContent = file.name;
            document.getElementById("startPredictionBtn").disabled = false;
            document.getElementById("uploadStatus").textContent = "";
        } else {
            alert("Please select a CSV file.");
            resetBulkPredictModal();
        }
    }
}

function startBulkPrediction(file) {
    showLoader();

    const formData = new FormData();
    formData.append("file", file);

    // Get school_id from teacher info
    const schoolId = teacherInfo.school_id;

    fetch(`${baseUrl}/predictStduentBulk/?school_id=${schoolId}`, {
        method: "POST",
        body: formData,
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((err) => {
                    throw new Error(err.message || `Server returned ${response.status}`);
                });
            }
            return response.json();
        })
        .then((result) => {
            if (result.message && result.data) {
                alert(result.message); // Or use a toast notification
                location.reload();
            } else {
                throw new Error("Invalid response format from server");
            }
        })
        .catch((error) => {
            console.error("Bulk prediction failed:", error);
            alert(`Error: ${error.message}`);
        })
        .finally(() => {
            hideLoader();
            // Reset the file input and hide upload button
            document.getElementById("csvFileInput").value = "";
            document.getElementById("uploadCsvBtn").style.display = "none";
        });
}

// Reset Grades Functions
function openResetConfirmModal() {
    document.getElementById("resetConfirmModal").style.display = "flex";
}

function closeResetConfirmModal() {
    document.getElementById("resetConfirmModal").style.display = "none";
}

function resetAllGrades() {
    const confirmBtn = document.getElementById("confirmReset");
    const statusElement = document.createElement("div");
    statusElement.style.marginTop = "15px";
    document
        .querySelector("#resetConfirmModal .modal-body")
        .appendChild(statusElement);

    confirmBtn.disabled = true;
    statusElement.textContent = "Resetting grades...";
    statusElement.className = "warning-status";

    // Get school_id and class_number from teacher info
    const schoolId = teacherInfo.school_id;
    const classNumber = teacherInfo.class_assigned;

    // Call the reset API
    fetch(
        `${baseUrl}/resetFinalGrades/?school_id=${schoolId}&class_number=${classNumber}`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    )
        .then((response) => {
            if (!response.ok) {
                return response.json().then((err) => {
                    throw new Error(err.message || `Server returned ${response.status}`);
                });
            }
            return response.json();
        })
        .then((result) => {
            if (result.message) {
                statusElement.textContent = result.message;
                statusElement.className = "success-status";

                // Update local students data
                students.forEach((student) => {
                    student.final_grade = 0;
                });

                // Close the modal and reload the page after 1.5 seconds
                setTimeout(() => {
                    closeResetConfirmModal();
                    location.reload();
                }, 1500);
            } else {
                throw new Error("Invalid response from server");
            }
        })
        .catch((error) => {
            console.error("Reset failed:", error);
            statusElement.textContent = error.message;
            statusElement.className = "error-status";
            confirmBtn.disabled = false;
        });
}

function showErrorMessage(button, message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "error-message";
    messageDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    button.closest("td").appendChild(messageDiv);

    // Remove message after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Update student's final grade in the database
function updateStudentFinalGrade(student, finalGrade) {
    showLoader();
    return fetch(`${baseUrl}/updateStudent/${student.id}/`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            full_name: student.full_name,
            student_id: student.student_id,
            email: student.email,
            phone: student.phone,
            school: student.school,
            school_id: student.school_id,
            class_assigned: student.class_assigned,
            attendance_percentage: student.attendance_percentage,
            parental_education: student.parental_education,
            study_hours: student.study_hours,
            failures: student.failures,
            extracurricular: student.extracurricular,
            participation: student.participation,
            rating: student.rating,
            discipline: student.discipline,
            late_submissions: student.late_submissions,
            prev_grade1: student.prev_grade1,
            prev_grade2: student.prev_grade2,
            final_grade: finalGrade,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to update student grade");
            }
            return response.json();
        })
        .finally(() => {
            hideLoader();
        });
}

// Close modal
function closeModal() {
    document.getElementById("studentModal").style.display = "none";
}

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
