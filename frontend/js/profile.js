// =========================================
// PROFILE PAGE
// =========================================


// =========================================
// GET FARMER DATA
// =========================================

let farmer = null;


// =========================================
// LOAD PROFILE
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    loadFarmerData();

    loadFarmInformation();

    setupProfileForm();

});


// =========================================
// LOAD FARMER DATA FROM LOCAL STORAGE
// =========================================

function loadFarmerData() {

    const storedFarmer =
        localStorage.getItem("farmer");


    if (!storedFarmer) {

        console.warn(
            "No farmer data found in localStorage."
        );

        window.location.href = "index.html";

        return;

    }


    try {

        farmer = JSON.parse(storedFarmer);

    } catch (error) {

        console.error(
            "Unable to read farmer data:",
            error
        );

        return;

    }


    // =====================================
    // PERSONAL INFORMATION
    // =====================================

    document.getElementById("profileName").value =
        farmer.name || "";

    document.getElementById("profileMobile").value =
        farmer.mobile || "";

    document.getElementById("profileEmail").value =
        farmer.email || "";

}


// =========================================
// LOAD FARM INFORMATION
// =========================================

function loadFarmInformation() {

    const container =
        document.getElementById(
            "farmProfileContent"
        );


    if (!container) {

        console.error(
            "farmProfileContent element not found."
        );

        return;

    }


    // =====================================
    // CHECK FARM DATA
    // =====================================

    const farm =
        farmer?.farm;


    console.log(
        "Farm data:",
        farm
    );


    // =====================================
    // NO FARM DATA
    // =====================================

    if (!farm || Object.keys(farm).length === 0) {

        showEmptyFarmState(container);

        return;

    }


    // =====================================
    // GET VALUES
    // =====================================

    const location =
        farm.location ||
        farm.farmLocation ||
        farm.address ||
        "";


    const size =
        farm.size ||
        farm.farmSize ||
        farm.area ||
        "";


    const unit =
        farm.unit ||
        farm.sizeUnit ||
        farm.areaUnit ||
        "acres";


    const mainCrop =
        farm.mainCrop ||
        farm.crop ||
        farm.cropType ||
        "";


    const otherCrops =
        farm.otherCrops ||
        farm.crops ||
        "";


    const latitude =
        farm.latitude;


    const longitude =
        farm.longitude;



    // =====================================
    // CHECK IF ACTUAL FARM INFORMATION
    // EXISTS
    // =====================================

    const hasFarmDetails =
        location ||
        size ||
        mainCrop ||
        otherCrops ||
        latitude ||
        longitude;


    if (!hasFarmDetails) {

        showEmptyFarmState(container);

        return;

    }


    // =====================================
    // DISPLAY FARM DETAILS
    // =====================================

    container.innerHTML = `

        <div class="farm-details">


            <!-- LOCATION -->

            <div class="farm-detail">

                <span class="farm-detail-label">
                    📍 Farm Location
                </span>

                <strong>
                    ${
                        location
                            ? escapeHTML(location)
                            : "Not provided"
                    }
                </strong>

            </div>



            <!-- FARM SIZE -->

            <div class="farm-detail">

                <span class="farm-detail-label">
                    📐 Farm Size
                </span>

                <strong>
                    ${
                        size
                            ? escapeHTML(String(size))
                              + " "
                              + escapeHTML(String(unit))
                            : "Not provided"
                    }
                </strong>

            </div>



            <!-- MAIN CROP -->

            <div class="farm-detail">

                <span class="farm-detail-label">
                    🌾 Main Crop
                </span>

                <strong>
                    ${
                        mainCrop
                            ? escapeHTML(String(mainCrop))
                            : "Not provided"
                    }
                </strong>

            </div>



            <!-- OTHER CROPS -->

            <div class="farm-detail">

                <span class="farm-detail-label">
                    🌱 Other Crops
                </span>

                <strong>
                    ${
                        otherCrops
                            ? escapeHTML(String(otherCrops))
                            : "None added"
                    }
                </strong>

            </div>



            ${
                latitude !== undefined &&
                longitude !== undefined &&
                latitude !== "" &&
                longitude !== ""

                ? `

                    <!-- GPS LOCATION -->

                    <div class="farm-detail">

                        <span class="farm-detail-label">
                            🛰️ GPS Coordinates
                        </span>

                        <strong>
                            ${Number(latitude).toFixed(6)},
                            ${Number(longitude).toFixed(6)}
                        </strong>

                    </div>

                `

                : ""

            }



            <!-- EDIT BUTTON -->

            <a
                href="farm.html"
                class="card-button">

                Edit Farm Information →

            </a>


        </div>

    `;

}



