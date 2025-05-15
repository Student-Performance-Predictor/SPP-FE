// Global variables
let principalData = null;
let classData = null;
let classStudents = [];
let attendanceData = null;
let baseUrl = BE_URL;
let accessToken = localStorage.getItem("access_token");
let attendanceStatusChart = null;
let attendancePercentageChart = null;
let gradesChart = null;
let comparisonChart = null;
let behaviorChart = null;
let profileImageEl = null;

// Initialize the dashboard
document.addEventListener("DOMContentLoaded", function () {
    initDashboard();
});

function initDashboard() {
    loadComponent("../components/principals_navbar.html", "principal_navbar");
    loadComponent("../components/footer.html", "footer");
    showLoader();
    fetchPrincipalInfo()
        .then((data) => {
            const profileImageUrl = data.profile_image
                ? `${baseUrl}/${data.profile_image}/`
                : "https://via.placeholder.com/80";
            profileImageEl.src = profileImageUrl;
            const navbarProfileImg = document.getElementById("profileImage");
            if (navbarProfileImg) {
                navbarProfileImg.src = profileImageUrl;
            }

            principalData = data;
            addEventListenerFunc();
            toggleBarFunc();
            updatePrincipalUI(principalData);

            const classSelect = document.getElementById("classSelect");
            classSelect.value = "1";
            updateClassData("1");

            classSelect.addEventListener("change", function () {
                updateClassData(this.value);
            });
        })
        .catch((error) => {
            console.error("Error initializing dashboard:", error);
            document.querySelectorAll(".error").forEach((el) => {
                el.style.display = "block";
                el.textContent = "Failed to load data. Please try again later.";
            });
        })
        .finally(() => {
            hideLoader();
        });
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

// Function to update class data based on selection
function updateClassData(classNumber) {
    // Reset previous data
    classStudents = [];
    attendanceData = null;
    document
        .querySelectorAll(".loading")
        .forEach((el) => (el.style.display = "block"));
    document
        .querySelectorAll(".chart-container, .table-container, .student-list")
        .forEach((el) => (el.style.display = "none"));
    document
        .querySelectorAll(".no-data, .error")
        .forEach((el) => (el.style.display = "none"));

    showLoader();
    fetchClassInfo(classNumber)
        .then((data) => {
            classData = data;
            updateClassUI(classData);

            fetchAllClassStudents(classNumber)
                .then((students) => {
                    classStudents = students;

                    fetchTodaysAttendance(classNumber)
                        .then(() => {
                            checkGradesData();
                            identifyAtRiskStudents();
                            identifyTopStudents();
                            populateStudentSelectors();

                            document
                                .getElementById("studentSelect")
                                .addEventListener("change", function () {
                                    updateGradeComparison(this.value);
                                });

                            document
                                .getElementById("behaviorStudentSelect")
                                .addEventListener("change", function () {
                                    updateBehaviorInsights(this.value);
                                });

                            document
                                .getElementById("presentSearch")
                                .addEventListener("input", function () {
                                    filterTable(
                                        "presentTableBody",
                                        this.value,
                                        "presentNoSearchResults"
                                    );
                                });

                            document
                                .getElementById("absentSearch")
                                .addEventListener("input", function () {
                                    filterTable(
                                        "absentTableBody",
                                        this.value,
                                        "absentNoSearchResults"
                                    );
                                });

                            if (classStudents.length > 0) {
                                document.getElementById("studentSelect").value =
                                    classStudents[0].student_id;
                                updateGradeComparison(classStudents[0].student_id);
                                updateBehaviorInsights("all");
                            }
                        })
                        .catch((error) => {
                            console.error("Error fetching attendance:", error);
                            handleAttendanceError("Error loading attendance data");
                        });
                })
                .catch((error) => {
                    console.error("Error fetching students:", error);
                    document.querySelectorAll(".error").forEach((el) => {
                        el.style.display = "block";
                        el.textContent = "Failed to load student data.";
                    });
                });
        })
        .catch((error) => {
            console.error("Error updating class data:", error);
            document.querySelectorAll(".error").forEach((el) => {
                el.style.display = "block";
                el.textContent = "Failed to load class data. Please try again.";
            });
        })
        .finally(() => {
            hideLoader();
        });
}

// Function to filter table rows based on search input
function filterTable(tableBodyId, searchText, noResultsId) {
    const tableBody = document.getElementById(tableBodyId);
    const rows = tableBody.getElementsByTagName("tr");
    const searchValue = searchText.toLowerCase();
    let visibleRows = 0;

    for (let row of rows) {
        const studentId = row.cells[0].textContent.toLowerCase();
        const studentName = row.cells[1].textContent.toLowerCase();
        if (studentId.includes(searchValue) || studentName.includes(searchValue)) {
            row.style.display = "";
            visibleRows++;
        } else {
            row.style.display = "none";
        }
    }

    const noResultsEl = document.getElementById(noResultsId);
    if (visibleRows === 0 && searchText !== "") {
        noResultsEl.style.display = "block";
    } else {
        noResultsEl.style.display = "none";
    }
}

// Fetch principal information
function fetchPrincipalInfo() {
    return fetch(`${baseUrl}/principal/me/`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    }).then((response) => {
        if (!response.ok) {
            throw new Error("Failed to fetch principal info");
        }
        return response.json();
    });
}

