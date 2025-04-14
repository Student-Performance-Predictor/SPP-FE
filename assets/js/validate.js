async function validateSession() {
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!accessToken || !refreshToken) {
        alert("You are not authorized! Redirecting to login.");
        removeSessionData();
        window.location.href = "../login.html";
        return false;
    }

    const isValid = await checkTokenValidity(accessToken);

    if (isValid) {
        return true;
    } else {
        const refreshed = await refreshAccessToken(refreshToken);
        return refreshed;
    }
}

async function checkTokenValidity(token) {
    try {
        const response = await fetch("http://127.0.0.1:8000/validate-token/", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            return true;
        } else if (response.status === 401) {
            return false;
        } else {
            throw new Error("Unexpected response");
        }
    } catch (error) {
        console.error("Token validation failed:", error);
        return false;
    }
}

async function refreshAccessToken(refreshToken) {
    try {
        const response = await fetch("http://127.0.0.1:8000/token/refresh/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        const data = await response.json();

        if (response.ok && data.access) {
            localStorage.setItem("access_token", data.access);
            alert("Session refreshed!");
            return true;
        } else {
            throw new Error(data.detail || "Session refresh failed");
        }
    } catch (error) {
        console.error("Error refreshing token:", error);
        alert("Session expired! Redirecting to login.");
        removeSessionData();
        window.location.href = "../login.html";
        return false;
    }
}

function removeSessionData() {
    localStorage.clear();
}

validateSession();