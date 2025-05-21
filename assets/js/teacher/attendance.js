document.addEventListener('DOMContentLoaded', init);

// Global variables
let attendanceData = [];
let currentStudentId = null;
let currentSelectedDate = new Date().toISOString().split('T')[0];
let classDetails = {};
let teacherInfo = {};
let profileImageEl = null;
const baseUrl = BE_URL;
const searchInput = document.getElementById("searchInput");

function init() {
    document.getElementById('class-info').textContent = "Loading class information...";
    loadComponent("../components/teachers_navbar.html", "teacher_navbar");
    loadComponent("../components/footer.html", "footer");
    setTimeout(() => {
        fetchTeacherInfo();
        addEventListenerFunc();
        toggleBarFunc();
        setupEventListeners();
        loadInitialData();
        setupModal();
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


function setupEventListeners() {
    document.getElementById('save-attendance').addEventListener('click', saveAttendance);
    document.getElementById('apply-bulk').addEventListener('click', applyBulkAction);
    document.getElementById('date-select').addEventListener('change', function () {
        const selectedDate = this.value;
        fetchAttendanceData(selectedDate);
    });
    document.getElementById('update-config').addEventListener('click', updateClassConfig);
    document.getElementById('confirm-alert').addEventListener('click', sendAlert);
}

function setupModal() {
    const modal = document.getElementById('alertModal');
    const span = document.getElementsByClassName('close')[0];
    const cancelBtn = document.querySelector('.cancel-btn');

    span.onclick = function () {
        modal.style.display = 'none';
    }
    cancelBtn.onclick = function () {
        modal.style.display = 'none';
    }
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

function loadInitialData() {
    const accessToken = localStorage.getItem('access_token');
    showLoader();
    fetchTeacherInfo(accessToken)
        .then(teacherData => {
            teacherInfo = teacherData;
            document.getElementById('class-info').textContent = `Class: ${teacherInfo.class_assigned} | School: ${teacherInfo.school}`;
            return fetchClassDetails(teacherInfo.school_id, teacherInfo.class_assigned, accessToken);
        })
        .then(classData => {
            classDetails = classData;
            updateClassUI(classDetails);
            populateDateSelector(classDetails.start_date);
            return fetchAttendanceData(currentSelectedDate);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load initial data');
        })
        .finally(() => {
            hideLoader();
        });
}

function fetchTeacherInfo(accessToken) {
    showLoader();
    return fetch(`${baseUrl}/teacher/me/`, {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch teacher info');
            }
            return response.json();
        })
        .then(data => {
            const profileImageUrl = data.profile_image
                ? `${baseUrl}${data.profile_image}/`
                : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMggZhOIH1vXmnv0bCyBu8iEuYQO-Dw1kpp7_v2mwhw_SKksetiK0e4VWUak3pm-v-Moc&usqp=CAU";
            // Update profile image in main content
            profileImageEl.src = profileImageUrl;

            // Update profile image in navbar if it exists
            const navbarProfileImg = document.getElementById("profileImage");
            if (navbarProfileImg) {
                navbarProfileImg.src = profileImageUrl;
            }
            return {
                school: data.school,
                school_id: data.school_id,
                class_assigned: data.class_assigned || data.class_number // Handle both field names
            };
        })
        .finally(() => {
            hideLoader();
        });
}

function fetchClassDetails(schoolId, classNumber, accessToken) {
    showLoader();
    return fetch(`${baseUrl}/classAssigned/`, {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch class details');
            }
            return response.json();
        })
        .finally(() => {
            hideLoader();
        });
}

function updateClassUI(classData) {
    document.getElementById('working-days').textContent = classData.total_working_days || 0;
    document.getElementById('start-date').textContent = classData.start_date ?
        new Date(classData.start_date).toLocaleDateString() : '-';
    document.getElementById('threshold').textContent = (classData.threshold || 0) + '%';

    // Populate config inputs
    document.getElementById('working-days-input').value = classData.total_working_days || 0;
    document.getElementById('start-date-input').value = classData.start_date || '';
    document.getElementById('threshold-input').value = classData.threshold || 0;
}

function populateDateSelector(startDate) {
    const dateSelect = document.getElementById('date-select');
    dateSelect.innerHTML = '';

    if (!startDate) return;

    const start = new Date(startDate);
    const today = new Date();

    let currentDate = new Date(today);
    while (currentDate >= start) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const option = document.createElement('option');
        option.value = dateStr;
        option.textContent = currentDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        if (dateStr === today.toISOString().split('T')[0]) {
            option.selected = true;
            currentSelectedDate = dateStr;
        }

        dateSelect.appendChild(option);
        currentDate.setDate(currentDate.getDate() - 1);
    }
}

function fetchAttendanceData(date) {
    if (!teacherInfo.school_id || !teacherInfo.class_assigned) {
        console.error('School ID or Class Number not available');
        return;
    }

    currentSelectedDate = date;
    const accessToken = localStorage.getItem('access_token');
    showLoader();
    return fetch(`${baseUrl}/attendance/?school_id=${teacherInfo.school_id}&class_number=${teacherInfo.class_assigned}&date=${date}`, {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch attendance data');
            }
            return response.json();
        })
        .then(data => {
            processAttendanceData(data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load attendance data');
        })
        .finally(() => {
            hideLoader();
        });
}

function processAttendanceData(data) {
    if (!data || !data.students) {
        console.error('Invalid attendance data format');
        return;
    }

    attendanceData = data.students.sort((a, b) => a.name.localeCompare(b.name));
    const presentStudents = data.students.filter(s => s.status === 'present').length;
    const absentStudents = data.students.filter(s => s.status === 'absent').length;

    document.getElementById('total-students').textContent = data.students.length;
    document.getElementById('present-today').textContent = presentStudents;
    document.getElementById('absent-today').textContent = absentStudents;

    const tableBody = document.getElementById('attendance-table-body');
    tableBody.innerHTML = '';

    data.students.forEach(student => {
        const isLowAttendance = student.percentage < (classDetails.threshold || 75);

        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${student.student_id}</td>
                    <td>${student.name}</td>
                    <td>
                        <select class="status-select status-${student.status}" 
                                data-student-id="${student.student_id}" 
                                onchange="updateStatus(this)">
                            <option value="present" ${student.status === 'present' ? 'selected' : ''}>Present</option>
                            <option value="absent" ${student.status === 'absent' ? 'selected' : ''}>Absent</option>
                            <option value="not_marked" ${student.status === 'not_marked' ? 'selected' : ''}>Not Marked</option>
                        </select>
                    </td>
                    <td>${student.present_count}</td>
                    <td class="percentage-cell ${isLowAttendance ? 'low-attendance' : 'good-attendance'}">
                        ${student.percentage.toFixed(1)}%
                    </td>
                    <td>
                        <button class="action-btn alert-btn" 
                                onclick="showAlertModal('${student.student_id}', '${student.name}')"
                                ${!isLowAttendance ? 'disabled' : ''}>
                            Send Alert
                        </button>
                    </td>
                `;
        tableBody.appendChild(row);
    });
}

function searchStudents() {
    const searchInput = document.getElementById('student-search').value.toLowerCase();
    const rows = document.querySelectorAll('#attendance-table-body tr');

    rows.forEach(row => {
        const studentId = row.cells[0].textContent.toLowerCase();
        const studentName = row.cells[1].textContent.toLowerCase();
        const statusSelect = row.cells[2].querySelector('select');
        const status = statusSelect ? statusSelect.value.toLowerCase() : '';

        if (studentId.includes(searchInput) ||
            studentName.includes(searchInput) ||
            status.includes(searchInput)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    // Update the counts to reflect only visible students
    updateVisibleCounts();
}

function updateVisibleCounts() {
    const visibleRows = document.querySelectorAll('#attendance-table-body tr:not([style="display: none;"])');
    let presentCount = 0;
    let absentCount = 0;

    visibleRows.forEach(row => {
        const statusSelect = row.cells[2].querySelector('select');
        if (statusSelect) {
            if (statusSelect.value === 'present') presentCount++;
            if (statusSelect.value === 'absent') absentCount++;
        }
    });

    document.getElementById('present-today').textContent = presentCount;
    document.getElementById('absent-today').textContent = absentCount;
}

// Modify your updateStatus function to call updateVisibleCounts
function updateStatus(selectElement) {
    const studentId = selectElement.getAttribute('data-student-id');
    const newStatus = selectElement.value;

    selectElement.className = `status-select status-${newStatus}`;

    const student = attendanceData.find(s => s.student_id === studentId);
    if (student) {
        student.status = newStatus;
    }

    updateVisibleCounts();
}

// Modify your applyBulkAction function to call updateVisibleCounts
function applyBulkAction() {
    const bulkStatus = document.getElementById('bulk-status').value;

    const selectElements = document.querySelectorAll('#attendance-table-body select');
    selectElements.forEach(select => {
        // Only update visible rows
        if (select.closest('tr').style.display !== 'none') {
            select.value = bulkStatus;
            select.className = `status-select status-${bulkStatus}`;

            const studentId = select.getAttribute('data-student-id');
            const student = attendanceData.find(s => s.student_id === studentId);
            if (student) {
                student.status = bulkStatus;
            }
        }
    });

    updateVisibleCounts();
}

function updateDailyCounts() {
    const presentCount = attendanceData.filter(s => s.status === 'present').length;
    const absentCount = attendanceData.filter(s => s.status === 'absent').length;

    document.getElementById('present-today').textContent = presentCount;
    document.getElementById('absent-today').textContent = absentCount;
}

function updateClassConfig() {
    const accessToken = localStorage.getItem('access_token');
    const updatedConfig = {
        school: teacherInfo.school,
        school_id: teacherInfo.school_id,
        class_number: teacherInfo.class_assigned,
        total_working_days: parseInt(document.getElementById('working-days-input').value) || 0,
        start_date: document.getElementById('start-date-input').value,
        threshold: parseInt(document.getElementById('threshold-input').value) || 75
    };
    showLoader();
    fetch(`${baseUrl}/updateClass/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify(updatedConfig)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update class config');
            }
            return response.json();
        })
        .then(data => {
            alert('Class configuration updated successfully');
            window.location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update class configuration');
        })
        .finally(() => {
            hideLoader();
        });
}

