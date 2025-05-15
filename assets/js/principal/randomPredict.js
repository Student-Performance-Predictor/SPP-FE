const baseUrl = BE_URL;
let profileImageEl = null;
const accessToken = localStorage.getItem('access_token');

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('predictionForm');
    form.addEventListener('submit', handleFormSubmit);

    const randomizeBtn = document.getElementById('randomizeBtn');
    randomizeBtn.addEventListener('click', generateRandomStudent);

    init();
});

function init() {
    loadComponent("../components/principals_navbar.html", "principal_navbar");
    loadComponent("../components/footer.html", "footer");
    setTimeout(() => {
        fetchPrincipalInfo();
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

function fetchPrincipalInfo() {
    if (!accessToken) {
        console.error('No access token found');
        document.getElementById('predictionError').style.display = 'block';
        document.getElementById('predictionError').textContent = 'Please log in to continue.';
        return;
    }

    showLoader();
    fetch(`${baseUrl}/principal/me/`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch principal info');
            }
            return response.json();
        })
        .then(data => {
            const profileImageUrl = data.profile_image
                ? `${baseUrl}/${data.profile_image}/`
                : "https://via.placeholder.com/80";
            profileImageEl.src = profileImageUrl;
            const navbarProfileImg = document.getElementById("profileImage");
            if (navbarProfileImg) {
                navbarProfileImg.src = profileImageUrl;
            }
        })
        .catch(error => {
            console.error('Error fetching principal info:', error);
            document.getElementById('predictionError').style.display = 'block';
            document.getElementById('predictionError').textContent = 'Failed to load principal information.';
        })
        .finally(() => {
            hideLoader();
        });
}

function generateRandomStudent() {
    document.getElementById('attendance').value = Math.floor(Math.random() * 81) + 20; // 20-100%
    document.getElementById('parentalEducation').value = Math.floor(Math.random() * 5) + 1; // 1-5
    document.getElementById('studyHours').value = Math.floor(Math.random() * 30) + 1; // 1-30 hours
    document.getElementById('failures').value = Math.floor(Math.random() * 10); // 0-9 failures
    document.getElementById('extracurricular').value = Math.random() > 0.5 ? '1' : '0';
    document.getElementById('participation').value = Math.floor(Math.random() * 10) + 1; // 1-10
    document.getElementById('teacherRating').value = Math.floor(Math.random() * 5) + 1; // 1-5
    document.getElementById('discipline').value = Math.floor(Math.random() * 6); // 0-5
    document.getElementById('lateSubmissions').value = Math.floor(Math.random() * 10); // 0-9
    document.getElementById('prevGrade1').value = Math.floor(Math.random() * 100) + 1; // 1-100
    document.getElementById('prevGrade2').value = Math.floor(Math.random() * 100) + 1; // 1-100
}

function handleFormSubmit(e) {
    e.preventDefault();

    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('resultContainer').style.display = 'none';
    document.getElementById('predictionError').style.display = 'none';

    const inputs = {
        Attendance_Percentage: parseFloat(document.getElementById('attendance').value),
        Parental_Education: parseInt(document.getElementById('parentalEducation').value),
        Study_Hours_Per_Week: parseFloat(document.getElementById('studyHours').value),
        Failures: parseInt(document.getElementById('failures').value),
        Extra_Curricular: parseInt(document.getElementById('extracurricular').value),
        Participation_Score: parseInt(document.getElementById('participation').value),
        Teacher_Rating: parseInt(document.getElementById('teacherRating').value),
        Discipline_Issues: parseInt(document.getElementById('discipline').value),
        Late_Submissions: parseInt(document.getElementById('lateSubmissions').value),
        Previous_Grade_1: parseFloat(document.getElementById('prevGrade1').value),
        Previous_Grade_2: parseFloat(document.getElementById('prevGrade2').value)
    };

    // Basic input validation
    for (const [key, value] of Object.entries(inputs)) {
        if (isNaN(value)) {
            document.getElementById('loadingIndicator').style.display = 'none';
            document.getElementById('predictionError').style.display = 'block';
            document.getElementById('predictionError').textContent = `Invalid input for ${key.replace(/_/g, ' ')}. Please enter a valid number.`;
            return;
        }
    }

    showLoader();
    fetch(`${baseUrl}/predictRandom/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputs)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to predict grade');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('loadingIndicator').style.display = 'none';

            const resultContainer = document.getElementById('resultContainer');
            const predictedGradeElement = document.getElementById('predictedGrade');
            const gradeInterpretationElement = document.getElementById('gradeInterpretation');

            const predictedGrade = parseFloat(data.data.final_grade).toFixed(1);
            predictedGradeElement.textContent = predictedGrade;

            if (predictedGrade >= 75) {
                predictedGradeElement.className = 'final-grade predictedGreat';
                gradeInterpretationElement.textContent = 'Excellent performance predicted!';
            } else if (predictedGrade >= 40) {
                predictedGradeElement.className = 'final-grade predictedMedium';
                gradeInterpretationElement.textContent = 'Average performance predicted.';
            } else {
                predictedGradeElement.className = 'final-grade predictedLow';
                gradeInterpretationElement.textContent = 'Needs improvement. Consider additional support.';
            }

            resultContainer.style.display = 'block';
        })
        .catch(error => {
            console.error('Error predicting grade:', error);
            document.getElementById('loadingIndicator').style.display = 'none';
            document.getElementById('predictionError').style.display = 'block';
            document.getElementById('predictionError').textContent = 'Error predicting grade. Please try again.';
        })
        .finally(() => {
            hideLoader();
        });
}