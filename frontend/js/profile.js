// =========================================
// PROFILE PAGE
// =========================================

// Get logged-in farmer
const farmerData = localStorage.getItem("farmer");


// If farmer is not logged in
if (!farmerData) {

    window.location.href = "index.html";

} else {

    const farmer = JSON.parse(farmerData);

    // Display farmer information
    document.getElementById("profileName").value =
        farmer.name || "";

    document.getElementById("profileMobile").value =
        farmer.mobile || farmer.phone || "";

    document.getElementById("profileEmail").value =
        farmer.email || "";
}


// =========================================
// ENABLE EDITING
// =========================================

function enableEditing() {

    document.getElementById("profileName").readOnly = false;
    document.getElementById("profileMobile").readOnly = false;
    document.getElementById("profileEmail").readOnly = false;

    document.getElementById("profileActions").style.display = "flex";

    document.getElementById("editButton").style.display = "none";

    clearMessage();
}


// =========================================
// CANCEL EDITING
// =========================================

function cancelEditing() {

    const farmer = JSON.parse(
        localStorage.getItem("farmer")
    );

    document.getElementById("profileName").value =
        farmer.name || "";

    document.getElementById("profileMobile").value =
        farmer.mobile || farmer.phone || "";

    document.getElementById("profileEmail").value =
        farmer.email || "";

    disableEditing();

    clearMessage();
}


// =========================================
// DISABLE EDITING
// =========================================

function disableEditing() {

    document.getElementById("profileName").readOnly = true;
    document.getElementById("profileMobile").readOnly = true;
    document.getElementById("profileEmail").readOnly = true;

    document.getElementById("profileActions").style.display = "none";

    document.getElementById("editButton").style.display = "block";
}


// =========================================
// SAVE CHANGES
// =========================================

document.getElementById("profileForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const name =
            document.getElementById("profileName").value.trim();

        const mobile =
            document.getElementById("profileMobile").value.trim();

        const email =
            document.getElementById("profileEmail").value.trim();


        // Basic validation
        if (name === "") {

            showMessage(
                "Name cannot be empty.",
                false
            );

            return;
        }


        if (!/^[6-9]\d{9}$/.test(mobile)) {

            showMessage(
                "Enter a valid 10-digit mobile number.",
                false
            );

            return;
        }


        if (
            email !== "" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {

            showMessage(
                "Enter a valid email address.",
                false
            );

            return;
        }


        // Get existing farmer
        const farmer = JSON.parse(
            localStorage.getItem("farmer")
        );


        // Update local farmer data
        farmer.name = name;
        farmer.mobile = mobile;
        farmer.phone = mobile;
        farmer.email = email;


        // Save updated farmer
        localStorage.setItem(
            "farmer",
            JSON.stringify(farmer)
        );


        // Keep farmer ID
        if (farmer.id) {

            localStorage.setItem(
                "farmerId",
                farmer.id
            );
        }


        // Finish editing
        disableEditing();


        showMessage(
            "Profile updated successfully.",
            true
        );
    }
);


// =========================================
// MESSAGE
// =========================================

function showMessage(message, success) {

    const element =
        document.getElementById("profileMessage");

    element.textContent = message;

    element.className =
        success
            ? "profile-message success"
            : "profile-message error";
}


function clearMessage() {

    const element =
        document.getElementById("profileMessage");

    element.textContent = "";

    element.className = "profile-message";
}


// =========================================
// NAVIGATION
// =========================================

function goToDashboard() {

    window.location.href = "dashboard.html";
}


function goToFarm() {

    window.location.href = "farm.html";
}