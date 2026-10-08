 // =========================================
// WEATHER MONITORING
// =========================================


// =========================================
// CHECK FARMER LOGIN
// =========================================

const farmerData =
    localStorage.getItem("farmer");


if (!farmerData) {

    window.location.href =
        "index.html";

}


// Convert stored farmer data
const farmer =
    JSON.parse(farmerData);


// =========================================
// LOAD FARM LOCATION
// =========================================

function getFarmLocation() {

    if (
        !farmer.farm ||
        farmer.farm.latitude === undefined ||
        farmer.farm.longitude === undefined
    ) {

        return null;

    }


    return {

        latitude:
            Number(farmer.farm.latitude),

        longitude:
            Number(farmer.farm.longitude),

        name:
            farmer.farm.location ||
            "Farm Location"

    };

}


// =========================================
// LOAD WEATHER
// =========================================

async function loadWeather() {

    const location =
        getFarmLocation();


    if (!location) {

        showWeatherError(
            "Your farm location has not been saved yet. Please open Farm & Crops and use 'Use My Location'."
        );

        return;

    }


    // Show coordinates
    document.getElementById(
        "locationName"
    ).textContent =
        location.name;


    document.getElementById(
        "coordinates"
    ).textContent =
        `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;


    showLoading();


    try {

        // =====================================
        // OPEN-METEO API
        // =====================================

        const url =
            `https://api.open-meteo.com/v1/forecast` +

            `?latitude=${location.latitude}` +

            `&longitude=${location.longitude}` +

            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,cloud_cover,weather_code` +

            `&temperature_unit=celsius` +

            `&wind_speed_unit=kmh` +

            `&precipitation_unit=mm` +

            `&timezone=auto`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Weather service is unavailable."
            );

        }


        const data =
            await response.json();


        if (!data.current) {

            throw new Error(
                "No current weather data was returned."
            );

        }


        displayWeather(data);


    } catch (error) {

        console.error(
            "Weather error:",
            error
        );


        showWeatherError(
            "Could not retrieve weather information. Please try again."
        );

    }

}


// =========================================
// DISPLAY WEATHER
// =========================================

function displayWeather(data) {

    const current =
        data.current;


    // Temperature
    document.getElementById(
        "temperature"
    ).textContent =
        Math.round(current.temperature_2m);


    // Humidity
    document.getElementById(
        "humidity"
    ).textContent =
        Math.round(current.relative_humidity_2m);


    // Precipitation
    document.getElementById(
        "precipitation"
    ).textContent =
        current.precipitation;


    // Wind
    document.getElementById(
        "windSpeed"
    ).textContent =
        Math.round(current.wind_speed_10m);


    // Feels like
    document.getElementById(
        "feelsLike"
    ).textContent =
        Math.round(current.apparent_temperature);


    // Cloud
    document.getElementById(
        "cloudCover"
    ).textContent =
        Math.round(current.cloud_cover);


    // Weather code
    const weather =
        getWeatherDescription(
            current.weather_code
        );


    document.getElementById(
        "weatherDescription"
    ).textContent =
        weather.description;


    document.getElementById(
        "weatherIcon"
    ).textContent =
        weather.icon;


    document.getElementById(
        "weatherCodeText"
    ).textContent =
        weather.short;


    // Time
    document.getElementById(
        "weatherTime"
    ).textContent =
        formatWeatherTime(
            current.time
        );


    // Farming advice
    document.getElementById(
        "farmAdvice"
    ).textContent =
        generateFarmAdvice(
            current
        );


    // Show content
    document.getElementById(
        "weatherLoading"
    ).style.display =
        "none";


    document.getElementById(
        "weatherError"
    ).style.display =
        "none";


    document.getElementById(
        "weatherContent"
    ).style.display =
        "block";

}


// =========================================
// WEATHER DESCRIPTION
// =========================================

function getWeatherDescription(code) {

    const weatherCodes = {

        0: {
            description: "Clear Sky",
            short: "Clear",
            icon: "☀️"
        },

        1: {
            description: "Mainly Clear",
            short: "Mostly Clear",
            icon: "🌤️"
        },

        2: {
            description: "Partly Cloudy",
            short: "Partly Cloudy",
            icon: "⛅"
        },

        3: {
            description: "Overcast",
            short: "Cloudy",
            icon: "☁️"
        },

        45: {
            description: "Fog",
            short: "Foggy",
            icon: "🌫️"
        },

        48: {
            description: "Depositing Rime Fog",
            short: "Foggy",
            icon: "🌫️"
        },

        51: {
            description: "Light Drizzle",
            short: "Drizzle",
            icon: "🌦️"
        },

        53: {
            description: "Moderate Drizzle",
            short: "Drizzle",
            icon: "🌦️"
        },

        55: {
            description: "Dense Drizzle",
            short: "Drizzle",
            icon: "🌧️"
        },

        61: {
            description: "Slight Rain",
            short: "Rain",
            icon: "🌦️"
        },

        63: {
            description: "Moderate Rain",
            short: "Rain",
            icon: "🌧️"
        },

        65: {
            description: "Heavy Rain",
            short: "Heavy Rain",
            icon: "🌧️"
        },

        71: {
            description: "Slight Snow",
            short: "Snow",
            icon: "🌨️"
        },

        73: {
            description: "Moderate Snow",
            short: "Snow",
            icon: "🌨️"
        },

        75: {
            description: "Heavy Snow",
            short: "Heavy Snow",
            icon: "❄️"
        },

        80: {
            description: "Slight Rain Showers",
            short: "Rain Showers",
            icon: "🌦️"
        },

        81: {
            description: "Moderate Rain Showers",
            short: "Rain Showers",
            icon: "🌧️"
        },

        82: {
            description: "Violent Rain Showers",
            short: "Heavy Showers",
            icon: "⛈️"
        },

        95: {
            description: "Thunderstorm",
            short: "Thunderstorm",
            icon: "⛈️"
        },

        96: {
            description: "Thunderstorm with Hail",
            short: "Thunderstorm",
            icon: "⛈️"
        },

        99: {
            description: "Heavy Thunderstorm with Hail",
            short: "Severe Storm",
            icon: "⛈️"
        }

    };


    return (
        weatherCodes[code] ||
        {
            description: "Unknown Weather",
            short: "Unknown",
            icon: "🌤️"
        }
    );

}


// =========================================
// WEATHER TIME
// =========================================

function formatWeatherTime(time) {

    if (!time) {
        return "--";
    }


    const date =
        new Date(time);


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


// =========================================
// FARMING ADVICE
// =========================================

function generateFarmAdvice(current) {

    const temperature =
        current.temperature_2m;

    const humidity =
        current.relative_humidity_2m;

    const precipitation =
        current.precipitation;

    const weatherCode =
        current.weather_code;


    if (
        precipitation > 5
    ) {

        return (
            "Rain is currently significant. " +
            "Consider avoiding irrigation and monitor " +
            "your field for excess water."
        );

    }


    if (
        weatherCode >= 80
    ) {

        return (
            "Rain showers are present. " +
            "Consider postponing spraying activities " +
            "until conditions improve."
        );

    }


    if (
        temperature > 35
    ) {

        return (
            "High temperature detected. " +
            "Monitor crop water requirements and " +
            "consider irrigation during suitable hours."
        );

    }


    if (
        humidity > 80
    ) {

        return (
            "High humidity detected. " +
            "Monitor crops for fungal disease conditions."
        );

    }


    if (
        temperature < 15
    ) {

        return (
            "Cool conditions detected. " +
            "Monitor temperature-sensitive crops."
        );

    }


    return (
        "Current conditions appear relatively stable. " +
        "Continue monitoring weather conditions for " +
        "irrigation and crop-management decisions."
    );

}


// =========================================
// LOADING
// =========================================

function showLoading() {

    document.getElementById(
        "weatherLoading"
    ).style.display =
        "flex";


    document.getElementById(
        "weatherError"
    ).style.display =
        "none";


    document.getElementById(
        "weatherContent"
    ).style.display =
        "none";

}


// =========================================
// ERROR
// =========================================

function showWeatherError(message) {

    document.getElementById(
        "weatherLoading"
    ).style.display =
        "none";


    document.getElementById(
        "weatherContent"
    ).style.display =
        "none";


    document.getElementById(
        "weatherError"
    ).style.display =
        "block";


    document.getElementById(
        "errorMessage"
    ).textContent =
        message;

}


// =========================================
// GET NEW LOCATION
// =========================================

function getCurrentLocationAndWeather() {

    if (!navigator.geolocation) {

        showWeatherError(
            "Location services are not supported by your browser."
        );

        return;

    }


    showLoading();


    navigator.geolocation.getCurrentPosition(

        function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            // Update farmer farm location
            if (!farmer.farm) {

                farmer.farm = {};

            }


            farmer.farm.latitude =
                latitude;

            farmer.farm.longitude =
                longitude;


            localStorage.setItem(
                "farmer",
                JSON.stringify(farmer)
            );


            // Reload weather
            loadWeather();

        },


        function(error) {

            console.error(error);


            showWeatherError(
                "Location permission is required to get weather for your current location."
            );

        },

        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0

        }

    );

}


// =========================================
// REFRESH BUTTON
// =========================================

document
    .getElementById("refreshWeather")
    .addEventListener(
        "click",
        function() {

            loadWeather();

        }
    );


// =========================================
// DASHBOARD
// =========================================

function goToDashboard() {

    window.location.href =
        "dashboard.html";

}


// =========================================
// START
// =========================================

loadWeather();