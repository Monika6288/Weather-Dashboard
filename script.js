const API_KEY = '61ce1c83fec0073982b4dcb3f87f7db2'; 
const weatherEl = document.getElementById('weather');
const errorEl = document.getElementById('error');
const locationEl = document.getElementById('location');
const tempEl = document.getElementById('temp');
const descriptionEl = document.getElementById('description');
const feelsLikeEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const pressureEl = document.getElementById('pressure');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const weatherIconEl = document.getElementById('weatherIcon');
const forecastContainer = document.getElementById('forecastContainer');
const toggleUnitsBtn = document.getElementById('toggleUnits');
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');

let isMetric = true;
let currentCity = '';
let isDark = false;
let tempChart;

function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getWeatherIcon(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  weatherEl.classList.add('hidden');
}

function clearError() {
  errorEl.classList.add('hidden');
  errorEl.textContent = '';
}

async function fetchWeather(city) {
  clearError();
  try {
    const units = isMetric ? 'metric' : 'imperial';
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}&appid=${API_KEY}`
    );
    if (!weatherRes.ok) throw new Error('City not found');
    const weatherData = await weatherRes.json();

    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${units}&appid=${API_KEY}`
    );
    if (!forecastRes.ok) throw new Error('Forecast not found');
    const forecastData = await forecastRes.json();

    displayWeather(weatherData);
    displayForecast(forecastData);
    currentCity = city;
  } catch (err) {
    showError(err.message);
  }
}

function displayWeather(data) {
  weatherEl.classList.remove('hidden');
  locationEl.textContent = `📍 ${data.name}, ${data.sys.country}`;
  tempEl.textContent = `${Math.round(data.main.temp)}°${isMetric ? 'C' : 'F'}`;
  descriptionEl.textContent = data.weather[0].description;
  feelsLikeEl.textContent = `${Math.round(data.main.feels_like)}°`;
  humidityEl.textContent = `${data.main.humidity}%`;
  windEl.textContent = `${data.wind.speed} ${isMetric ? 'm/s' : 'mph'}`;
  pressureEl.textContent = `${data.main.pressure} hPa`;
  sunriseEl.textContent = formatTime(data.sys.sunrise);
  sunsetEl.textContent = formatTime(data.sys.sunset);
  weatherIconEl.src = getWeatherIcon(data.weather[0].icon);
  weatherIconEl.alt = data.weather[0].description;
}

function displayForecast(data) {
  const daily = {};
  data.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!daily[date]) daily[date] = { temps: [], icons: [], descs: [] };
    daily[date].temps.push(item.main.temp);
    daily[date].icons.push(item.weather[0].icon);
    daily[date].descs.push(item.weather[0].description);
  });

  const sortedDates = Object.keys(daily).sort();
  const dates = sortedDates.slice(1, 6);

  forecastContainer.innerHTML = '';
  dates.forEach(date => {
    const dayData = daily[date];
    const minTemp = Math.min(...dayData.temps);
    const maxTemp = Math.max(...dayData.temps);
    const icon = dayData.icons[Math.floor(dayData.icons.length / 2)];
    const description = dayData.descs[0];
    const dateObj = new Date(date);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const dateStr = dateObj.toLocaleDateString(undefined, options);

    const card = document.createElement('div');
    card.className = 'text-center p-5 bg-gradient-to-b from-blue-100 to-purple-100 rounded-2xl hover:from-blue-200 hover:to-purple-200 transition transform hover:scale-105 cursor-pointer shadow-md';

    card.innerHTML = `
      <div class="font-bold text-blue-800 mb-3">${dateStr}</div>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" class="mx-auto w-16 h-16 mb-3 animate-pulse" />
      <div class="text-sm text-gray-700 capitalize mb-3">${description}</div>
      <div class="flex justify-center gap-3">
        <span class="font-bold text-red-500">↑ ${Math.round(maxTemp)}°</span>
        <span class="font-semibold text-blue-500">↓ ${Math.round(minTemp)}°</span>
      </div>
    `;
    forecastContainer.appendChild(card);
  });

  displayTempChart(daily, dates);
}

function displayTempChart(dailyData, dates) {
  const ctx = document.getElementById('tempChart').getContext('2d');
  const labels = dates.map(date => new Date(date).toLocaleDateString(undefined, { weekday: 'short' }));
  const maxTemps = dates.map(date => Math.round(Math.max(...dailyData[date].temps)));
  const minTemps = dates.map(date => Math.round(Math.min(...dailyData[date].temps)));

  if (tempChart) tempChart.destroy();

  tempChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: `Max Temp °${isMetric ? 'C' : 'F'}`, data: maxTemps, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)', tension: 0.1 },
        { label: `Min Temp °${isMetric ? 'C' : 'F'}`, data: minTemps, borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.2)', tension: 0.1 }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: false } } }
  });
}

toggleUnitsBtn.addEventListener('click', () => {
  isMetric = !isMetric;
  toggleUnitsBtn.textContent = `🔄 Switch to ${isMetric ? '°F' : '°C'}`;
  if (currentCity) fetchWeather(currentCity);
});

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
});

document.getElementById('themeToggle').addEventListener('click', () => {
  isDark = !isDark;
  const commonClasses = 'bg-gradient-to-br min-h-screen p-6 font-sans';
  const lightClasses = 'from-blue-400 via-purple-400 to-pink-400 text-gray-900';
  const darkClasses = 'from-gray-900 via-purple-900 to-black text-white';
  document.body.className = `${commonClasses} ${isDark ? darkClasses : lightClasses}`;
});

window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => {}
    );
  }
};

async function fetchWeatherByCoords(lat, lon) {
  clearError();
  try {
    const units = isMetric ? 'metric' : 'imperial';
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`);
    if (!weatherRes.ok) throw new Error('Failed to fetch weather data');
    const weatherData = await weatherRes.json();

    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`);
    if (!forecastRes.ok) throw new Error('Failed to fetch forecast data');
    const forecastData = await forecastRes.json();

    displayWeather(weatherData);
    displayForecast(forecastData);
    currentCity = weatherData.name;
  } catch (err) {
    showError(err.message);
  }
}