// Fetch class information
function fetchClassInfo(classNumber) {
    return fetch(`${baseUrl}/classDetails/${classNumber}/`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    }).then((response) => {
        if (!response.ok) {
            throw new Error("Failed to fetch class info");
        }
        return response.json();
    });
}

// Update UI with principal information
function updatePrincipalUI(data) {
    document.getElementById("principalName").textContent = data.name;
    document.getElementById("principalEmail").textContent = data.email;
    document.getElementById("principalPhone").textContent = data.phone;

    if (data.profile_image) {
        document.getElementById(
            "principalAvatar"
        ).src = `${baseUrl}${data.profile_image}`;
    } else {
        document.getElementById("principalAvatar").src =
            "https://via.placeholder.com/80";
    }
}

// Update UI with class information
function updateClassUI(data) {
    document.getElementById(
        "classSelected"
    ).textContent = `Class ${data.class_number}`;
    document.getElementById("workingDays").textContent = data.total_working_days;
    document.getElementById(
        "attendanceThreshold"
    ).textContent = `${data.threshold}%`;
    document.getElementById("startDate").textContent = data.start_date;
}

// Fetch all students in the class
function fetchAllClassStudents(classNumber) {
    return fetch(`${baseUrl}/getAllClassStudents/${classNumber}/`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    }).then((response) => {
        if (!response.ok) {
            throw new Error("Failed to fetch class students");
        }
        return response.json();
    });
}

