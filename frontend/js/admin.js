// =========================================
// ADMIN LOGIN
// =========================================

// Demo admin credentials
// We can move this authentication to the backend later.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";


// =========================================
// GET ELEMENTS
// =========================================

const adminForm = document.getElementById("admin-form");

const usernameInput = document.getElementById("username");

const passwordInput = document.getElementById("password");

const submitButton = document.getElementById("submit-btn");

const formMessage = document.getElementById("form-message");

const usernameError = document.getElementById("err-username");

const passwordError = document.getElementById("err-password");

const adminPanel = document.getElementById("admin-panel");

const adminName = document.getElementById("admin-name");

const logoutButton =
    document.getElementById("admin-logout-btn");


// =========================================
// SHOW / HIDE PASSWORD
// =========================================

const togglePassword =
    document.querySelector(".toggle-pw");

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        function () {

            if (passwordInput.type === "password") {

                passwordInput.type = "text";

                togglePassword.textContent = "Hide";

                togglePassword.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                passwordInput.type = "password";

                togglePassword.textContent = "Show";

                togglePassword.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }
        }
    );
}


// =========================================
// CHECK EXISTING ADMIN LOGIN
// =========================================

const savedAdmin =
    localStorage.getItem("admin");

if (savedAdmin) {

    try {

        const admin =
            JSON.parse(savedAdmin);

        showAdminPanel(admin);

    } catch (error) {

        localStorage.removeItem("admin");

    }
}


// =========================================
// ADMIN LOGIN
// =========================================

adminForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        // Clear previous messages
        clearErrors();

        hideMessage();


        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;


        // =====================================
        // VALIDATION
        // =====================================

        let hasError = false;


        if (username === "") {

            usernameError.textContent =
                "Username is required.";

            usernameInput.classList.add("invalid");

            hasError = true;
        }


        if (password === "") {

            passwordError.textContent =
                "Password is required.";

            passwordInput.classList.add("invalid");

            hasError = true;
        }


        if (hasError) {
            return;
        }


        // =====================================
        // CHECK ADMIN CREDENTIALS
        // =====================================

        submitButton.disabled = true;


        if (
            username === ADMIN_USERNAME &&
            password === ADMIN_PASSWORD
        ) {

            const admin = {

                username: username,

                role: "admin"

            };


            // Save admin session
            localStorage.setItem(
                "admin",
                JSON.stringify(admin)
            );


            showMessage(
                "Admin login successful.",
                true
            );


            // Show admin panel
            setTimeout(function () {

                showAdminPanel(admin);

            }, 500);


        } else {

            showMessage(
                "Invalid username or password.",
                false
            );

            passwordInput.value = "";

            submitButton.disabled = false;
        }

    }
);


// =========================================
// SHOW ADMIN PANEL
// =========================================

function showAdminPanel(admin) {

    adminForm.style.display = "none";

    adminPanel.style.display = "block";

    adminName.textContent =
        admin.username || "Admin";

    submitButton.disabled = false;
}


// =========================================
// LOGOUT
// =========================================

logoutButton.addEventListener(
    "click",
    function () {

        localStorage.removeItem("admin");

        adminPanel.style.display = "none";

        adminForm.style.display = "block";

        usernameInput.value = "";

        passwordInput.value = "";

        clearErrors();

        hideMessage();

    }
);


// =========================================
// CLEAR ERRORS
// =========================================

function clearErrors() {

    usernameError.textContent = "";

    passwordError.textContent = "";

    usernameInput.classList.remove("invalid");

    passwordInput.classList.remove("invalid");
}


// =========================================
// SHOW MESSAGE
// =========================================

function showMessage(message, success) {

    formMessage.textContent = message;

    formMessage.className =
        success
            ? "message success"
            : "message fail";
}


// =========================================
// HIDE MESSAGE
// =========================================

function hideMessage() {

    formMessage.textContent = "";

    formMessage.className = "message";

}
const farmerManagementButton =
    document.getElementById("farmer-management-btn");

farmerManagementButton.addEventListener("click", function () {
    window.location.href = "farmer-management.html";
});