document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = BE_URL;
  let originalLoginHTML = document.querySelector(".form-section").innerHTML;
  const loginForm = document.querySelector(".login-form");
  const emailField = document.getElementById("teacherMail");
  const passwordField = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("togglePassword");

  // Track OTP state
  let otpRequiredEmail = null;

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", function () {
      const icon = this.querySelector("i");
      if (passwordField.type === "password") {
        passwordField.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
      } else {
        passwordField.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
      }
    });
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailField.value.trim();
    const password = passwordField.value.trim();

    if (!email || !password) {
      alert("Please enter both Email and Password.");
      return;
    }

    showLoader();

    fetch(`${baseUrl}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then(handleResponse)
      .then((data) => {

        alert(data.message ?? "Request success");

        // -------------------------
        // CASE 1: MFA DISABLED
        // -------------------------
        if (data.mfa === false) {

          // No access token means invalid state
          if (!data.access || !data.refresh) {
            alert("Invalid login state. No tokens received.");
            hideLoader();
            return;
          }

          // Store tokens
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("refresh_token", data.refresh);
          localStorage.setItem("role", data.type);

          redirectUser(data.type);
          return;
        }

        // -------------------------
        // CASE 2: MFA ENABLED
        // -------------------------
        if (data.mfa === true) {

          // No tokens returned yet → OTP REQUIRED
          if (!data.access) {
            otpRequiredEmail = email;
            showOTPInput();
            hideLoader();
            return;
          }

          // Tokens received → redirect
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("refresh_token", data.refresh);
          localStorage.setItem("role", data.type);

          redirectUser(data.type);
          return;
        }
      })
      .catch(showError)
      .finally(hideLoader);
  });

  function showOTPInput() {
    const formSection = document.querySelector(".form-section");

    formSection.innerHTML = `
      <div class="login-form otp-container animate-slide-up">

        <div style="text-align: center; margin-bottom: 25px;">
          <div style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            border-radius: 12px;
            margin-bottom: 15px;
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
          ">
            <i class="fas fa-shield-alt" style="font-size: 28px; color: white;"></i>
          </div>
          
          <h2 class="animate-fade-in" style="margin-bottom: 8px; color: #2c3e50;">
            Two-Factor Verification
          </h2>
          
          <p class="animate-fade-in" style="color: #666; margin-bottom: 5px; font-size: 14px;">
            Enter the 6-digit code sent to
          </p>
          <p class="animate-fade-in" style="color: #3498db; font-weight: 600; font-size: 14px;">
            ${otpRequiredEmail}
          </p>
        </div>

        <!-- OTP INPUT BOXES -->
        <div class="otp-input-wrapper animate-fade-in" style="
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 30px;
        ">
          ${[1,2,3,4,5,6].map(i => `
            <input 
              type="text" 
              maxlength="1" 
              class="otp-box" 
              id="otp-${i}"
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="one-time-code"
              style="
                width: 50px;
                height: 50px;
                text-align: center;
                font-size: 24px;
                font-weight: 600;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                background: #fff;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              "
              onfocus="this.style.borderColor='#3498db'; this.style.boxShadow='0 2px 12px rgba(52, 152, 219, 0.2)';"
              onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)';"
              onpaste="handleOTPPaste(event)"
            >
          `).join("")}
        </div>

        <button class="btn btn-primary animate-fade-in" id="verifyOtpBtn" style="
          width: 100%;
          padding: 14px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          margin-bottom: 15px;
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          border: none;
          transition: all 0.3s ease;
          color: white;
        ">
          <i class="fas fa-check-circle" style="margin-right: 10px;"></i>
          Verify & Continue
        </button>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
          <button class="btn btn-secondary" id="resendOtpBtn" disabled style="
            background: #f8f9fa;
            border: 2px solid #e0e0e0;
            color: #666;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            flex: 1;
            margin-right: 10px;
          ">
            <i class="fas fa-redo" style="margin-right: 8px;"></i>
            <span id="resendText">Resend OTP (30s)</span>
          </button>

          <button class="btn btn-text-link" id="backBtn" style="
            background: transparent;
            border: none;
            color: #3498db;
            padding: 10px 15px;
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s ease;
            flex-shrink: 0;
          ">
            <i class="fas fa-arrow-left" style="margin-right: 6px;"></i>
            Back to Login
          </button>
        </div>

        <p id="otpStatus" style="
          text-align: center;
          margin-top: 15px;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          display: none;
        "></p>

        <div style="
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        ">
          <p style="color: #888; font-size: 12px; margin-bottom: 5px;">
            Didn't receive the code?
          </p>
          <p style="color: #666; font-size: 12px;">
            Check your spam folder or ensure your email is correct.
          </p>
        </div>

      </div>
    `;

    document.getElementById("verifyOtpBtn").onclick = verifyOTP;
    document.getElementById("resendOtpBtn").onclick = resendOTP;
    document.getElementById("backBtn").onclick = goBackToLogin;

    // Add hover effects
    const verifyBtn = document.getElementById("verifyOtpBtn");
    const resendBtn = document.getElementById("resendOtpBtn");
    const backBtn = document.getElementById("backBtn");

    verifyBtn.addEventListener("mouseenter", () => {
      verifyBtn.style.transform = "translateY(-2px)";
      verifyBtn.style.boxShadow = "0 8px 25px rgba(52, 152, 219, 0.3)";
    });
    verifyBtn.addEventListener("mouseleave", () => {
      verifyBtn.style.transform = "translateY(0)";
      verifyBtn.style.boxShadow = "none";
    });

    resendBtn.addEventListener("mouseenter", function() {
      if (!this.disabled) {
        this.style.borderColor = "#3498db";
        this.style.color = "#3498db";
        this.style.transform = "translateY(-1px)";
      }
    });
    resendBtn.addEventListener("mouseleave", function() {
      if (!this.disabled) {
        this.style.borderColor = "#e0e0e0";
        this.style.color = "#666";
        this.style.transform = "translateY(0)";
      }
    });

    backBtn.addEventListener("mouseenter", function() {
      this.style.color = "#2980b9";
      this.style.transform = "translateX(-3px)";
    });
    backBtn.addEventListener("mouseleave", function() {
      this.style.color = "#3498db";
      this.style.transform = "translateX(0)";
    });

    activateOTPInputs();
    startResendTimer();
  }

  // Handle OTP paste functionality
  window.handleOTPPaste = function(event) {
    event.preventDefault();
    const pasteData = (event.clipboardData || window.clipboardData).getData('text');
    const digits = pasteData.replace(/\D/g, '').slice(0, 6).split('');
    
    const inputs = document.querySelectorAll('.otp-box');
    inputs.forEach((input, index) => {
      if (digits[index]) {
        input.value = digits[index];
        input.style.borderColor = '#3498db';
        input.style.boxShadow = '0 2px 12px rgba(52, 152, 219, 0.2)';
      }
    });
    
    if (digits.length === 6) {
      inputs[5].focus();
      setTimeout(() => {
        document.getElementById("verifyOtpBtn").focus();
      }, 50);
    } else if (digits.length > 0) {
      inputs[digits.length].focus();
    }
  };

  function activateOTPInputs() {
    const inputs = document.querySelectorAll(".otp-box");

    inputs[0].focus();

    inputs.forEach((input, index) => {
      // Only allow numeric input
      input.addEventListener("input", (e) => {
        // Remove non-numeric characters
        input.value = input.value.replace(/\D/g, '');
        
        // Add visual feedback
        if (input.value) {
          input.style.borderColor = '#3498db';
          input.style.boxShadow = '0 2px 12px rgba(52, 152, 219, 0.2)';
          input.style.transform = 'scale(1.05)';
          
          setTimeout(() => {
            input.style.transform = 'scale(1)';
          }, 150);
        } else {
          input.style.borderColor = '#e0e0e0';
          input.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
        }
        
        if (input.value.length === 1 && index < 5) {
          inputs[index + 1].focus();
        }
        
        // Auto-submit when all 6 digits are entered
        if (index === 5 && input.value.length === 1) {
          const allFilled = [...inputs].every(i => i.value.length === 1);
          if (allFilled) {
            setTimeout(() => {
              document.getElementById("verifyOtpBtn").click();
            }, 100);
          }
        }
      });

      // Handle backspace
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace") {
          if (input.value === "" && index > 0) {
            inputs[index - 1].focus();
            inputs[index - 1].value = "";
            inputs[index - 1].style.borderColor = '#e0e0e0';
            inputs[index - 1].style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          } else if (input.value) {
            input.value = "";
            input.style.borderColor = '#e0e0e0';
            input.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }
        }
        
        // Handle arrow keys for navigation
        if (e.key === "ArrowLeft" && index > 0) {
          inputs[index - 1].focus();
          e.preventDefault();
        }
        if (e.key === "ArrowRight" && index < 5) {
          inputs[index + 1].focus();
          e.preventDefault();
        }
      });

      // Handle focus - select text when focused
      input.addEventListener("focus", () => {
        setTimeout(() => {
          input.select();
        }, 50);
      });
    });
  }

  function verifyOTP() {
    const inputs = document.querySelectorAll(".otp-box");
    let otp = [...inputs].map(i => i.value).join("");
    const statusElement = document.getElementById("otpStatus");

    if (otp.length !== 6) {
      statusElement.textContent = "Please enter all 6 digits to continue";
      statusElement.style.display = "block";
      statusElement.style.backgroundColor = "#f8d7da";
      statusElement.style.color = "#721c24";
      statusElement.style.border = "1px solid #f5c6cb";

      // Reset all styles
      inputs.forEach(input => {
        input.style.borderColor = "#e0e0e0";
        input.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
        input.style.animation = "";
      });

      // Highlight empty ones
      inputs.forEach(input => {
        if (!input.value) {
          input.style.borderColor = "#dc3545";
          input.style.boxShadow = "0 2px 12px rgba(220, 53, 69, 0.2)";
          input.style.animation = "shake 0.5s ease";
        }
      });

      // Focus first empty box
      for (let i = 0; i < inputs.length; i++) {
        if (!inputs[i].value) {
          inputs[i].focus();
          break;
        }
      }
      return;
    }

    showLoader();
    statusElement.style.display = "none";

    const verifyBtn = document.getElementById("verifyOtpBtn");
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i>Verifying...';

    fetch(`${baseUrl}/verify-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: otpRequiredEmail, otp }),
    })
      .then(handleResponse)
      .then((data) => {
        // SUCCESS ✔
        statusElement.textContent = data.message || "OTP verified successfully!";
        statusElement.style.display = "block";
        statusElement.style.backgroundColor = "#d4edda";
        statusElement.style.color = "#155724";
        statusElement.style.border = "1px solid #c3e6cb";

        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("role", data.type);

        setTimeout(() => redirectUser(data.type), 800);
      })
      .catch((error) => {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-check-circle" style="margin-right: 10px;"></i>Verify & Continue';

        // Reset styles
        inputs.forEach(input => {
          input.style.borderColor = "#e0e0e0";
          input.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
        });

        if (error.error === "OTP expired") {
          statusElement.textContent = "OTP has expired. Please request a new one.";
          statusElement.style.display = "block";
          statusElement.style.backgroundColor = "#f8d7da";
          statusElement.style.color = "#721c24";
          statusElement.style.border = "1px solid #f5c6cb";

          setTimeout(() => {
            inputs.forEach(input => {
              input.style.borderColor = "#dc3545";
              input.style.boxShadow = "0 2px 12px rgba(220, 53, 69, 0.2)";
            });
          }, 80);

          return;
        }

        if (error.error?.toLowerCase().includes("invalid") || error.error?.toLowerCase().includes("wrong")) {
          statusElement.textContent = "Invalid OTP. Please try again.";
          statusElement.style.display = "block";
          statusElement.style.backgroundColor = "#f8d7da";
          statusElement.style.color = "#721c24";
          statusElement.style.border = "1px solid #f5c6cb";

          inputs.forEach(input => input.dataset.freeze = "true");

          setTimeout(() => {
            inputs.forEach(input => {
              input.style.borderColor = "#dc3545";
              input.style.boxShadow = "0 2px 12px rgba(220, 53, 69, 0.2)";
              input.style.animation = "shake 0.5s ease";
            });
          }, 80);

          setTimeout(() => {
            inputs.forEach(input => {
              input.value = "";
              input.style.animation = "";
              delete input.dataset.freeze;
            });
            inputs[0].focus();
          }, 500);

          return;
        }

        statusElement.textContent = error.error || "Something went wrong.";
        statusElement.style.display = "block";
        statusElement.style.backgroundColor = "#f8d7da";
        statusElement.style.color = "#721c24";
        statusElement.style.border = "1px solid #f5c6cb";

        showError(error);
      })
      .finally(() => hideLoader());
  }

  function startResendTimer() {
    let seconds = 30;
    const resendBtn = document.getElementById("resendOtpBtn");
    const resendText = document.getElementById("resendText");

    resendBtn.disabled = true;
    resendBtn.style.opacity = "0.6";
    resendBtn.style.cursor = "not-allowed";

    const timer = setInterval(() => {
      resendText.textContent = `Resend OTP (${seconds}s)`;
      seconds--;

      if (seconds < 0) {
        clearInterval(timer);
        resendBtn.disabled = false;
        resendBtn.style.opacity = "1";
        resendBtn.style.cursor = "pointer";
        resendText.textContent = "Resend OTP";
      }
    }, 1000);
  }

  function resendOTP() {
    showLoader();

    const resendBtn = document.getElementById("resendOtpBtn");
    const resendText = document.getElementById("resendText");
    const statusElement = document.getElementById("otpStatus");

    resendBtn.disabled = true;
    resendBtn.style.opacity = "0.6";
    resendBtn.style.cursor = "not-allowed";
    resendText.textContent = "Sending...";

    statusElement.style.display = "none";

    // Reset OTP inputs visually
    const inputs = document.querySelectorAll(".otp-box");
    inputs.forEach(input => {
      input.value = "";
      input.style.borderColor = "#e0e0e0";
      input.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
    });
    inputs[0].focus();

    fetch(`${baseUrl}/resend-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: otpRequiredEmail }),
    })
      .then(handleResponse)
      .then((data) => {

        // SUCCESS UI
        statusElement.textContent = data.message || "OTP sent successfully!";
        statusElement.style.display = "block";
        statusElement.style.backgroundColor = "#d4edda";
        statusElement.style.color = "#155724";
        statusElement.style.border = "1px solid #c3e6cb";

        // Immediately update button text BEFORE timer starts
        resendText.textContent = "Resend OTP (30s)";

        // Start timer
        startResendTimer();

      })
      .catch((error) => {

        // ERROR UI
        statusElement.textContent = error.error || "Failed to resend OTP";
        statusElement.style.display = "block";
        statusElement.style.backgroundColor = "#f8d7da";
        statusElement.style.color = "#721c24";
        statusElement.style.border = "1px solid #f5c6cb";

        // Re-enable button on error
        resendBtn.disabled = false;
        resendBtn.style.opacity = "1";
        resendBtn.style.cursor = "pointer";
        resendText.textContent = "Resend OTP";

      })
      .finally(hideLoader);
  }

  function redirectUser(type) {
    if (type === "admin") window.location.href = "./admin/schools.html";
    if (type === "principal") window.location.href = "./principals/dashboard.html";
    if (type === "class_teacher") window.location.href = "./teachers/dashboard.html";
  }

  function handleResponse(response) {
    if (!response.ok) {
      return response.json().then((error) => {
        throw error;
      });
    }
    return response.json();
  }

  function showError(error) {
    console.error("Error:", error);
    alert(error.error || error.message || "Something went wrong");
  }

  function goBackToLogin() {
    const formSection = document.querySelector(".form-section");
    formSection.innerHTML = originalLoginHTML;

    // Reattach login handler
    const loginForm = document.querySelector(".login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const email = document.getElementById("teacherMail").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
          alert("Please enter both Email and Password.");
          return;
        }

        showLoader();

        fetch(`${baseUrl}/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
          .then(handleResponse)
          .then((data) => {
            alert(data.message ?? "Request success");

            if (data.mfa === false) {
              if (!data.access || !data.refresh) {
                alert("Invalid login state. No tokens received.");
                hideLoader();
                return;
              }

              localStorage.setItem("access_token", data.access);
              localStorage.setItem("refresh_token", data.refresh);
              localStorage.setItem("role", data.type);

              redirectUser(data.type);
              return;
            }

            if (data.mfa === true) {
              if (!data.access) {
                otpRequiredEmail = email;
                showOTPInput();
                hideLoader();
                return;
              }

              localStorage.setItem("access_token", data.access);
              localStorage.setItem("refresh_token", data.refresh);
              localStorage.setItem("role", data.type);

              redirectUser(data.type);
              return;
            }
          })
          .catch(showError)
          .finally(hideLoader);
      });
    }

    // Reattach password toggle
    const togglePasswordBtn = document.getElementById("togglePassword");
    const passwordField = document.getElementById("password");
    if (togglePasswordBtn && passwordField) {
      togglePasswordBtn.addEventListener("click", function () {
        const icon = this.querySelector("i");
        if (passwordField.type === "password") {
          passwordField.type = "text";
          icon.classList.replace("fa-eye", "fa-eye-slash");
        } else {
          passwordField.type = "password";
          icon.classList.replace("fa-eye-slash", "fa-eye");
        }
      });
    }

    // Focus on email field
    const emailField = document.getElementById("teacherMail");
    if (emailField) {
      emailField.focus();
    }
  }

  function loadComponent(id, file, callback) {
    fetch(file)
      .then((response) => response.text())
      .then((data) => {
        const element = document.getElementById(id);
        if (element) {
          element.innerHTML = data;
          if (callback) callback();
        }
      })
      .catch((error) => console.error("Component load error:", error));
  }

  function highlightActiveLink() {
    const footer = document.querySelector("footer");
    function checkScrollbar() {
      if (document.body.scrollHeight <= window.innerHeight) {
        footer?.classList.add("fixed");
      } else {
        footer?.classList.remove("fixed");
      }
    }
    checkScrollbar();
    window.addEventListener("resize", checkScrollbar);
  }
  loadComponent("footer", "../components/footer.html", highlightActiveLink);
});