function saveAttendance() {
    if (!teacherInfo.school_id || !teacherInfo.class_assigned) {
        alert('Class information not loaded yet');
        return;
    }

    const accessToken = localStorage.getItem('access_token');

    const totalStudents = attendanceData.length;

    const countPresentOrAbsent = attendanceData.filter(student =>
        student.status === 'present' || student.status === 'absent'
    ).length;

    const countNotMarked = attendanceData.filter(student =>
        student.status === 'not_marked'
    ).length;

    if (
        countNotMarked === totalStudents ||
        countPresentOrAbsent === totalStudents
    ) {
        const studentsToSave = attendanceData;

        const updates = {
            school: teacherInfo.school,
            school_id: teacherInfo.school_id,
            class_number: teacherInfo.class_assigned,
            date: currentSelectedDate,
            students: studentsToSave.map(student => ({
                student_id: student.student_id,
                name: student.name,
                status: student.status
            }))
        };

        showLoader();

        fetch(`${baseUrl}/updateClassAttendance/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            },
            body: JSON.stringify(updates)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save attendance');
                }
                return response.json();
            })
            .then(data => {
                alert('Attendance saved successfully!');
                window.location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to save attendance');
            })
            .finally(() => {
                hideLoader();
            });

    } else {
        alert('Incomplete attendance: either mark all students or leave all unmarked.');
    }
}

function showAlertModal(studentId, studentName) {
    currentStudentId = studentId;
    document.getElementById('student-name-modal').textContent = studentName;
    document.getElementById('alertModal').style.display = 'block';
}

function sendAlert() {
    if (!currentStudentId) return;

    const student = attendanceData.find(s => s.student_id === currentStudentId);
    if (!student) return;

    const accessToken = localStorage.getItem('access_token');
    showLoader();
    fetch(`${baseUrl}/send-alert/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({
            student_id: currentStudentId,
            present_count: student.present_count,
            percentage: student.percentage
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to send alert');
            }
            return response.json();
        })
        .then(data => {
            alert('Alert sent successfully!');
            document.getElementById('alertModal').style.display = 'none';
            window.location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to send alert');
        })
        .finally(() => {
            hideLoader();
        });
}