// Fetch today's attendance
function fetchTodaysAttendance(classNumber) {
    const schoolId = principalData.school_id;
    if (!classNumber || !schoolId) {
        console.error("Missing class or school information");
        handleAttendanceError("Missing class or school information");
        return Promise.reject("Missing class or school information");
    }

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("attendanceStatusDate").textContent = today;
    document.getElementById("presentDate").textContent = today;
    document.getElementById("absentDate").textContent = today;

    return fetch(
        `${baseUrl}/attendance/?school_id=${schoolId}&class_number=${classNumber}&date=${today}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    )
        .then((response) => {
            if (!response.ok) {
                document.getElementById("attendanceStatusLoading").style.display =
                    "none";
                document.getElementById("attendanceStatusNoData").style.display =
                    "block";
                document.getElementById("attendanceStatusNoData").textContent =
                    "Attendance not taken yet or not a working day";
                document.getElementById("attendancePercentageLoading").style.display =
                    "none";
                document.getElementById("attendancePercentageNoData").style.display =
                    "block";
                document.getElementById("presentLoading").style.display = "none";
                document.getElementById("presentNoData").style.display = "block";
                document.getElementById("presentNoData").textContent =
                    "Attendance not taken yet or not a working day";
                document.getElementById("absentLoading").style.display = "none";
                document.getElementById("absentNoData").style.display = "block";
                document.getElementById("absentNoData").textContent =
                    "Attendance not taken yet or not a working day";
                return Promise.reject("Attendance not taken yet or not a working day");
            }
            return response.json();
        })
        .then((data) => {
            attendanceData = data;

            const isNotMarked = attendanceData.students.every(
                (student) => student.status === "not_marked"
            );
            if (isNotMarked) {
                document.getElementById("attendanceStatusLoading").style.display =
                    "none";
                document.getElementById("attendanceStatusNoData").style.display =
                    "block";
                document.getElementById("attendanceStatusNoData").textContent =
                    "Attendance not taken yet or not a working day";
                document.getElementById("attendancePercentageLoading").style.display =
                    "none";
                document.getElementById("attendancePercentageNoData").style.display =
                    "block";
                document.getElementById("presentLoading").style.display = "none";
                document.getElementById("presentNoData").style.display = "block";
                document.getElementById("presentNoData").textContent =
                    "Attendance not taken yet or not a working day";
                document.getElementById("absentLoading").style.display = "none";
                document.getElementById("absentNoData").style.display = "block";
                document.getElementById("absentNoData").textContent =
                    "Attendance not taken yet or not a working day";
                return;
            }

            renderAttendanceStatusChart();
            renderAttendancePercentageChart();
            renderAttendanceTables();
        });
}

// Helper function to handle attendance errors
function handleAttendanceError(message) {
    document.getElementById("attendanceStatusLoading").style.display = "none";
    document.getElementById("attendanceStatusError").style.display = "block";
    document.getElementById("attendanceStatusError").textContent = message;

    document.getElementById("attendancePercentageLoading").style.display = "none";
    document.getElementById("attendancePercentageError").style.display = "block";
    document.getElementById("attendancePercentageError").textContent = message;

    document.getElementById("presentLoading").style.display = "none";
    document.getElementById("presentError").style.display = "block";
    document.getElementById("presentError").textContent = message;

    document.getElementById("absentLoading").style.display = "none";
    document.getElementById("absentError").style.display = "block";
    document.getElementById("absentError").textContent = message;
}

// Render attendance status pie chart
function renderAttendanceStatusChart() {
    const ctx = document.getElementById("attendanceStatusChart").getContext("2d");
    if (attendanceStatusChart) {
        attendanceStatusChart.destroy();
    }

    const students = attendanceData.students;
    const presentCount = students.filter(
        (student) => student.status === "present"
    ).length;
    const absentCount = students.filter(
        (student) => student.status === "absent"
    ).length;

    document.getElementById("attendanceStatusLoading").style.display = "none";
    document.getElementById("attendanceStatusChartContainer").style.display =
        "block";

    attendanceStatusChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Present", "Absent"],
            datasets: [
                {
                    data: [presentCount, absentCount],
                    backgroundColor: [
                        "rgba(46, 204, 113, 0.7)",
                        "rgba(231, 76, 60, 0.7)",
                    ],
                    borderColor: ["rgba(46, 204, 113, 1)", "rgba(231, 76, 60, 1)"],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || "";
                            const value = context.raw || 0;
                            return `${label}: ${value} student${value !== 1 ? "s" : ""}`;
                        },
                    },
                },
            },
        },
    });
}

// Render attendance tables
function renderAttendanceTables() {
    const presentTableBody = document.getElementById("presentTableBody");
    const absentTableBody = document.getElementById("absentTableBody");
    presentTableBody.innerHTML = "";
    absentTableBody.innerHTML = "";

    const presentStudents = attendanceData.students.filter(
        (student) => student.status === "present"
    );
    const absentStudents = attendanceData.students.filter(
        (student) => student.status === "absent"
    );

    // Update headings with counts
    document.getElementById(
        "presentTitle"
    ).textContent = `Present Students - ${presentStudents.length}`;
    document.getElementById(
        "absentTitle"
    ).textContent = `Absent Students - ${absentStudents.length}`;

    if (presentStudents.length === 0) {
        document.getElementById("presentLoading").style.display = "none";
        document.getElementById("presentNoData").style.display = "block";
    } else {
        presentStudents.forEach((student) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                        <td>${student.student_id}</td>
                        <td>${student.name}</td>
                    `;
            presentTableBody.appendChild(row);
        });
        document.getElementById("presentLoading").style.display = "none";
        document.getElementById("presentTableContainer").style.display = "block";
    }

    if (absentStudents.length === 0) {
        document.getElementById("absentLoading").style.display = "none";
        document.getElementById("absentNoData").style.display = "block";
    } else {
        absentStudents.forEach((student) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                        <td>${student.student_id}</td>
                        <td>${student.name}</td>
                    `;
            absentTableBody.appendChild(row);
        });
        document.getElementById("absentLoading").style.display = "none";
        document.getElementById("absentTableContainer").style.display = "block";
    }
}

// Render attendance percentage chart
function renderAttendancePercentageChart() {
    const ctx = document
        .getElementById("attendancePercentageChart")
        .getContext("2d");
    if (attendancePercentageChart) {
        attendancePercentageChart.destroy();
    }

    const students = attendanceData.students;
    const labels = students.map((student) => student.name);
    const percentages = students.map((student) => student.percentage);

    const backgroundColors = percentages.map((percentage) => {
        if (percentage < 40) return "rgba(231, 76, 60, 0.7)";
        if (percentage < 75) return "rgba(241, 196, 15, 0.7)";
        return "rgba(46, 204, 113, 0.7)";
    });

    document.getElementById("attendancePercentageLoading").style.display = "none";
    document.getElementById("attendancePercentageChartContainer").style.display =
        "block";

    attendancePercentageChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Attendance Percentage",
                    data: percentages,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map((color) =>
                        color.replace("0.7", "1")
                    ),
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: "Attendance (%)",
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: "Students",
                    },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Attendance: ${context.raw}%`;
                        },
                    },
                },
                legend: {
                    display: false,
                },
            },
        },
    });
}

