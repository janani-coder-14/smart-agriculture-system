
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('../../backend/node_modules/supertest');

const { createApp } = require('../../backend/app');

function createMockWeatherService() {
    return {
        fetchWeather: async (latitude, longitude) => {
            if (
                latitude === undefined ||
                longitude === undefined ||
                latitude === '' ||
                longitude === '' ||
                !Number.isFinite(Number(latitude)) ||
                !Number.isFinite(Number(longitude)) ||
                Number(latitude) < -90 ||
                Number(latitude) > 90 ||
                Number(longitude) < -180 ||
                Number(longitude) > 180
            ) {
                const error = new Error(
                    'Valid latitude and longitude are required'
                );
                error.statusCode = 400;
                throw error;
            }

            return {
                location: {
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                    timezone: 'Asia/Kolkata'
                },
                current: {
                    temperature_2m: 30,
                    relative_humidity_2m: 65,
                    precipitation: 0,
                    weather_code: 1,
                    wind_speed_10m: 12
                },
                forecast: [
                    {
                        date: '2026-10-14',
                        weatherCode: 1,
                        maxTemperature: 32,
                        minTemperature: 24,
                        precipitationProbability: 10,
                        precipitationSum: 0,
                        maxWindSpeed: 15
                    },
                    {
                        date: '2026-10-15',
                        weatherCode: 2,
                        maxTemperature: 31,
                        minTemperature: 24,
                        precipitationProbability: 20,
                        precipitationSum: 0,
                        maxWindSpeed: 16
                    }
                ]
            };
        }
    };
}

function createTestApp(weatherService = createMockWeatherService()) {
    return createApp(
        undefined,
        undefined,
        weatherService
    );
}

test('GET /api/weather/current returns current weather', async () => {
    const response = await request(createTestApp())
        .get('/api/weather/current')
        .query({ latitude: 11.0168, longitude: 76.9558 });

    assert.equal(response.status, 200);
    assert.equal(response.body.current.temperature_2m, 30);
    assert.equal(response.body.current.relative_humidity_2m, 65);
    assert.equal(response.body.location.timezone, 'Asia/Kolkata');
});

test('GET /api/weather/forecast returns forecast data', async () => {
    const response = await request(createTestApp())
        .get('/api/weather/forecast')
        .query({ latitude: 11.0168, longitude: 76.9558 });

    assert.equal(response.status, 200);
    assert.equal(response.body.forecast.length, 2);
    assert.equal(response.body.forecast[0].maxTemperature, 32);
});

test('weather endpoints reject missing coordinates', async () => {
    const app = createTestApp();

    const currentResponse = await request(app)
        .get('/api/weather/current');

    const forecastResponse = await request(app)
        .get('/api/weather/forecast');

    assert.equal(currentResponse.status, 400);
    assert.equal(forecastResponse.status, 400);
});

test('weather endpoints reject invalid coordinates', async () => {
    const app = createTestApp();

    const currentResponse = await request(app)
        .get('/api/weather/current')
        .query({ latitude: 91, longitude: 76 });

    const forecastResponse = await request(app)
        .get('/api/weather/forecast')
        .query({ latitude: 11, longitude: 181 });

    assert.equal(currentResponse.status, 400);
    assert.equal(forecastResponse.status, 400);
});

test('weather endpoints return 502 when the provider fails', async () => {
    const failingWeatherService = {
        fetchWeather: async () => {
            const error = new Error('Weather provider is unavailable');
            error.statusCode = 502;
            throw error;
        }
    };

    const app = createTestApp(failingWeatherService);

    const currentResponse = await request(app)
        .get('/api/weather/current')
        .query({ latitude: 11, longitude: 76 });

    const forecastResponse = await request(app)
        .get('/api/weather/forecast')
        .query({ latitude: 11, longitude: 76 });

    assert.equal(currentResponse.status, 502);
    assert.equal(forecastResponse.status, 502);
});
