// =========================================
// 7-DAY FARM WEATHER FORECAST
// =========================================

const savedFarmer = localStorage.getItem("farmer");

if (!savedFarmer) {
    window.location.href = "index.html";
}

let farmer = {};

try {
    farmer = JSON.parse(savedFarmer);
} catch (error) {
    console.error("Could not read saved farmer data:", error);
}

function getSavedFarmLocation() {
    const farm = farmer.farm;

    if (
        !farm ||
        farm.latitude === undefined ||
        farm.longitude === undefined ||
        farm.latitude === "" ||
        farm.longitude === ""
    ) {
        return null;
    }

    const latitude = Number(farm.latitude);
    const longitude = Number(farm.longitude);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
    ) {
        return null;
    }

    return {
        latitude,
        longitude,
        name: farm.location || "Farm Location"
    };
}

function showForecastLoading() {
    document.getElementById("forecastLoading").hidden = false;
    document.getElementById("forecastError").hidden = true;
    document.getElementById("forecastGrid").hidden = true;
}

function showForecastError(message) {
    document.getElementById("forecastLoading").hidden = true;
    document.getElementById("forecastGrid").hidden = true;
    document.getElementById("forecastErrorMessage").textContent = message;
    document.getElementById("forecastError").hidden = false;
}

function getForecastDescription(code) {
    if ([0].includes(code)) {
        return { text: "Clear sky", icon: "☀️" };
    }

    if ([1, 2].includes(code)) {
        return { text: "Partly cloudy", icon: "⛅" };
    }

    if ([3].includes(code)) {
        return { text: "Overcast", icon: "☁️" };
    }

    if ([45, 48].includes(code)) {
        return { text: "Fog", icon: "🌫️" };
    }

    if ([51, 53, 55, 56, 57].includes(code)) {
        return { text: "Drizzle", icon: "🌦️" };
    }

    if ([61, 63, 65, 66, 67].includes(code)) {
        return { text: "Rain", icon: "🌧️" };
    }

    if ([71, 73, 75, 77].includes(code)) {
        return { text: "Snow", icon: "🌨️" };
    }

    if ([80, 81, 82].includes(code)) {
        return { text: "Rain showers", icon: "🌦️" };
    }

    if ([85, 86].includes(code)) {
        return { text: "Snow showers", icon: "🌨️" };
    }

    if ([95, 96, 99].includes(code)) {
        return { text: "Thunderstorm", icon: "⛈️" };
    }

    return { text: "Unavailable", icon: "🌤️" };
}

function formatForecastDate(dateString) {
    // Use the date string directly to avoid shifting dates
    // due to the browser's timezone.
    const parts = dateString.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);

    return date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });
}

function createForecastCard(day) {
    const description = getForecastDescription(day.weatherCode);

    const card = document.createElement("article");
    card.className = "forecast-card";

    const heading = document.createElement("h3");
    heading.textContent = formatForecastDate(day.date);

    const icon = document.createElement("div");
    icon.className = "forecast-icon";
    icon.textContent = description.icon;
    icon.setAttribute("aria-hidden", "true");

    const condition = document.createElement("p");
    condition.className = "forecast-condition";
    condition.textContent = description.text;

    const temperatures = document.createElement("div");
    temperatures.className = "forecast-temperatures";

    const minTemperature = document.createElement("div");
    const minLabel = document.createElement("span");
    minLabel.textContent = "Min temperature";
    const minValue = document.createElement("strong");
    minValue.textContent = day.minTemperature == null
        ? "--"
        : `${Math.round(day.minTemperature)}°C`;
    minTemperature.append(minLabel, minValue);

    const maxTemperature = document.createElement("div");
    const maxLabel = document.createElement("span");
    maxLabel.textContent = "Max temperature";
    const maxValue = document.createElement("strong");
    maxValue.textContent = day.maxTemperature == null
        ? "--"
        : `${Math.round(day.maxTemperature)}°C`;
    maxTemperature.append(maxLabel, maxValue);

    temperatures.append(minTemperature, maxTemperature);

    card.append(heading, icon, condition, temperatures);

    const details = [
        ["Rain probability", day.precipitationProbability, "%"],
        ["Precipitation", day.precipitationSum, " mm"],
        ["Maximum wind", day.maxWindSpeed, " km/h"]
    ];

    details.forEach(([label, value, unit]) => {
        const row = document.createElement("div");
        row.className = "forecast-detail";

        const labelElement = document.createElement("span");
        labelElement.textContent = label;

        const valueElement = document.createElement("strong");
        valueElement.textContent = value == null
            ? "--"
            : `${value}${unit}`;

        row.append(labelElement, valueElement);
        card.appendChild(row);
    });

    return card;
}

async function loadForecast() {
    const location = getSavedFarmLocation();

    if (!location) {
        showForecastError(
            "No valid farm coordinates were found. Open Farm & Crops and save your farm location first."
        );
        return;
    }

    document.getElementById("forecastLocation").textContent = location.name;
    document.getElementById("forecastCoordinates").textContent =
        `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;

    showForecastLoading();

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
                result.message || "The weather service could not return a forecast."
            );
        }

        if (!Array.isArray(result.forecast)) {
            throw new Error("The server returned an invalid forecast.");
        }

        const grid = document.getElementById("forecastGrid");
        grid.replaceChildren();

        result.forecast.forEach(day => {
            grid.appendChild(createForecastCard(day));
        });

        document.getElementById("forecastLoading").hidden = true;
        document.getElementById("forecastError").hidden = true;
        grid.hidden = false;

    } catch (error) {
        console.error("Forecast error:", error);

        showForecastError(
            error.message || "Could not retrieve the forecast. Please try again."
        );
    }
}

document.getElementById("forecastRefresh").addEventListener(
    "click",
    loadForecast
);

document.getElementById("forecastRetry").addEventListener(
    "click",
    loadForecast
);

loadForecast();
 