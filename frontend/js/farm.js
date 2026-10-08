// =========================================
// FARM & CROPS PAGE
// =========================================


// =========================================
// GET LOGGED-IN FARMER
// =========================================

const farmerData = localStorage.getItem("farmer");


// If farmer is not logged in,
// send them back to login page
if (!farmerData) {

    window.location.href = "index.html";

}


// Get farmer object
const farmer = JSON.parse(farmerData);


// =========================================
// GET EXISTING FARM INFORMATION
// =========================================

const savedFarm = farmer.farm || {};


// =========================================
// GET FORM ELEMENTS
// =========================================

const farmLocation =
    document.getElementById("farmLocation");

const farmSize =
    document.getElementById("farmSize");

const farmUnit =
    document.getElementById("farmUnit");

const mainCrop =
    document.getElementById("mainCrop");

const otherCrops =
    document.getElementById("otherCrops");

const farmForm =
    document.getElementById("farmForm");

const farmMessage =
    document.getElementById("farmMessage");


// =========================================
// LOAD EXISTING FARM INFORMATION
// =========================================


// Farm location
if (farmLocation) {

    farmLocation.value =
        savedFarm.location || "";

}


// Farm size
if (farmSize) {

    farmSize.value =
        savedFarm.size || "";

}


// Farm unit
if (farmUnit) {

    farmUnit.value =
        savedFarm.unit || "acres";

}


// Main crop
if (mainCrop) {

    mainCrop.value =
        savedFarm.mainCrop || "";

}


// Other crops
if (otherCrops) {

    otherCrops.value =
        savedFarm.otherCrops || "";

}


// =========================================
// CREATE / RESTORE HIDDEN GPS FIELDS
// =========================================

let latitudeInput =
    document.getElementById("farmLatitude");

let longitudeInput =
    document.getElementById("farmLongitude");


// If hidden fields don't exist in HTML,
// create them automatically.
if (!latitudeInput) {

    latitudeInput =
        document.createElement("input");

    latitudeInput.type = "hidden";
    latitudeInput.id = "farmLatitude";

    document.body.appendChild(latitudeInput);

}


if (!longitudeInput) {

    longitudeInput =
        document.createElement("input");

    longitudeInput.type = "hidden";
    longitudeInput.id = "farmLongitude";

    document.body.appendChild(longitudeInput);

}


// Load previously saved coordinates
latitudeInput.value =
    savedFarm.latitude || "";

longitudeInput.value =
    savedFarm.longitude || "";


// =========================================
// LOCATION BUTTON
// =========================================

const locationButton =
    document.getElementById("useLocationBtn");


// =========================================
// LOCATION STATUS
// =========================================

let locationStatus =
    document.getElementById("locationStatus");


// Create status element if it doesn't exist
if (!locationStatus && locationButton) {

    locationStatus =
        document.createElement("small");

    locationStatus.id =
        "locationStatus";

    locationStatus.className =
        "location-status";

    locationButton.parentNode.appendChild(
        locationStatus
    );

}


// =========================================
// USE MY LOCATION
// =========================================

if (locationButton) {

    locationButton.addEventListener(
        "click",
        getCurrentLocation
    );

}


