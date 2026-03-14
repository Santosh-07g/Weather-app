/**
 * SkyCast - Professional Weather Application
 * Built with Vanilla JavaScript and OpenWeatherMap API
 */

// --- Configuration ---
const API_KEY = "340677cb6d7066e64bdaa44b46a6f727"; // Placeholder/Demo Key
// Note: Users should replace this with their own API key from openweathermap.org
// For a safe demo, we'll try to use a dummy key and handle the error gracefully.

const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// --- DOM Elements ---
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const geoBtn = document.getElementById('geo-btn');
const themeToggle = document.getElementById('theme-toggle');
const loader = document.getElementById('loader');
const errorContainer = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const weatherContent = document.getElementById('weather-content');

// Weather Data Elements
const cityNameEl = document.getElementById('city-name');
const currentDateEl = document.getElementById('current-date');
const currentTempEl = document.getElementById('current-temp');
const weatherIconEl = document.getElementById('weather-icon');
const conditionEl = document.getElementById('weather-condition');
const tempMaxEl = document.getElementById('temp-max');
const tempMinEl = document.getElementById('temp-min');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind-speed');
const pressureEl = document.getElementById('pressure');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const forecastContainer = document.getElementById('forecast-container');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('theme-dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Initial weather (Default: London or Auto-detect)
    initApp();
});

// --- Main Functions ---

/**
 * Initialize app with user location or default city
 */
function initApp() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            () => {
                // Default to London if geolocation fails or is denied
                fetchWeatherByCity('London');
            }
        );
    } else {
        fetchWeatherByCity('London');
    }
}

/**
 * Fetch weather using city name
 */
async function fetchWeatherByCity(city) {
    showLoader();
    hideError();
    try {
        const url = `${WEATHER_BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            updateUI(data);
            fetchForecast(city);
        } else {
            handleApiError(data);
        }
    } catch (err) {
        showError("Unable to connect to weather service.");
    } finally {
        hideLoader();
    }
}

/**
 * Fetch weather using coordinates
 */
async function fetchWeatherByCoords(lat, lon) {
    showLoader();
    try {
        const url = `${WEATHER_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            updateUI(data);
            fetchForecastByCoords(lat, lon);
        } else {
            handleApiError(data);
        }
    } catch (err) {
        showError("Geolocation fetch failed.");
    } finally {
        hideLoader();
    }
}

/**
 * Fetch 5-day forecast
 */
async function fetchForecast(city) {
    try {
        const url = `${FORECAST_BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();
        if (response.ok) {
            updateForecastUI(data);
        }
    } catch (err) {
        console.error("Forecast error:", err);
    }
}

async function fetchForecastByCoords(lat, lon) {
    try {
        const url = `${FORECAST_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();
        if (response.ok) {
            updateForecastUI(data);
        }
    } catch (err) {
        console.error("Forecast error:", err);
    }
}

/**
 * Update the main weather display
 */
function updateUI(data) {
    const { name, main, weather, wind, sys, dt, timezone } = data;
    const condition = weather[0].main;
    const iconId = weather[0].icon;

    // Update Basic Info
    cityNameEl.textContent = `${name}, ${sys.country}`;
    currentDateEl.textContent = formatDate(dt, timezone);
    currentTempEl.textContent = `${Math.round(main.temp)}°`;
    conditionEl.textContent = weather[0].description;
    tempMaxEl.textContent = `${Math.round(main.temp_max)}°`;
    tempMinEl.textContent = `${Math.round(main.temp_min)}°`;
    feelsLikeEl.textContent = `${Math.round(main.feels_like)}°`;

    // Update Stats
    humidityEl.textContent = `${main.humidity}%`;
    windEl.textContent = `${(wind.speed * 3.6).toFixed(1)} km/h`;
    pressureEl.textContent = `${main.pressure} hPa`;
    sunriseEl.textContent = formatTime(sys.sunrise, timezone);
    sunsetEl.textContent = formatTime(sys.sunset, timezone);

    // Update Icon
    updateWeatherIcon(iconId, condition);

    // Dynamic Background
    updateDynamicBackground(condition, iconId);
}

/**
 * Update Forecast Section (Filter for 5 days at midday)
 */
function updateForecastUI(data) {
    forecastContainer.innerHTML = '';

    // API returns 3-hour intervals, we filter for approx midday (12:00:00)
    const middayForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));

    middayForecasts.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(item.main.temp);
        const cond = item.weather[0].main;
        const iconClass = getWeatherIconClass(item.weather[0].icon, cond);

        const card = document.createElement('div');
        card.className = 'forecast-card glass';
        card.innerHTML = `
            <span class="f-day">${day}</span>
            <i class="${iconClass} f-icon"></i>
            <span class="f-temp">${temp}°</span>
            <span class="f-condition">${cond}</span>
        `;
        forecastContainer.appendChild(card);
    });
}

