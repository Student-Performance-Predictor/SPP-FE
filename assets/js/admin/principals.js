document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = BE_URL;
    const token = localStorage.getItem('access_token');
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    const principalsTableBody = document.getElementById('principalsTableBody');
    const addPrincipalBtn = document.getElementById('addPrincipalBtn');
    const viewModal = document.getElementById('viewPrincipalModal');
    const formModal = document.getElementById('principalFormModal');
    const deleteModal = document.getElementById('deleteConfirmationModal');
    const closeButtons = document.querySelectorAll('.close-btn');
    const cancelPrincipalBtn = document.getElementById('cancelPrincipalBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const searchInput = document.getElementById('searchPrincipal');
    const principalForm = document.getElementById('principalForm');
    const schoolDropdown = document.getElementById('principalSchool');
    let principals = [];
    let currentPrincipalId = null;

    // Initialize the page
    function init() {
        loadComponent('../components/admin_navbar.html', 'sidebar');
        loadComponent('../components/footer.html', 'footer');
        fetchPrincipals();
        setupEventListeners();
        populateSchoolDropdown();
    }

    // Generalized component loader
    function loadComponent(url, elementId) {
        fetch(url)
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
            });
    }

    // Fetch all principals from API
    function fetchPrincipals() {
        showLoader();
        fetch(`${baseUrl}/getAllPrincipals/`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then(handleResponse)
            .then(data => {
                principals = data;
                renderPrincipalsTable();
            })
            .catch(showError)
            .finally(() => {
                hideLoader();
            });
    }

    // Fetch a specific principal
    function fetchPrincipal(principalId) {
        showLoader();
        return fetch(`${baseUrl}/viewPrincipal/${principalId}/`, {
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

    // Populate school dropdown
    function populateSchoolDropdown() {
        schoolDropdown.innerHTML = '<option value="">Select School</option>';
        showLoader();
        fetch(`${baseUrl}/getSchoolNames/`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then(handleResponse)
            .then(data => {
                schools = data.schools;
                data.schools.forEach((school) => {
                    const option = document.createElement('option');
                    option.value = school.id;
                    option.textContent = school.name;
                    schoolDropdown.appendChild(option);
                });
            })
            .catch(showError)
            .finally(() => {
                hideLoader();
            });
    }

    // Render principals table
    function renderPrincipalsTable(filteredPrincipals = null) {
        const data = filteredPrincipals || principals;
        principalsTableBody.innerHTML = '';

        if (data.length === 0) {
            principalsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center;">No principals found. Click "Add Principal" to create one.</td>
                </tr>
            `;
            return;
        }

        data.forEach(principal => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${principal.id}</td>
                <td>${principal.name}</td>
                <td>${principal.email}</td>
                <td>${principal.phone}</td>
                <td>${principal.school}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-success btn-sm view-btn" data-id="${principal.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-secondary btn-sm edit-btn" data-id="${principal.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${principal.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            principalsTableBody.appendChild(row);
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
            const filteredPrincipals = principals.filter(principal =>
                principal.name.toLowerCase().includes(filter) ||
                principal.email.toLowerCase().includes(filter) ||
                principal.phone.toLowerCase().includes(filter) ||
                principal.school.toLowerCase().includes(filter)
            );
            renderPrincipalsTable(filteredPrincipals);
        });

        // Add Principal
        addPrincipalBtn.addEventListener('click', () => {
            document.getElementById('principalModalTitle').textContent = 'Add New Principal';
            principalForm.reset();
            document.getElementById('principalId').value = '';
            formModal.style.display = 'flex';
        });

        // View Principal (using event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-btn')) {
                const principalId = parseInt(e.target.closest('.view-btn').getAttribute('data-id'));
                fetchPrincipal(principalId)
                    .then(principal => {
                        if (principal) {
                            populateViewModal(principal);
                            viewModal.style.display = 'flex';
                        }
                    })
                    .catch(showError);
            }
        });

        // Edit Principal (using event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-btn')) {
                const principalId = parseInt(e.target.closest('.edit-btn').getAttribute('data-id'));
                currentPrincipalId = principalId;
                fetchPrincipal(principalId)
                    .then(principal => {
                        if (principal) {
                            document.getElementById('principalModalTitle').textContent = 'Edit Principal';
                            populateForm(principal);
                            formModal.style.display = 'flex';

                        }
                    })
                    .catch(showError);
            }
        });

        // Delete Principal (using event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                currentPrincipalId = parseInt(e.target.closest('.delete-btn').getAttribute('data-id'));
                deleteModal.style.display = 'flex';
            }
        });

        // Save Principal
        principalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savePrincipal();
        });

        // Confirm Delete
        confirmDeleteBtn.addEventListener('click', () => {
            deletePrincipal(currentPrincipalId);
            deleteModal.style.display = 'none';
        });

        // Close modals
        closeButtons.forEach(button => {
            button.addEventListener('click', () => button.closest('.modal').style.display = 'none');
        });

        cancelPrincipalBtn.addEventListener('click', () => formModal.style.display = 'none');
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

    // Populate view modal with principal data
    function populateViewModal(principal) {
        document.getElementById('principal-modal-body').innerHTML = `
            <div class="detail-group">
                <h3>${principal.name}</h3>
                <p><strong>Email:</strong> ${principal.email}</p>
                <p><strong>Phone:</strong> ${principal.phone}</p>
                <p><strong>Date of Birth:</strong> ${principal.date_of_birth.split('-').reverse().join('-')}</p>
                <p><strong>Assigned School:</strong> ${principal.school}</p>
            </div>
            
            <div class="detail-group">
                <h4>Address</h4>
                <p>${principal.address}</p>
                <p>${principal.city}, ${principal.state} ${principal.pincode}</p>
            </div>
        `;
    }

    // Populate form with principal data
    function populateForm(principal) {
        document.getElementById('principalId').value = principal.id;
        document.getElementById('principalName').value = principal.name;
        document.getElementById('principalEmail').value = principal.email;
        document.getElementById('principalPhone').value = principal.phone;
        document.getElementById('principalDob').value = principal.date_of_birth;
        document.getElementById('principalAddress').value = principal.address;
        document.getElementById('principalCity').value = principal.city;
        document.getElementById('principalState').value = principal.state;
        document.getElementById('principalPincode').value = principal.pincode;
        document.getElementById('principalSchool').value = principal.school_id;
    }

    // Save principal (add or update)
    function savePrincipal() {
        const id = document.getElementById('principalId').value;
        const schoolId = parseInt(document.getElementById('principalSchool').value);
        fetchSchool(schoolId)
            .then(school => {
                const principalData = {
                    name: document.getElementById('principalName').value,
                    email: document.getElementById('principalEmail').value,
                    phone: document.getElementById('principalPhone').value,
                    date_of_birth: document.getElementById('principalDob').value.split('-').reverse().join('-'),
                    address: document.getElementById('principalAddress').value,
                    city: document.getElementById('principalCity').value,
                    state: document.getElementById('principalState').value,
                    pincode: document.getElementById('principalPincode').value,
                    school: school.name,
                    school_id: school.id
                };
                const url = id ? `${baseUrl}/updatePrincipal/${id}/` : `${baseUrl}/addPrincipal/`;
                const method = id ? 'PUT' : 'POST';
                showLoader();
                fetch(url, {
                    method: method,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(principalData)
                })
                    .then(handleResponse)
                    .then((response) => {
                        alert(response.message);
                        fetchPrincipals();
                        formModal.style.display = 'none';
                    })
                    .catch(showError)
                    .finally(() => {
                        hideLoader();
                    });
            })
            .catch(showError);
    }

    // Delete principal
    function deletePrincipal(id) {
        showLoader();
        fetch(`${baseUrl}/deletePrincipal/${id}/`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then(handleResponse)
            .then((response) => {
                alert(response.message);
                fetchPrincipals();
            })
            .catch(showError)
            .finally(() => {
                hideLoader();
            });
    }

    // Event Listeners for navbar and footer
    function addEventListenerFunc() {
        const currentPath = window.location.pathname.split(/[?#]/)[0];
        const navItems = document.querySelectorAll('.nav-item');
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

    // Initialize the page
    init();
});