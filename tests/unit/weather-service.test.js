
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createWeatherService,
    validateCoordinates
} = require('../../backend/weather-service');

function mockWeatherResponse() {
    return {
        timezone: 'Asia/Kolkata',
        current: {
            temperature_2m: 30,
            relative_humidity_2m: 65,
            apparent_temperature: 34,
            precipitation: 0,
            weather_code: 1,
            wind_speed_10m: 12
        },
        daily: {
            time: [
                '2026-10-14',
                '2026-10-15',
                '2026-10-16',
                '2026-10-17',
                '2026-10-18',
                '2026-10-19',
                '2026-10-20'
            ],
            weather_code: [1, 2, 3, 61, 1, 2, 3],
            temperature_2m_max: [32, 31, 30, 29, 32, 33, 31],
            temperature_2m_min: [24, 24, 23, 23, 24, 25, 24],
            precipitation_probability_max: [10, 20, 30, 80, 10, 20, 30],
            precipitation_sum: [0, 0, 1, 8, 0, 0, 1],
            wind_speed_10m_max: [15, 16, 14, 20, 12, 13, 15]
        }
    };
}

test('validates valid farm coordinates', () => {
    assert.deepEqual(
        validateCoordinates('11.0168', '76.9558'),
        {
            latitude: 11.0168,
            longitude: 76.9558
        }
    );
});

test('rejects missing coordinates', () => {
    assert.throws(
        () => validateCoordinates(undefined, undefined),
        { statusCode: 400 }
    );
});

test('rejects coordinates outside valid ranges', () => {
    assert.throws(
        () => validateCoordinates(91, 76),
        { statusCode: 400 }
    );

    assert.throws(
        () => validateCoordinates(11, 181),
        { statusCode: 400 }
    );
});

test('retrieves current weather and a seven-day forecast', async () => {
    const fetchImpl = async (url) => {
        assert.equal(
            new URL(url).searchParams.get('forecast_days'),
            '7'
        );

        return {
            ok: true,
            json: async () => mockWeatherResponse()
        };
    };

    const weatherService = createWeatherService({ fetchImpl });

    const result = await weatherService.fetchWeather(11.0168, 76.9558);

    assert.equal(result.current.temperature_2m, 30);
    assert.equal(result.location.timezone, 'Asia/Kolkata');
    assert.equal(result.forecast.length, 7);
    assert.equal(result.forecast[3].precipitationSum, 8);
});

test('reports external weather API failures', async () => {
    const weatherService = createWeatherService({
        fetchImpl: async () => ({ ok: false })
    });

    await assert.rejects(
        weatherService.fetchWeather(11, 76),
        { statusCode: 502 }
    );
});

test('reports network failures', async () => {
    const weatherService = createWeatherService({
        fetchImpl: async () => {
            throw new Error('Network unavailable');
        }
    });

    await assert.rejects(
        weatherService.fetchWeather(11, 76),
        { statusCode: 502 }
    );
});

test('reports invalid weather provider JSON', async () => {
    const weatherService = createWeatherService({
        fetchImpl: async () => ({
            ok: true,
            json: async () => {
                throw new Error('Invalid JSON');
            }
        })
    });

    await assert.rejects(
        weatherService.fetchWeather(11, 76),
        { statusCode: 502 }
    );
});