// --- Utilities & Handlers ---

function updateWeatherIcon(iconId, condition) {
    const iconClass = getWeatherIconClass(iconId, condition);
    weatherIconEl.className = iconClass + ' weather-icon-large';
}

function getWeatherIconClass(iconId, condition) {
    // Map OpenWeather codes to FontAwesome
    const mapping = {
        'Clear': 'fas fa-sun',
        'Clouds': 'fas fa-cloud',
        'Rain': 'fas fa-cloud-showers-heavy',
        'Drizzle': 'fas fa-cloud-rain',
        'Thunderstorm': 'fas fa-cloud-bolt',
        'Snow': 'fas fa-snowflake',
        'Mist': 'fas fa-smog',
        'Smoke': 'fas fa-smog',
        'Haze': 'fas fa-smog',
        'Dust': 'fas fa-smog',
        'Fog': 'fas fa-smog',
        'Sand': 'fas fa-smog',
        'Ash': 'fas fa-smog',
        'Squall': 'fas fa-wind',
        'Tornado': 'fas fa-tornado'
    };

    // Check if it's night (iconId ends in 'n')
    if (iconId.endsWith('n') && condition === 'Clear') return 'fas fa-moon';
    if (iconId.endsWith('n') && condition === 'Clouds') return 'fas fa-cloud-moon';

    return mapping[condition] || 'fas fa-cloud';
}

function updateDynamicBackground(condition, iconId) {
    document.body.classList.remove('weather-clear', 'weather-clouds', 'weather-rain', 'weather-snow', 'weather-night');

    const isNight = iconId.endsWith('n');
    if (isNight) {
        document.body.classList.add('weather-night');
        return;
    }

    const cond = condition.toLowerCase();
    if (cond.includes('clear')) document.body.classList.add('weather-clear');
    else if (cond.includes('cloud')) document.body.classList.add('weather-clouds');
    else if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('thunderstorm')) document.body.classList.add('weather-rain');
    else if (cond.includes('snow')) document.body.classList.add('weather-snow');
    else document.body.classList.add('weather-clouds');
}

function formatDate(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);
    // Note: Date adjustments for local time manually if needed, but simple toLocaleString works well
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

function formatTime(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);
    return date.getUTCHours().toString().padStart(2, '0') + ':' +
        date.getUTCMinutes().toString().padStart(2, '0');
}

function handleApiError(data) {
    if (data.cod === '404') {
        showError("City not found. Please check the spelling.");
    } else if (data.cod === 401) {
        showError("Invalid API Key. Please provide a valid OpenWeatherMap key.");
    } else {
        showError("Something went wrong. Try again later.");
    }
}

function showError(msg) {
    errorText.textContent = msg;
    errorContainer.classList.remove('hidden');
    setTimeout(() => errorContainer.classList.add('hidden'), 5000);
}

function hideError() {
    errorContainer.classList.add('hidden');
}

function showLoader() {
    loader.style.opacity = '1';
    loader.classList.remove('hidden');
}

function hideLoader() {
    loader.style.opacity = '0';
    setTimeout(() => loader.classList.add('hidden'), 500);
}

// --- Event Listeners ---

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) fetchWeatherByCity(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) fetchWeatherByCity(city);
    }
});

geoBtn.addEventListener('click', () => {
    initApp();
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('theme-dark');
    const isDark = document.body.classList.contains('theme-dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});
