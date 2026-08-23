const form = document.getElementById("registerForm");

form.addEventListener("submit", function (event) {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const email = document.getElementById("email").value.trim();

    const message = document.getElementById("message");

    // Name validation
    if (name === "") {
        message.textContent = "Please enter your full name.";
        return;
    }

    // Mobile number validation
    if (!/^[6-9]\d{9}$/.test(phone)) {
        message.textContent =
            "Please enter a valid 10-digit mobile number.";
        return;
    }

    // Password validation
    if (password.length < 6) {
        message.textContent =
            "Password must contain at least 6 characters.";
        return;
    }

    // Confirm password
    if (password !== confirmPassword) {
        message.textContent =
            "Passwords do not match.";
        return;
    }

    // Optional email validation
    if (
        email !== "" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        message.textContent =
            "Please enter a valid email address.";
        return;
    }

    message.textContent =
        "Registration details are valid!";

});