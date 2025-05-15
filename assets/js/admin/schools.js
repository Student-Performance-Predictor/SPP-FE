document.addEventListener('DOMContentLoaded', () => {
    const baseUrl = BE_URL;
    const token = localStorage.getItem('access_token');
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    const schoolsTableBody = document.getElementById('schoolsTableBody');
    const addSchoolBtn = document.getElementById('addSchoolBtn');
    const viewModal = document.getElementById('viewSchoolModal');
    const formModal = document.getElementById('schoolFormModal');
    const deleteModal = document.getElementById('deleteConfirmationModal');
    const closeButtons = document.querySelectorAll('.close-btn');
    const cancelSchoolBtn = document.getElementById('cancelSchoolBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const searchInput = document.getElementById('searchSchool');
    const schoolForm = document.getElementById('schoolForm');
    let currentSchoolId = null;
    let schools = [];

    // Initialize the page
    function init() {
        loadComponent('../components/admin_navbar.html', 'sidebar');
        loadComponent('../components/footer.html', 'footer');
        fetchSchools();
        setupEventListeners();
    }

    // Generalized component loader
    function loadComponent(file, elementId) {
        showLoader();
        fetch(file)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(html => {
                document.getElementById(elementId).innerHTML = html;
                addEventListenerFunc();
            })
            .catch(error => {
                console.error(`Error loading ${elementId}:`, error);
            })
            .finally(() => {
                hideLoader();
            });
    }

    // Fetch all schools from API
    function fetchSchools() {
        showLoader();
        fetch(`${baseUrl}/getAllSchools/`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then(handleResponse)
            .then(data => {
                schools = data;
                renderSchoolsTable();
            })
            .catch(showError)
            .finally(() => {
                hideLoader();
            });
    }

    // Fetch a specific school
    function fetchSchool(schoolId) {
        showLoader();
        return fetch(`${baseUrl}/viewSchool/${schoolId}/`, {
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

    // Render schools table
    function renderSchoolsTable(filteredSchools = null) {
        const data = filteredSchools || schools;
        schoolsTableBody.innerHTML = '';

        if (data.length === 0) {
            schoolsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">No schools found. Click "Add School" to create one.</td>
                </tr>
            `;
            return;
        }

        data.forEach(school => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${school.id}</td>
                <td>${school.name}</td>
                <td>${school.school_type}</td>
                <td>${school.board}</td>
                <td>${school.city}, ${school.state}</td>
                <td>${school.email}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-success btn-sm view-btn" data-id="${school.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-secondary btn-sm edit-btn" data-id="${school.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${school.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            schoolsTableBody.appendChild(row);
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Toggle sidebar on mobile
        toggleBtn.addEventListener('click', () => sidebar.classList.toggle('show'));

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992 &&
                !sidebar.contains(e.target) &&
                e.target !== toggleBtn) {
                sidebar.classList.remove('show');
            }
        });

        // Search functionality
        searchInput.addEventListener('keyup', () => {
            const filter = searchInput.value.toLowerCase();
            const filteredSchools = schools.filter(school =>
                school.name.toLowerCase().includes(filter) ||
                school.school_type.toLowerCase().includes(filter) ||
                school.board.toLowerCase().includes(filter) ||
                school.city.toLowerCase().includes(filter) ||
                school.state.toLowerCase().includes(filter) ||
                school.email.toLowerCase().includes(filter)
            );
            renderSchoolsTable(filteredSchools);
        });

        // Add School
        addSchoolBtn.addEventListener('click', () => {
            document.getElementById('schoolModalTitle').textContent = 'Add New School';
            schoolForm.reset();
            document.getElementById('schoolId').value = '';
            formModal.style.display = 'flex';
        });

        // View School (using event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-btn')) {
                const schoolId = parseInt(e.target.closest('.view-btn').getAttribute('data-id'));
                fetchSchool(schoolId)
                    .then(school => {
                        if (school) {
                            populateViewModal(school);
                            viewModal.style.display = 'flex';
                        }
                    })
                    .catch(showError);
            }
        });

        // Edit School (using event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-btn')) {
                const schoolId = parseInt(e.target.closest('.edit-btn').getAttribute('data-id'));
                currentSchoolId = schoolId;
                fetchSchool(schoolId)
                    .then(school => {
                        if (school) {
                            document.getElementById('schoolModalTitle').textContent = 'Edit School';
                            populateForm(school);
                            formModal.style.display = 'flex';
                        }
                    })
                    .catch(showError);
            }
        });

        // Delete School (using event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                currentSchoolId = parseInt(e.target.closest('.delete-btn').getAttribute('data-id'));
                deleteModal.style.display = 'flex';
            }
        });

        // Save School
        schoolForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveSchool();
        });

        // Confirm Delete
        confirmDeleteBtn.addEventListener('click', () => {
            deleteSchool(currentSchoolId);
            deleteModal.style.display = 'none';
        });

        // Close modals
        closeButtons.forEach(button => {
            button.addEventListener('click', () => button.closest('.modal').style.display = 'none');
        });

        cancelSchoolBtn.addEventListener('click', () => formModal.style.display = 'none');
        cancelDeleteBtn.addEventListener('click', () => deleteModal.style.display = 'none');

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });

        // Check footer position on resize
        window.addEventListener('resize', addEventListenerFunc);
    }

    // Populate view modal with school data
    function populateViewModal(school) {
        document.getElementById('modal-body').innerHTML = `
            <div class="detail-group">
                <h3>${school.name}</h3>
                <p><strong>Type:</strong> ${school.school_type}</p>
                <p><strong>Board:</strong> ${school.board}</p>
                <p><strong>Medium:</strong> ${school.medium}</p>
                <p><strong>Registration Number:</strong> ${school.registration_number}</p>
            </div>
            
            <div class="detail-group">
                <h4>Contact Information</h4>
                <p><strong>Email:</strong> ${school.email}</p>
                <p><strong>Phone:</strong> ${school.phone}</p>
            </div>
            
            <div class="detail-group">
                <h4>Address</h4>
                <p>${school.address}</p>
                <p>${school.city}, ${school.state} ${school.pincode}</p>
            </div>
        `;
    }

    // Populate form with school data
    function populateForm(school) {
        document.getElementById('schoolId').value = school.id;
        document.getElementById('schoolName').value = school.name;
        document.getElementById('schoolType').value = school.school_type;
        document.getElementById('schoolBoard').value = school.board;
        document.getElementById('schoolMedium').value = school.medium;
        document.getElementById('schoolEmail').value = school.email;
        document.getElementById('schoolPhone').value = school.phone;
        document.getElementById('schoolAddress').value = school.address;
        document.getElementById('schoolCity').value = school.city;
        document.getElementById('schoolState').value = school.state;
        document.getElementById('schoolPincode').value = school.pincode;
        document.getElementById('schoolRegNumber').value = school.registration_number;
    }

    // Save school (add or update)
    function saveSchool() {
        const id = document.getElementById('schoolId').value;
        const schoolData = {
            name: document.getElementById('schoolName').value,
            school_type: document.getElementById('schoolType').value,
            board: document.getElementById('schoolBoard').value,
            medium: document.getElementById('schoolMedium').value,
            email: document.getElementById('schoolEmail').value,
            phone: document.getElementById('schoolPhone').value,
            address: document.getElementById('schoolAddress').value,
            city: document.getElementById('schoolCity').value,
            state: document.getElementById('schoolState').value,
            pincode: document.getElementById('schoolPincode').value,
            registration_number: document.getElementById('schoolRegNumber').value,
        };
        const url = id ? `${baseUrl}/updateSchool/${id}/` : `${baseUrl}/addSchool/`;
        const method = id ? 'PUT' : 'POST';
        showLoader();
        fetch(url, {
            method: method,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(schoolData)
        })
            .then(handleResponse)
            .then((response) => {
                alert(response.message);
                fetchSchools();
                formModal.style.display = 'none';
            })
            .catch(showError)
            .finally(() => {
                hideLoader();
            });
    }

    // Delete school
    function deleteSchool(id) {
        showLoader();
        fetch(`${baseUrl}/deleteSchool/${id}/`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then(handleResponse)
            .then((response) => {
                alert(response.message);
                fetchSchools();
            })
            .catch(showError)
            .finally(() => {
                hideLoader();
            });
    }

    // Event Listeners for navbar and footer
    function addEventListenerFunc() {
        const currentPath = window.location.pathname.split(/[?#]/)[0];
        const navItems = document.querySelectorAll('.nav-item')
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        navItems.forEach(item => {
            const onclickAttr = item.getAttribute('onclick');
            if (onclickAttr) {
                const pathMatch = onclickAttr.match(/window\.location\.href\s*=\s*'([^']*)'/);
                if (pathMatch && pathMatch[1]) {
                    const itemPath = new URL(pathMatch[1], window.location.origin).pathname;
                    if (currentPath === itemPath) {
                        item.classList.add('active');
                    }
                }
            }
        });
        const footer = document.querySelector('footer');
        if (!footer) return;
        footer.classList.toggle(
            'fixed',
            document.body.scrollHeight <= window.innerHeight
        );
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
            return response.json().then(error => {
                alert(error);
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

    // Initialize the page
    init();
});