function getCurrentLocation() {


    // =====================================
    // CHECK GEOLOCATION SUPPORT
    // =====================================

    if (!navigator.geolocation) {

        showLocationMessage(
            "Your browser does not support location services.",
            false
        );

        return;
    }


    // =====================================
    // LOADING STATE
    // =====================================

    locationButton.disabled = true;

    locationButton.textContent =
        "📍 Getting Location...";


    showLocationMessage(
        "Getting your current location...",
        null
    );


    // =====================================
    // GET GPS LOCATION
    // =====================================

    navigator.geolocation.getCurrentPosition(

        async function (position) {


            // =================================
            // GET COORDINATES
            // =================================

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            console.log(
                "Current Latitude:",
                latitude
            );

            console.log(
                "Current Longitude:",
                longitude
            );


            // =================================
            // SAVE COORDINATES IN FARM OBJECT
            // =================================

            latitudeInput.value =
                latitude;

            longitudeInput.value =
                longitude;


            // =================================
            // GET READABLE ADDRESS
            // =================================

            let locationName =
                `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;


            try {

                const response =
                    await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                        {
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                if (response.ok) {

                    const data =
                        await response.json();


                    if (data.display_name) {

                        locationName =
                            data.display_name;

                    }

                }

            } catch (error) {

                console.warn(
                    "Address lookup failed:",
                    error
                );

                // Coordinates will be used
            }


            // =================================
            // PUT LOCATION INTO INPUT
            // =================================

            farmLocation.value =
                locationName;


            // =================================
            // SAVE GPS DATA FOR WEATHER
            // =================================

            localStorage.setItem(
                "farmLocation",
                JSON.stringify({

                    latitude: latitude,

                    longitude: longitude,

                    location: locationName

                })
            );


            // =================================
            // SUCCESS MESSAGE
            // =================================

            showLocationMessage(
                "✓ Current location detected successfully.",
                true
            );


            // =================================
            // RESTORE BUTTON
            // =================================

            locationButton.disabled = false;

            locationButton.textContent =
                "📍 Use My Location";

        },


        // =====================================
        // LOCATION ERROR
        // =====================================

        function (error) {

            console.error(
                "Geolocation error:",
                error
            );


            let message;


            switch (error.code) {

                case error.PERMISSION_DENIED:

                    message =
                        "Location permission was denied. Please allow location access in your browser.";

                    break;


                case error.POSITION_UNAVAILABLE:

                    message =
                        "Your current location could not be determined.";

                    break;


                case error.TIMEOUT:

                    message =
                        "Location request timed out. Please try again.";

                    break;


                default:

                    message =
                        "Unable to get your current location.";

            }


            showLocationMessage(
                "⚠ " + message,
                false
            );


            locationButton.disabled = false;

            locationButton.textContent =
                "📍 Use My Location";

        },


        // =====================================
        // GEOLOCATION OPTIONS
        // =====================================

        {
            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0

        }

    );

}


// =========================================
// LOCATION MESSAGE
// =========================================

function showLocationMessage(
    message,
    success
) {

    if (!locationStatus) {
        return;
    }


    locationStatus.textContent =
        message;


    if (success === true) {

        locationStatus.className =
            "location-status success";

    }

    else if (success === false) {

        locationStatus.className =
            "location-status error";

    }

    else {

        locationStatus.className =
            "location-status loading";

    }

}


// =========================================
// SAVE FARM INFORMATION
// =========================================

if (farmForm) {

    farmForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            // =================================
            // GET FORM VALUES
            // =================================

            const location =
                farmLocation.value.trim();


            const size =
                farmSize.value;


            const unit =
                farmUnit.value;


            const mainCropValue =
                mainCrop.value;


            const otherCropsValue =
                otherCrops.value.trim();


            // =================================
            // GET GPS COORDINATES
            // =================================

            const latitude =
                latitudeInput.value;


            const longitude =
                longitudeInput.value;


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


            if (
                size === "" ||
                Number(size) <= 0
            ) {

                showFarmMessage(
                    "Please enter a valid farm size.",
                    false
                );

                return;
            }


            if (mainCropValue === "") {

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

                latitude:
                    latitude !== ""
                        ? Number(latitude)
                        : null,

                longitude:
                    longitude !== ""
                        ? Number(longitude)
                        : null,

                size:
                    Number(size),

                unit: unit,

                mainCrop:
                    mainCropValue,

                otherCrops:
                    otherCropsValue

            };


            // =====================================
            // SAVE TO LOCAL STORAGE
            // =====================================

            localStorage.setItem(
                "farmer",
                JSON.stringify(farmer)
            );


            // =====================================
            // ALSO SAVE LOCATION FOR WEATHER
            // =====================================

            if (
                latitude !== "" &&
                longitude !== ""
            ) {

                localStorage.setItem(
                    "farmLocation",
                    JSON.stringify({

                        latitude:
                            Number(latitude),

                        longitude:
                            Number(longitude),

                        location:
                            location

                    })
                );

            }


            // =====================================
            // SUCCESS MESSAGE
            // =====================================

            showFarmMessage(
                "Farm information saved successfully.",
                true
            );


            // =====================================
            // GO BACK TO PROFILE
            // =====================================

            setTimeout(
                function () {

                    window.location.href =
                        "profile.html";

                },
                1200
            );

        }
    );

}


// =========================================
// SHOW FARM MESSAGE
// =========================================

function showFarmMessage(
    message,
    success
) {

    if (!farmMessage) {
        return;
    }


    farmMessage.textContent =
        message;


    if (success) {

        farmMessage.className =
            "profile-message success";

    }

    else {

        farmMessage.className =
            "profile-message error";

    }

}


// =========================================
// GO TO DASHBOARD
// =========================================

function goToDashboard() {

    window.location.href =
        "dashboard.html";

}