// Check if grades are predicted
function checkGradesData() {
    const hasGrades = classStudents.some((student) => student.final_grade > 0);

    if (!hasGrades) {
        document.getElementById("gradesLoading").style.display = "none";
        document.getElementById("gradesNoData").style.display = "block";
        document.getElementById("atRiskLoading").style.display = "none";
        document.getElementById("atRiskNoData").textContent =
            "Predict the Final Grade First";
        document.getElementById("atRiskNoData").style.display = "block";
        document.getElementById("topStudentsLoading").style.display = "none";
        document.getElementById("topStudentsNoData").textContent =
            "Predict the Final Grade First";
        document.getElementById("topStudentsNoData").style.display = "block";
        return;
    }

    renderGradesChart();
}

// Render grades chart
function renderGradesChart() {
    const ctx = document.getElementById("gradesChart").getContext("2d");
    if (gradesChart) {
        gradesChart.destroy();
    }

    const sortedStudents = [...classStudents].sort(
        (a, b) => a.final_grade - b.final_grade
    );
    const labels = sortedStudents.map((student) => student.full_name);
    const grades = sortedStudents.map((student) => student.final_grade);

    const backgroundColors = grades.map((grade) => {
        if (grade <= 40) return "rgba(231, 76, 60, 0.7)";
        if (grade <= 75) return "rgba(241, 196, 15, 0.7)";
        return "rgba(46, 204, 113, 0.7)";
    });

    document.getElementById("gradesLoading").style.display = "none";
    document.getElementById("gradesChartContainer").style.display = "block";

    gradesChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Final Grade",
                    data: grades,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map((color) =>
                        color.replace("0.7", "1")
                    ),
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: "Grade (%)",
                    },
                    grid: {
                        color: "rgba(0, 0, 0, 0.1)",
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: "Students",
                    },
                    grid: {
                        display: false,
                    },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Grade: ${context.raw}%`;
                        },
                    },
                },
                legend: {
                    display: false,
                },
            },
        },
    });
}

// Identify at-risk students
function identifyAtRiskStudents() {
    const hasGrades = classStudents.some((student) => student.final_grade > 0);
    if (!hasGrades) {
        document.getElementById("atRiskLoading").style.display = "none";
        document.getElementById("atRiskNoData").textContent =
            "Predict the Final Grade First";
        document.getElementById("atRiskNoData").style.display = "block";
        return;
    }

    const sortedStudents = [...classStudents].sort(
        (a, b) => a.final_grade - b.final_grade
    );
    const atRiskStudents = sortedStudents.slice(0, 10);

    if (atRiskStudents.length === 0) {
        document.getElementById("atRiskLoading").style.display = "none";
        document.getElementById("atRiskNoData").style.display = "block";
        return;
    }

    renderAtRiskStudents(atRiskStudents);
}

// Render at-risk students list
function renderAtRiskStudents(students) {
    const container = document.getElementById("atRiskList");
    container.innerHTML = "";

    students.forEach((student) => {
        const studentEl = document.createElement("div");
        studentEl.className = "student-item";

        let riskReason = "";
        if (student.final_grade < 40) {
            riskReason = "Very Low Grade";
        } else if (student.final_grade < 50) {
            riskReason = "Low Grade";
        } else if (student.final_grade < classData.threshold) {
            riskReason = "Below Threshold";
        } else if (student.final_grade < student.prev_grade1 - 15) {
            riskReason = "Significant Drop";
        } else if (student.final_grade < student.prev_grade2 - 15) {
            riskReason = "Consistent Decline";
        } else {
            riskReason = "Bottom Performer";
        }

        studentEl.innerHTML = `
                    <span>${student.full_name}</span>
                    <span class="badge ${student.final_grade < 40
                ? "badge-danger"
                : "badge-warning"
            }">${student.final_grade}% - ${riskReason}</span>
                `;

        container.appendChild(studentEl);
    });

    document.getElementById("atRiskLoading").style.display = "none";
    document.getElementById("atRiskList").style.display = "block";
}

// Identify top performing students
function identifyTopStudents() {
    const hasGrades = classStudents.some((student) => student.final_grade > 0);
    if (!hasGrades) {
        document.getElementById("topStudentsLoading").style.display = "none";
        document.getElementById("topStudentsNoData").textContent =
            "Predict the Final Grade First";
        document.getElementById("topStudentsNoData").style.display = "block";
        return;
    }

    const sortedStudents = [...classStudents].sort(
        (a, b) => b.final_grade - a.final_grade
    );
    const topStudents = sortedStudents.slice(0, 5);

    if (topStudents.length === 0) {
        document.getElementById("topStudentsLoading").style.display = "none";
        document.getElementById("topStudentsNoData").style.display = "block";
        return;
    }

    renderTopStudents(topStudents);
}

// Render top students list
function renderTopStudents(students) {
    const container = document.getElementById("topStudentsList");
    container.innerHTML = "";

    students.forEach((student) => {
        const studentEl = document.createElement("div");
        studentEl.className = "student-item";

        let performanceNote = "";
        if (student.final_grade > 90) {
            performanceNote = "Excellent";
        } else if (student.final_grade > 85) {
            performanceNote = "Outstanding";
        } else {
            performanceNote = "Top Performer";
        }

        studentEl.innerHTML = `
                    <span>${student.full_name}</span>
                    <span class="badge badge-success">${student.final_grade}% - ${performanceNote}</span>
                `;

        container.appendChild(studentEl);
    });

    document.getElementById("topStudentsLoading").style.display = "none";
    document.getElementById("topStudentsList").style.display = "block";
}

// Populate student selectors
function populateStudentSelectors() {
    const gradeSelector = document.getElementById("studentSelect");
    const behaviorSelector = document.getElementById("behaviorStudentSelect");

    gradeSelector.innerHTML = "";
    behaviorSelector.innerHTML = '<option value="all">All Students</option>';

    classStudents.forEach((student) => {
        const option1 = document.createElement("option");
        option1.value = student.student_id;
        option1.textContent = student.full_name;
        gradeSelector.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = student.student_id;
        option2.textContent = student.full_name;
        behaviorSelector.appendChild(option2);
    });
}

// Update grade comparison chart
function updateGradeComparison(studentId) {
    if (!studentId) {
        document.getElementById("comparisonLoading").style.display = "block";
        document.getElementById("comparisonChartContainer").style.display = "none";
        return;
    }

    const student = classStudents.find((s) => s.student_id === studentId);
    if (!student) return;

    renderGradeComparisonChart(student);
}

// Render grade comparison chart
function renderGradeComparisonChart(student) {
    const ctx = document.getElementById("comparisonChart").getContext("2d");
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    document.getElementById("comparisonLoading").style.display = "none";
    document.getElementById("comparisonChartContainer").style.display = "block";

    comparisonChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Previous Grade 2", "Previous Grade 1", "Final Grade"],
            datasets: [
                {
                    label: "Grades",
                    data: [student.prev_grade2, student.prev_grade1, student.final_grade],
                    backgroundColor: [
                        "rgba(155, 89, 182, 0.7)",
                        "rgba(241, 196, 15, 0.7)",
                        "rgba(46, 204, 113, 0.7)",
                    ],
                    borderColor: [
                        "rgba(155, 89, 182, 1)",
                        "rgba(241, 196, 15, 1)",
                        "rgba(46, 204, 113, 1)",
                    ],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: "Grade (%)",
                    },
                    grid: {
                        color: "rgba(0, 0, 0, 0.1)",
                    },
                },
                x: {
                    grid: {
                        display: false,
                    },
                },
            },
            plugins: {
                title: {
                    display: true,
                    text: `Grade Progression for ${student.full_name}`,
                    font: {
                        size: 16,
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Grade: ${context.raw}%`;
                        },
                    },
                },
                legend: {
                    display: false,
                },
            },
        },
    });
}

