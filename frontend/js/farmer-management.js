// =========================================
// FARMER MANAGEMENT
// =========================================

// GET ELEMENTS

const tableBody = document.getElementById("farmer-table-body");
const farmerCount = document.getElementById("farmer-count");
const searchInput = document.getElementById("search-farmer");
const noFarmers = document.getElementById("no-farmers");

const farmerDetails = document.getElementById("farmer-details");

const detailName = document.getElementById("detail-name");
const detailMobile = document.getElementById("detail-mobile");
const detailEmail = document.getElementById("detail-email");
const detailLocation = document.getElementById("detail-location");
const detailSize = document.getElementById("detail-size");
const detailCrop = document.getElementById("detail-crop");

const editButton = document.getElementById("edit-farmer-btn");
const saveButton = document.getElementById("save-farmer-btn");
const cancelButton = document.getElementById("cancel-edit-btn");

const closeButton = document.getElementById("close-details-btn");

const backAdminButton = document.getElementById("back-admin-btn");
const logoutButton = document.getElementById("logout-btn");


// =========================================
// CHECK ADMIN LOGIN
// =========================================

const savedAdmin = localStorage.getItem("admin");

if (!savedAdmin) {

    window.location.href = "admin.html";

}


// =========================================
// LOAD FARMERS
// =========================================
//
// Currently the registered farmer is stored
// in localStorage after farmer login.
//
// Later we will replace this with:
// GET /api/farmers
//
// =========================================

let farmers = [];

const savedFarmer = localStorage.getItem("farmer");

if (savedFarmer) {

    try {

        const farmer = JSON.parse(savedFarmer);

        farmers.push(farmer);

    } catch (error) {

        console.error("Unable to load farmer data.");

    }

}


// =========================================
// DISPLAY FARMERS
// =========================================

