
 // =========================================
 // WEATHER MONITORING
 // =========================================

const farmerData = localStorage.getItem("farmer");

if (!farmerData) {
    window.location.href = "index.html";
}

let farmer = JSON.parse(localStorage.getItem("farmer") || "{}");

// =========================================
// FARM LOCATION
// =========================================

function getFarmLocation() {
    farmer = JSON.parse(localStorage.getItem("farmer") || "{}");

    if (
        !farmer.farm ||
        farmer.farm.latitude == null ||
        farmer.farm.longitude == null
    ) {
        return null;
    }

    const latitude = Number(farmer.farm.latitude);
    const longitude = Number(farmer.farm.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    return {
        latitude,
        longitude,
        name: farmer.farm.location || "Farm Location"
    };
}

// =========================================
// LOAD CURRENT WEATHER
// =========================================

async function loadWeather() {
    const location = getFarmLocation();

    if (!location) {
        showWeatherError(
            "Your farm location has not been saved yet. Please open Farm & Crops and use 'Use My Location'."
        );
        return;
    }

    document.getElementById("locationName").textContent = location.name;
    document.getElementById("coordinates").textContent =
        `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;

    showLoading();

    try {
        const url =
            "https://api.open-meteo.com/v1/forecast" +
            `?latitude=${location.latitude}` +
            `&longitude=${location.longitude}` +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,cloud_cover,weather_code" +
            "&temperature_unit=celsius" +
            "&wind_speed_unit=kmh" +
            "&precipitation_unit=mm" +
            "&timezone=auto";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Weather service is unavailable.");
        }

        const data = await response.json();

        if (!data.current) {
            throw new Error("No current weather data was returned.");
        }

        displayWeather(data);
    } catch (error) {
        console.error("Weather error:", error);
        showWeatherError(
            "Could not retrieve weather information. Please try again."
        );
    }
}

// =========================================
// DISPLAY CURRENT WEATHER
// =========================================

function displayWeather(data) {
    const current = data.current;

    document.getElementById("temperature").textContent =
        Math.round(current.temperature_2m);

    document.getElementById("humidity").textContent =
        Math.round(current.relative_humidity_2m);

    document.getElementById("precipitation").textContent =
        current.precipitation;

    document.getElementById("windSpeed").textContent =
        Math.round(current.wind_speed_10m);

    document.getElementById("feelsLike").textContent =
        Math.round(current.apparent_temperature);

    document.getElementById("cloudCover").textContent =
        Math.round(current.cloud_cover);

    const weather = getWeatherDescription(current.weather_code);

    document.getElementById("weatherDescription").textContent =
        weather.description;

    document.getElementById("weatherIcon").textContent = weather.icon;

    document.getElementById("weatherCodeText").textContent = weather.short;

    document.getElementById("weatherTime").textContent =
        formatWeatherTime(current.time);

    document.getElementById("farmAdvice").textContent =
        generateFarmAdvice(current);

    document.getElementById("weatherLoading").style.display = "none";
    document.getElementById("weatherError").style.display = "none";
    document.getElementById("weatherContent").style.display = "block";
}

// =========================================
// WEATHER DESCRIPTION
// =========================================

function getWeatherDescription(code) {
    const weatherCodes = {
        0: { description: "Clear Sky", short: "Clear", icon: "☀️" },
        1: { description: "Mainly Clear", short: "Mostly Clear", icon: "🌤️" },
        2: { description: "Partly Cloudy", short: "Partly Cloudy", icon: "⛅" },
        3: { description: "Overcast", short: "Cloudy", icon: "☁️" },
        45: { description: "Fog", short: "Foggy", icon: "🌫️" },
        48: { description: "Depositing Rime Fog", short: "Foggy", icon: "🌫️" },
        51: { description: "Light Drizzle", short: "Drizzle", icon: "🌦️" },
        53: { description: "Moderate Drizzle", short: "Drizzle", icon: "🌦️" },
        55: { description: "Dense Drizzle", short: "Drizzle", icon: "🌧️" },
        56: { description: "Light Freezing Drizzle", short: "Freezing Drizzle", icon: "🌧️" },
        57: { description: "Dense Freezing Drizzle", short: "Freezing Drizzle", icon: "🌧️" },
        61: { description: "Slight Rain", short: "Rain", icon: "🌦️" },
        63: { description: "Moderate Rain", short: "Rain", icon: "🌧️" },
        65: { description: "Heavy Rain", short: "Heavy Rain", icon: "🌧️" },
        66: { description: "Light Freezing Rain", short: "Freezing Rain", icon: "🌧️" },
        67: { description: "Heavy Freezing Rain", short: "Freezing Rain", icon: "🌧️" },
        71: { description: "Slight Snow", short: "Snow", icon: "🌨️" },
        73: { description: "Moderate Snow", short: "Snow", icon: "🌨️" },
        75: { description: "Heavy Snow", short: "Heavy Snow", icon: "❄️" },
        77: { description: "Snow Grains", short: "Snow", icon: "🌨️" },
        80: { description: "Slight Rain Showers", short: "Rain Showers", icon: "🌦️" },
        81: { description: "Moderate Rain Showers", short: "Rain Showers", icon: "🌧️" },
        82: { description: "Violent Rain Showers", short: "Heavy Showers", icon: "⛈️" },
        85: { description: "Slight Snow Showers", short: "Snow Showers", icon: "🌨️" },
        86: { description: "Heavy Snow Showers", short: "Snow Showers", icon: "🌨️" },
        95: { description: "Thunderstorm", short: "Thunderstorm", icon: "⛈️" },
        96: { description: "Thunderstorm with Hail", short: "Thunderstorm", icon: "⛈️" },
        99: { description: "Heavy Thunderstorm with Hail", short: "Severe Storm", icon: "⛈️" }
    };

    return weatherCodes[code] || {
        description: "Unknown Weather",
        short: "Unknown",
        icon: "🌤️"
    };
}

// =========================================
// WEATHER TIME
// =========================================

function formatWeatherTime(time) {
    if (!time) return "--";

    return new Date(time).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// =========================================
// FARMING ADVICE
// =========================================

function generateFarmAdvice(current) {
    const temperature = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const precipitation = current.precipitation;
    const weatherCode = current.weather_code;

    if (precipitation > 5) {
        return "Rain is currently significant. Consider avoiding irrigation and monitor your field for excess water.";
    }

    if (weatherCode >= 80) {
        return "Rain showers are present. Consider postponing spraying activities until conditions improve.";
    }

    if (temperature > 35) {
        return "High temperature detected. Monitor crop water requirements and consider irrigation during suitable hours.";
    }

    if (humidity > 80) {
        return "High humidity detected. Monitor crops for fungal disease conditions.";
    }

    if (temperature < 15) {
        return "Cool conditions detected. Monitor temperature-sensitive crops.";
    }

    return "Current conditions appear relatively stable. Continue monitoring weather conditions for irrigation and crop-management decisions.";
}

// =========================================
// LOADING AND ERROR
// =========================================

function showLoading() {
    document.getElementById("weatherLoading").style.display = "flex";
    document.getElementById("weatherError").style.display = "none";
    document.getElementById("weatherContent").style.display = "none";
}

function showWeatherError(message) {
    document.getElementById("weatherLoading").style.display = "none";
    document.getElementById("weatherContent").style.display = "none";
    document.getElementById("weatherError").style.display = "block";
    document.getElementById("errorMessage").textContent = message;
}

// =========================================
// GET CURRENT LOCATION
// =========================================

function getCurrentLocationAndWeather() {
    if (!navigator.geolocation) {
        showWeatherError("Location services are not supported by your browser.");
        return;
    }

    showLoading();

    navigator.geolocation.getCurrentPosition(
        function (position) {
            farmer = JSON.parse(localStorage.getItem("farmer") || "{}");

            if (!farmer.farm) {
                farmer.farm = {};
            }

            farmer.farm.latitude = position.coords.latitude;
            farmer.farm.longitude = position.coords.longitude;

            localStorage.setItem("farmer", JSON.stringify(farmer));

            loadWeather();
            loadWeatherForecast();
        },
        function (error) {
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

document.getElementById("refreshWeather").addEventListener("click", function () {
    loadWeather();
    loadWeatherForecast();
});

// =========================================
// DASHBOARD
// =========================================

function goToDashboard() {
    window.location.href = "dashboard.html";
}

// =========================================
// 7-DAY FORECAST
// =========================================

let forecastExpanded = false;

function getForecastWeatherDescription(code) {
    if (code === 0) return { text: "Clear sky", icon: "☀️" };
    if ([1, 2].includes(code)) return { text: "Partly cloudy", icon: "⛅" };
    if (code === 3) return { text: "Overcast", icon: "☁️" };
    if ([45, 48].includes(code)) return { text: "Fog", icon: "🌫️" };
    if ([51, 53, 55, 56, 57].includes(code)) return { text: "Drizzle", icon: "🌦️" };
    if ([61, 63, 65, 66, 67].includes(code)) return { text: "Rain", icon: "🌧️" };
    if ([71, 73, 75, 77].includes(code)) return { text: "Snow", icon: "🌨️" };
    if ([80, 81, 82].includes(code)) return { text: "Rain showers", icon: "🌦️" };
    if ([85, 86].includes(code)) return { text: "Snow showers", icon: "🌨️" };
    if ([95, 96, 99].includes(code)) return { text: "Thunderstorm", icon: "⛈️" };

    return { text: "Unknown conditions", icon: "🌤️" };
}

function formatForecastDay(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });
}

function createForecastDayCard(day, index) {
    const weather = getForecastWeatherDescription(day.weatherCode);
    const card = document.createElement("article");

    card.className = "forecast-day-card";

    if (index >= 2) {
        card.hidden = true;
        card.classList.add("forecast-extra-day");
    }

    const heading = document.createElement("h3");
    heading.textContent = formatForecastDay(day.date);

    const icon = document.createElement("div");
    icon.className = "forecast-day-icon";
    icon.textContent = weather.icon;
    icon.setAttribute("aria-hidden", "true");

    const condition = document.createElement("p");
    condition.className = "forecast-day-condition";
    condition.textContent = weather.text;

    const temperatures = document.createElement("div");
    temperatures.className = "forecast-day-temperatures";

    function makeTemperature(label, value) {
        const wrapper = document.createElement("div");
        const caption = document.createElement("span");
        caption.textContent = label;

        const temperature = document.createElement("strong");
        temperature.textContent =
            value == null ? "--" : `${Math.round(value)}°C`;

        wrapper.append(caption, temperature);
        return wrapper;
    }

    temperatures.append(
        makeTemperature("Min", day.minTemperature),
        makeTemperature("Max", day.maxTemperature)
    );

    card.append(heading, icon, condition, temperatures);

    const details = [
        ["Rain probability", day.precipitationProbability, "%"],
        ["Precipitation", day.precipitationSum, " mm"],
        ["Maximum wind", day.maxWindSpeed, " km/h"]
    ];

    details.forEach(([label, value, unit]) => {
        const row = document.createElement("div");
        row.className = "forecast-day-detail";

        const labelElement = document.createElement("span");
        labelElement.textContent = label;

        const valueElement = document.createElement("strong");
        valueElement.textContent =
            value == null ? "--" : `${value}${unit}`;

        row.append(labelElement, valueElement);
        card.appendChild(row);
    });

    return card;
}

function updateForecastVisibility() {
    document.querySelectorAll(".forecast-extra-day").forEach((card) => {
        card.hidden = !forecastExpanded;
    });

    const toggle = document.getElementById("toggleForecast");

    if (toggle) {
        toggle.textContent = forecastExpanded ? "View Less ↑" : "View More ↓";
        toggle.setAttribute("aria-expanded", String(forecastExpanded));
    }
}

async function loadWeatherForecast() {
    const grid = document.getElementById("weatherForecastGrid");
    const errorMessage = document.getElementById("forecastErrorMessage");

    if (!grid || !errorMessage) return;

    const location = getFarmLocation();

    if (!location) {
        grid.replaceChildren();

        errorMessage.textContent =
            "Save your farm location to view the weather forecast.";
        errorMessage.style.display = "block";

        const toggle = document.getElementById("toggleForecast");
        if (toggle) toggle.style.display = "none";

        return;
    }

    const toggle = document.getElementById("toggleForecast");
    if (toggle) toggle.style.display = "inline-flex";

    errorMessage.style.display = "none";
    grid.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = "Loading forecast...";
    grid.appendChild(loading);

    try {
        const query = new URLSearchParams({
            latitude: String(location.latitude),
            longitude: String(location.longitude)
        });

        const response = await fetch(
            `/api/weather/forecast?${query.toString()}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to retrieve the forecast."
            );
        }

        if (!Array.isArray(result.forecast) || result.forecast.length === 0) {
            throw new Error("No forecast data is currently available.");
        }

        grid.replaceChildren();

        result.forecast.slice(0, 7).forEach((day, index) => {
            grid.appendChild(createForecastDayCard(day, index));
        });

        forecastExpanded = false;
        updateForecastVisibility();

        if (toggle) {
            toggle.style.display =
                result.forecast.length > 2 ? "inline-flex" : "none";
        }
    } catch (error) {
        console.error("Weather forecast error:", error);
        grid.replaceChildren();

        errorMessage.textContent =
            error.message || "Could not load the forecast. Please try again.";
        errorMessage.style.display = "block";
    }
}

// =========================================
// VIEW MORE / VIEW LESS BUTTON
// =========================================

const forecastToggleButton = document.getElementById("toggleForecast");

if (forecastToggleButton) {
    forecastToggleButton.addEventListener("click", function () {
        forecastExpanded = !forecastExpanded;
        updateForecastVisibility();
    });
}

// =========================================
// START
// =========================================

loadWeather();
loadWeatherForecast();