// Update behavior insights
function updateBehaviorInsights(studentId) {
    if (studentId === "all") {
        renderClassBehaviorInsights();
    } else {
        const student = classStudents.find((s) => s.student_id === studentId);
        if (student) {
            renderStudentBehaviorInsights(student);
        }
    }
}

// Render class behavior insights
function renderClassBehaviorInsights() {
    const ctx = document.getElementById("behaviorChart").getContext("2d");
    if (behaviorChart) {
        behaviorChart.destroy();
    }

    const metrics = ["participation", "rating", "discipline", "late_submissions"];
    const labels = [
        "Class Participation",
        "Teacher Rating",
        "Discipline",
        "Late Submissions",
    ];

    const averages = metrics.map((metric) => {
        const sum = classStudents.reduce(
            (total, student) => total + student[metric],
            0
        );
        return sum / classStudents.length;
    });

    document.getElementById("behaviorLoading").style.display = "none";
    document.getElementById("behaviorChartContainer").style.display = "block";

    behaviorChart = new Chart(ctx, {
        type: "radar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Class Average",
                    data: averages,
                    backgroundColor: "rgba(52, 152, 219, 0.2)",
                    borderColor: "rgba(52, 152, 219, 1)",
                    pointBackgroundColor: "rgba(52, 152, 219, 1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(52, 152, 219, 1)",
                    borderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        display: true,
                        color: "rgba(0, 0, 0, 0.1)",
                    },
                    suggestedMin: 0,
                    suggestedMax: 10,
                    ticks: {
                        stepSize: 2,
                    },
                    grid: {
                        color: "rgba(0, 0, 0, 0.1)",
                    },
                },
            },
            plugins: {
                title: {
                    display: true,
                    text: "Class Behavior Insights",
                    font: {
                        size: 16,
                    },
                },
                legend: {
                    position: "top",
                },
            },
            elements: {
                line: {
                    tension: 0.1,
                },
            },
        },
    });
}