function displayFarmers(list) {

    tableBody.innerHTML = "";

    farmerCount.textContent = list.length;


    if (list.length === 0) {

        noFarmers.style.display = "block";

        return;

    }

    noFarmers.style.display = "none";


    list.forEach(function (farmer, index) {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${index + 1}</td>

            <td>
                ${farmer.name || "Not available"}
            </td>

            <td>
                ${farmer.mobile || farmer.phone || "Not available"}
            </td>

            <td>
                ${farmer.email || "Not available"}
            </td>

            <td>

                <button
                    type="button"
                    class="table-btn view-btn"
                    data-index="${index}">
                    View
                </button>

                <button
                    type="button"
                    class="table-btn delete-btn"
                    data-index="${index}">
                    Delete
                </button>

            </td>

        `;

        tableBody.appendChild(row);

    });


    // VIEW BUTTONS

    document.querySelectorAll(".view-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            const index = Number(button.dataset.index);

            showFarmerDetails(list[index]);

        });

    });


    // DELETE BUTTONS

    document.querySelectorAll(".delete-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            const index = Number(button.dataset.index);

            deleteFarmer(list[index]);

        });

    });

}


// =========================================
// SHOW FARMER DETAILS
// =========================================

let selectedFarmer = null;

function showFarmerDetails(farmer) {

    selectedFarmer = farmer;


    detailName.value =
        farmer.name || "";

    detailMobile.value =
        farmer.mobile || farmer.phone || "";

    detailEmail.value =
        farmer.email || "";


    const farm = farmer.farm || {};

    detailLocation.value =
        farm.location || "Not added";

    detailSize.value =
        farm.size
            ? `${farm.size} ${farm.unit || ""}`
            : "Not added";

    detailCrop.value =
        farm.mainCrop || "Not added";


    farmerDetails.style.display = "block";

    farmerDetails.scrollIntoView({
        behavior: "smooth"
    });

}


// =========================================
// EDIT FARMER
// =========================================

editButton.addEventListener("click", function () {

    detailName.disabled = false;
    detailMobile.disabled = false;
    detailEmail.disabled = false;

    editButton.style.display = "none";

    saveButton.style.display = "inline-block";

    cancelButton.style.display = "inline-block";

});


// =========================================
// CANCEL EDIT
// =========================================

cancelButton.addEventListener("click", function () {

    if (selectedFarmer) {

        showFarmerDetails(selectedFarmer);

    }

    detailName.disabled = true;
    detailMobile.disabled = true;
    detailEmail.disabled = true;

    editButton.style.display = "inline-block";

    saveButton.style.display = "none";

    cancelButton.style.display = "none";

});


// =========================================
// SAVE FARMER
// =========================================

document
    .getElementById("farmer-details-form")
    .addEventListener("submit", function (event) {

        event.preventDefault();


        if (!selectedFarmer) {
            return;
        }


        const name =
            detailName.value.trim();

        const mobile =
            detailMobile.value.trim();

        const email =
            detailEmail.value.trim();


        if (name === "") {

            alert("Farmer name is required.");

            return;

        }


        if (!/^[6-9]\d{9}$/.test(mobile)) {

            alert("Enter a valid 10-digit mobile number.");

            return;

        }


        if (
            email !== "" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {

            alert("Enter a valid email address.");

            return;

        }


        // Update selected farmer

        selectedFarmer.name = name;

        selectedFarmer.mobile = mobile;

        selectedFarmer.phone = mobile;

        selectedFarmer.email = email;


        // Save locally

        localStorage.setItem(
            "farmer",
            JSON.stringify(selectedFarmer)
        );


        // Update farmers array

        const index =
            farmers.indexOf(selectedFarmer);

        if (index !== -1) {

            farmers[index] = selectedFarmer;

        }


        // Refresh table

        displayFarmers(farmers);


        // Disable editing

        detailName.disabled = true;
        detailMobile.disabled = true;
        detailEmail.disabled = true;

        editButton.style.display = "inline-block";

        saveButton.style.display = "none";

        cancelButton.style.display = "none";


        alert("Farmer details updated successfully.");

    });


// =========================================
// DELETE FARMER
// =========================================

function deleteFarmer(farmer) {

    const farmerName =
        farmer.name || "this farmer";


    const confirmDelete =
        confirm(
            `Are you sure you want to delete ${farmerName}?`
        );


    if (!confirmDelete) {
        return;
    }


    const index =
        farmers.indexOf(farmer);


    if (index !== -1) {

        farmers.splice(index, 1);

    }


    // Remove local farmer data

    if (selectedFarmer === farmer) {

        selectedFarmer = null;

        farmerDetails.style.display = "none";

    }


    localStorage.removeItem("farmer");

    localStorage.removeItem("farmerId");


    displayFarmers(farmers);

}


// =========================================
// SEARCH FARMERS
// =========================================

searchInput.addEventListener("input", function () {

    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    const filteredFarmers =
        farmers.filter(function (farmer) {

            const name =
                (farmer.name || "").toLowerCase();

            const mobile =
                (
                    farmer.mobile ||
                    farmer.phone ||
                    ""
                ).toLowerCase();

            const email =
                (farmer.email || "").toLowerCase();


            return (
                name.includes(searchText) ||
                mobile.includes(searchText) ||
                email.includes(searchText)
            );

        });


    displayFarmers(filteredFarmers);

});


// =========================================
// CLOSE DETAILS
// =========================================

closeButton.addEventListener("click", function () {

    farmerDetails.style.display = "none";

    selectedFarmer = null;

});


// =========================================
// BACK TO ADMIN
// =========================================

backAdminButton.addEventListener("click", function () {

    window.location.href = "admin.html";

});


// =========================================
// LOGOUT
// =========================================

logoutButton.addEventListener("click", function () {

    localStorage.removeItem("admin");

    window.location.href = "admin.html";

});


// =========================================
// INITIAL DISPLAY
// =========================================

displayFarmers(farmers);