document.addEventListener('DOMContentLoaded', () => {
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
    const saveSchoolBtn = document.getElementById('saveSchoolBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const searchInput = document.getElementById('searchSchool');
    const schoolForm = document.getElementById('schoolForm');
    let currentSchoolId = null;

    // Initialize the page
    function init() {
        loadComponent('../components/admin_navbar.html', 'sidebar');
        loadComponent('../components/footer.html', 'footer');
        renderSchoolsTable();
        setupEventListeners();
    }

    // Generalized component loader
    function loadComponent(file, elementId) {
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

            });
    }

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
                <td>${school.type}</td>
                <td>${school.board}</td>
                <td>${school.location}</td>
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
                school.type.toLowerCase().includes(filter) ||
                school.board.toLowerCase().includes(filter) ||
                school.location.toLowerCase().includes(filter) ||
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
                const school = schools.find(s => s.id === schoolId);
                if (school) {
                    populateViewModal(school);
                    viewModal.style.display = 'flex';
                }
            }
        });

        // Edit School (using event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-btn')) {
                const schoolId = parseInt(e.target.closest('.edit-btn').getAttribute('data-id'));
                const school = schools.find(s => s.id === schoolId);
                if (school) {
                    currentSchoolId = schoolId;
                    document.getElementById('schoolModalTitle').textContent = 'Edit School';
                    populateForm(school);
                    formModal.style.display = 'flex';
                }
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
                <p><strong>Type:</strong> ${school.type}</p>
                <p><strong>Board:</strong> ${school.board}</p>
                <p><strong>Medium:</strong> ${school.medium}</p>
                <p><strong>Registration Number:</strong> ${school.regNumber}</p>
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
        document.getElementById('schoolType').value = school.type;
        document.getElementById('schoolBoard').value = school.board;
        document.getElementById('schoolMedium').value = school.medium;
        document.getElementById('schoolEmail').value = school.email;
        document.getElementById('schoolPhone').value = school.phone;
        document.getElementById('schoolAddress').value = school.address;
        document.getElementById('schoolCity').value = school.city;
        document.getElementById('schoolState').value = school.state;
        document.getElementById('schoolPincode').value = school.pincode;
        document.getElementById('schoolRegNumber').value = school.regNumber;
    }

    // Save school (add or update)
    function saveSchool() {
        const id = document.getElementById('schoolId').value;
        const schoolData = {
            name: document.getElementById('schoolName').value,
            type: document.getElementById('schoolType').value,
            board: document.getElementById('schoolBoard').value,
            medium: document.getElementById('schoolMedium').value,
            email: document.getElementById('schoolEmail').value,
            phone: document.getElementById('schoolPhone').value,
            address: document.getElementById('schoolAddress').value,
            city: document.getElementById('schoolCity').value,
            state: document.getElementById('schoolState').value,
            pincode: document.getElementById('schoolPincode').value,
            regNumber: document.getElementById('schoolRegNumber').value,
            location: `${document.getElementById('schoolCity').value}, ${document.getElementById('schoolState').value}`
        };

        if (id) {
            // Update existing school
            const index = schools.findIndex(s => s.id === parseInt(id));
            if (index !== -1) {
                schools[index] = { ...schools[index], ...schoolData };
            }
        } else {
            // Add new school
            const newId = schools.length > 0 ? Math.max(...schools.map(s => s.id)) + 1 : 1;
            schools.push({ id: newId, ...schoolData });
        }

        renderSchoolsTable();
        formModal.style.display = 'none';
    }

    // Delete school
    function deleteSchool(id) {
        const index = schools.findIndex(s => s.id === id);
        if (index !== -1) {
            schools.splice(index, 1);
            renderSchoolsTable();
        }
    }

    // Check if footer should be fixed or static
    function addEventListenerFunc() {
        const currentPath = window.location.pathname.split(/[?#]/)[0];

        // Get all nav items
        const navItems = document.querySelectorAll('.nav-item');

        // Remove active class from all items
        navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Find matching item and make it active
        navItems.forEach(item => {
            // Extract the path from the onclick handler
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
    }

    // Initialize the page
    init();
});

/*document.addEventListener('DOMContentLoaded', () => {
    const baseUrl = 'http://your-api-base-url'; // Replace with your actual API base URL
    const token = localStorage.getItem('token'); // Assuming you store the JWT token in localStorage
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
    const saveSchoolBtn = document.getElementById('saveSchoolBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const searchInput = document.getElementById('searchSchool');
    const schoolForm = document.getElementById('schoolForm');
    let currentSchoolId = null;
    let schools = []; // This will be populated from the API

    // Initialize the page
    function init() {
        loadComponent('../components/admin_navbar.html', 'sidebar');
        loadComponent('../components/footer.html', 'footer');
        fetchSchools();
        setupEventListeners();
    }

    // Generalized component loader
    function loadComponent(file, elementId) {
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
            });
    }

    // Fetch all schools from API
    function fetchSchools() {
        fetch(`${baseUrl}/schools`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
        .then(handleResponse)
        .then(data => {
            schools = schoolsData;
            renderSchoolsTable();
        })
        .catch(showError);
    }

    // Fetch a specific school
    function fetchSchool(schoolId) {
        return fetch(`${baseUrl}/schools/${schoolId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
        .then(handleResponse)
        .catch(showError);
    }

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
                <td>${school.type}</td>
                <td>${school.board}</td>
                <td>${school.location}</td>
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
                school.type.toLowerCase().includes(filter) ||
                school.board.toLowerCase().includes(filter) ||
                school.location.toLowerCase().includes(filter) ||
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
                <p><strong>Type:</strong> ${school.type}</p>
                <p><strong>Board:</strong> ${school.board}</p>
                <p><strong>Medium:</strong> ${school.medium}</p>
                <p><strong>Registration Number:</strong> ${school.regNumber}</p>
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
        document.getElementById('schoolType').value = school.type;
        document.getElementById('schoolBoard').value = school.board;
        document.getElementById('schoolMedium').value = school.medium;
        document.getElementById('schoolEmail').value = school.email;
        document.getElementById('schoolPhone').value = school.phone;
        document.getElementById('schoolAddress').value = school.address;
        document.getElementById('schoolCity').value = school.city;
        document.getElementById('schoolState').value = school.state;
        document.getElementById('schoolPincode').value = school.pincode;
        document.getElementById('schoolRegNumber').value = school.regNumber;
    }

    // Save school (add or update)
    function saveSchool() {
        const id = document.getElementById('schoolId').value;
        const schoolData = {
            name: document.getElementById('schoolName').value,
            type: document.getElementById('schoolType').value,
            board: document.getElementById('schoolBoard').value,
            medium: document.getElementById('schoolMedium').value,
            email: document.getElementById('schoolEmail').value,
            phone: document.getElementById('schoolPhone').value,
            address: document.getElementById('schoolAddress').value,
            city: document.getElementById('schoolCity').value,
            state: document.getElementById('schoolState').value,
            pincode: document.getElementById('schoolPincode').value,
            regNumber: document.getElementById('schoolRegNumber').value,
            location: `${document.getElementById('schoolCity').value}, ${document.getElementById('schoolState').value}`
        };

        const url = id ? `${baseUrl}/schools/${id}` : `${baseUrl}/schools`;
        const method = id ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(schoolData)
        })
        .then(handleResponse)
        .then(() => {
            fetchSchools(); // Refresh the list
            formModal.style.display = 'none';
        })
        .catch(showError);
    }

    // Delete school
    function deleteSchool(id) {
        fetch(`${baseUrl}/schools/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
        .then(handleResponse)
        .then(() => {
            fetchSchools(); // Refresh the list
        })
        .catch(showError);
    }

    // Check if footer should be fixed or static
    function addEventListenerFunc() {
        const currentPath = window.location.pathname.split(/[?#]/)[0];
    
        // Get all nav items
        const navItems = document.querySelectorAll('.nav-item');
        
        // Remove active class from all items
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Find matching item and make it active
        navItems.forEach(item => {
            // Extract the path from the onclick handler
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
    }

    // Handle API response
    function handleResponse(response) {
        return response.json().then((data) => {
            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! Status: ${response.status}`);
            }
            return data;
        });
    }    

    // Show error messages
    function showError(error) {
        console.error("Error: ", error);
        const errorMessage = error.message || "An error occurred.";
    
        if (errorMessage.includes("401")) {
            alert("Session expired. Redirecting to login...");
            window.location.href = "../index.html";
        } else {
            alert(errorMessage);
        }
    }

    // Initialize the page
    init();
});*/