// =========================================
// FARM & CROPS PAGE
// =========================================


// Get logged-in farmer
const farmerData = localStorage.getItem("farmer");


// If farmer is not logged in,
// send them back to login page
if (!farmerData) {

    window.location.href = "index.html";

}


// Get farmer object
const farmer = JSON.parse(farmerData);


// =========================================
// LOAD EXISTING FARM INFORMATION
// =========================================

const savedFarm = farmer.farm || {};


// Farm location
document.getElementById("farmLocation").value =
    savedFarm.location || "";


// Farm size
document.getElementById("farmSize").value =
    savedFarm.size || "";


// Farm unit
document.getElementById("farmUnit").value =
    savedFarm.unit || "acres";


// Main crop
document.getElementById("mainCrop").value =
    savedFarm.mainCrop || "";


// Other crops
document.getElementById("otherCrops").value =
    savedFarm.otherCrops || "";


// =========================================
// SAVE FARM INFORMATION
// =========================================

document.getElementById("farmForm").addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        // Get form values
        const location =
            document.getElementById("farmLocation")
                .value
                .trim();

        const size =
            document.getElementById("farmSize")
                .value;

        const unit =
            document.getElementById("farmUnit")
                .value;

        const mainCrop =
            document.getElementById("mainCrop")
                .value;

        const otherCrops =
            document.getElementById("otherCrops")
                .value
                .trim();


        // =====================================
        // VALIDATION
        // =====================================

        if (location === "") {

            showFarmMessage(
                "Please enter your farm location.",
                false
            );

            return;
        }


        if (size === "" || Number(size) <= 0) {

            showFarmMessage(
                "Please enter a valid farm size.",
                false
            );

            return;
        }


        if (mainCrop === "") {

            showFarmMessage(
                "Please select your main crop.",
                false
            );

            return;
        }


        // =====================================
        // CREATE FARM OBJECT
        // =====================================

        farmer.farm = {

            location: location,

            size: Number(size),

            unit: unit,

            mainCrop: mainCrop,

            otherCrops: otherCrops

        };


        // =====================================
        // SAVE TO LOCAL STORAGE
        // =====================================

        localStorage.setItem(
            "farmer",
            JSON.stringify(farmer)
        );


        // =====================================
        // SUCCESS MESSAGE
        // =====================================

        showFarmMessage(
            "Farm information saved successfully.",
            true
        );


        // Go back to profile after short delay
        setTimeout(function () {

            window.location.href = "profile.html";

        }, 1200);

    }
);


// =========================================
// SHOW MESSAGE
// =========================================

function showFarmMessage(message, success) {

    const messageBox =
        document.getElementById("farmMessage");


    messageBox.textContent = message;


    if (success) {

        messageBox.className =
            "profile-message success";

    } else {

        messageBox.className =
            "profile-message error";

    }

}


// =========================================
// GO TO DASHBOARD
// =========================================

function goToDashboard() {

    window.location.href = "dashboard.html";

}