// =========================================
// EMPTY FARM STATE
// =========================================

function showEmptyFarmState(container) {

    container.innerHTML = `

        <div class="farm-empty-state">


            <div class="farm-empty-icon">
                🌱
            </div>


            <h3>
                No farm information added yet
            </h3>


            <p>
                Add your farm location, size and
                crops from the Farm & Crops section.
            </p>


            <button
                type="button"
                class="farm-btn"
                onclick="goToFarm()">

                Manage Farm →

            </button>


        </div>

    `;

}



// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;

}



// =========================================
// PROFILE EDITING
// =========================================

function enableEditing() {

    document.getElementById(
        "profileName"
    ).removeAttribute("readonly");


    document.getElementById(
        "profileMobile"
    ).removeAttribute("readonly");


    document.getElementById(
        "profileEmail"
    ).removeAttribute("readonly");


    document.getElementById(
        "profileActions"
    ).style.display = "flex";


    document.getElementById(
        "editButton"
    ).style.display = "none";

}



// =========================================
// CANCEL EDITING
// =========================================

function cancelEditing() {

    // Restore original values

    document.getElementById(
        "profileName"
    ).value = farmer.name || "";


    document.getElementById(
        "profileMobile"
    ).value = farmer.mobile || "";


    document.getElementById(
        "profileEmail"
    ).value = farmer.email || "";


    // Make readonly again

    document.getElementById(
        "profileName"
    ).setAttribute("readonly", true);


    document.getElementById(
        "profileMobile"
    ).setAttribute("readonly", true);


    document.getElementById(
        "profileEmail"
    ).setAttribute("readonly", true);


    document.getElementById(
        "profileActions"
    ).style.display = "none";


    document.getElementById(
        "editButton"
    ).style.display = "block";

}



// =========================================
// SAVE PROFILE
// =========================================

function setupProfileForm() {

    const form =
        document.getElementById(
            "profileForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            // =================================
            // GET UPDATED VALUES
            // =================================

            const name =
                document.getElementById(
                    "profileName"
                ).value.trim();


            const mobile =
                document.getElementById(
                    "profileMobile"
                ).value.trim();


            const email =
                document.getElementById(
                    "profileEmail"
                ).value.trim();


            // =================================
            // UPDATE FARMER OBJECT
            // =================================

            farmer.name =
                name;


            farmer.mobile =
                mobile;


            farmer.email =
                email;


            // =================================
            // IMPORTANT:
            // FARM DATA IS PRESERVED
            // =================================

            // farmer.farm is NOT changed here.


            // =================================
            // SAVE EVERYTHING
            // =================================

            localStorage.setItem(
                "farmer",
                JSON.stringify(farmer)
            );


            // =================================
            // RETURN TO READONLY
            // =================================

            document.getElementById(
                "profileName"
            ).setAttribute(
                "readonly",
                true
            );


            document.getElementById(
                "profileMobile"
            ).setAttribute(
                "readonly",
                true
            );


            document.getElementById(
                "profileEmail"
            ).setAttribute(
                "readonly",
                true
            );


            document.getElementById(
                "profileActions"
            ).style.display = "none";


            document.getElementById(
                "editButton"
            ).style.display = "block";


            // =================================
            // MESSAGE
            // =================================

            showProfileMessage(
                "Profile updated successfully.",
                "success"
            );

        }
    );

}



// =========================================
// PROFILE MESSAGE
// =========================================

function showProfileMessage(
    message,
    type = "success"
) {

    const messageBox =
        document.getElementById(
            "profileMessage"
        );


    if (!messageBox) {
        return;
    }


    messageBox.textContent =
        message;


    messageBox.className =
        "profile-message " + type;


    setTimeout(() => {

        messageBox.className =
            "profile-message";

        messageBox.textContent =
            "";

    }, 3000);

}



// =========================================
// GO TO DASHBOARD
// =========================================

function goToDashboard() {

    window.location.href =
        "dashboard.html";

}



// =========================================
// GO TO FARM & CROPS
// =========================================

function goToFarm() {

    window.location.href =
        "farm.html";

}