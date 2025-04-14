const schools = [
    {
        id: 1,
        name: "Greenwood High",
        type: "Private",
        board: "CBSE",
        medium: "English",
        email: "info@greenwood.edu",
        phone: "9876543210",
        address: "123 Education Street",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        regNumber: "SCH12345",
        location: "Bangalore, Karnataka"
    },
    {
        id: 2,
        name: "National Public School",
        type: "Private",
        board: "ICSE",
        medium: "English",
        email: "contact@nps.edu",
        phone: "8765432109",
        address: "456 Knowledge Avenue",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        regNumber: "SCH67890",
        location: "Delhi, Delhi"
    },
    {
        id: 3,
        name: "Government Higher Secondary School",
        type: "Government",
        board: "State",
        medium: "Hindi",
        email: "ghss@edu.gov",
        phone: "7654321098",
        address: "789 Learning Road",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
        regNumber: "SCH24680",
        location: "Jaipur, Rajasthan"
    }
];

// Principal data array
const principals = [
    {
        id: 1,
        name: "Dr. Rajesh Kumar",
        email: "rajesh.kumar@greenwood.edu",
        phone: "9876543210",
        dob: "1975-05-15",
        address: "123 Principal Avenue",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        schoolId: 1,
        school: "Greenwood High"
    },
    {
        id: 2,
        name: "Ms. Priya Sharma",
        email: "priya.sharma@nps.edu",
        phone: "8765432109",
        dob: "1980-08-22",
        address: "456 Education Lane",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        schoolId: 2,
        school: "National Public School"
    },
    {
        id: 3,
        name: "Mr. Vijay Singh",
        email: "vijay.singh@ghss.edu",
        phone: "7654321098",
        dob: "1972-11-30",
        address: "789 School Road",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
        schoolId: 3,
        school: "Government Higher Secondary School"
    }
];

function showLoader() {
    document.getElementById("loader").style.display = "block";
}

function hideLoader() {
    document.getElementById("loader").style.display = "none";
}

const BE_URL = "http://127.0.0.1:8000"