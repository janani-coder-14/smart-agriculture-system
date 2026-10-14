
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

function validateCoordinates(latitude, longitude) {
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
        latitude === undefined ||
        longitude === undefined ||
        latitude === '' ||
        longitude === '' ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
    ) {
        const error = new Error('Valid latitude and longitude are required');
        error.statusCode = 400;
        throw error;
    }

    return { latitude: lat, longitude: lon };
}

function createWeatherService({
    fetchImpl = globalThis.fetch
} = {}) {
    if (typeof fetchImpl !== 'function') {
        throw new Error('A fetch implementation is required');
    }

    async function fetchWeather(latitude, longitude) {
        const coordinates = validateCoordinates(latitude, longitude);

        const url = new URL(WEATHER_API_URL);
        url.searchParams.set('latitude', coordinates.latitude);
        url.searchParams.set('longitude', coordinates.longitude);
        url.searchParams.set(
            'current',
            'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m'
        );
        url.searchParams.set(
            'daily',
            'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max'
        );
        url.searchParams.set('forecast_days', '7');
        url.searchParams.set('timezone', 'auto');

        let response;

        try {
            response = await fetchImpl(url);
        } catch {
            const error = new Error('Weather provider is unavailable');
            error.statusCode = 502;
            throw error;
        }

        if (!response.ok) {
            const error = new Error('Could not retrieve weather data');
            error.statusCode = 502;
            throw error;
        }

        let data;

        try {
            data = await response.json();
        } catch {
            const error = new Error('Invalid response from weather provider');
            error.statusCode = 502;
            throw error;
        }

        if (!data.current || !data.daily || !Array.isArray(data.daily.time)) {
            const error = new Error('Incomplete weather data received');
            error.statusCode = 502;
            throw error;
        }

        return {
            location: {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                timezone: data.timezone
            },
            current: data.current,
            forecast: data.daily.time.map((date, index) => ({
                date,
                weatherCode: data.daily.weather_code?.[index] ?? null,
                maxTemperature: data.daily.temperature_2m_max?.[index] ?? null,
                minTemperature: data.daily.temperature_2m_min?.[index] ?? null,
                precipitationProbability:
                    data.daily.precipitation_probability_max?.[index] ?? null,
                precipitationSum:
                    data.daily.precipitation_sum?.[index] ?? null,
                maxWindSpeed:
                    data.daily.wind_speed_10m_max?.[index] ?? null
            }))
        };
    }

    return { fetchWeather };
}

module.exports = {
    createWeatherService,
    validateCoordinates
};