// Render student behavior insights
function renderStudentBehaviorInsights(student) {
    const ctx = document.getElementById("behaviorChart").getContext("2d");
    if (behaviorChart) {
        behaviorChart.destroy();
    }

    const metrics = ["participation", "rating", "discipline", "late_submissions"];
    const labels = [
        "Class Participation",
        "Teacher Rating",
        "Discipline",
        "Late Submissions",
    ];
    const studentData = metrics.map((metric) => student[metric]);

    const averages = metrics.map((metric) => {
        const sum = classStudents.reduce((total, s) => total + s[metric], 0);
        return sum / classStudents.length;
    });

    document.getElementById("behaviorLoading").style.display = "none";
    document.getElementById("behaviorChartContainer").style.display = "block";

    behaviorChart = new Chart(ctx, {
        type: "radar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Class Average",
                    data: averages,
                    backgroundColor: "rgba(149, 165, 166, 0.2)",
                    borderColor: "rgba(149, 165, 166, 1)",
                    pointBackgroundColor: "rgba(149, 165, 166, 1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(149, 165, 166, 1)",
                    borderWidth: 1,
                },
                {
                    label: student.full_name,
                    data: studentData,
                    backgroundColor: "rgba(46, 204, 113, 0.2)",
                    borderColor: "rgba(46, 204, 113, 1)",
                    pointBackgroundColor: "rgba(46, 204, 113, 1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(46, 204, 113, 1)",
                    borderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        display: true,
                        color: "rgba(0, 0, 0, 0.1)",
                    },
                    suggestedMin: 0,
                    suggestedMax: 10,
                    ticks: {
                        stepSize: 2,
                    },
                    grid: {
                        color: "rgba(0, 0, 0, 0.1)",
                    },
                },
            },
            plugins: {
                title: {
                    display: true,
                    text: `Behavior Insights for ${student.full_name}`,
                    font: {
                        size: 16,
                    },
                },
                legend: {
                    position: "top",
                },
            },
            elements: {
                line: {
                    tension: 0.1,
                },
            },
        },
    });
}
