// Ranchi's approximate city-centre coordinates.
const RANCHI_LATITUDE = 23.3441;
const RANCHI_LONGITUDE = 85.3096;

export interface RanchiWeather {
  temperatureC: number;
  humidityPercent: number;
  windKmh: number;
  weatherCode: number;
}

/** Plain-English label for a WMO weather code (https://open-meteo.com/en/docs — the same codes used everywhere). */
export function describeWeatherCode(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mostly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code === 95 || code === 96 || code === 99) return "Thunderstorm";
  return "Weather update unavailable";
}

/**
 * Real, live current weather for Ranchi from Open-Meteo (free, no API key).
 * Never throws — a network hiccup just means the widget quietly doesn't
 * render, never a fabricated or stale-looking fallback value.
 */
export async function getRanchiWeather(): Promise<RanchiWeather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${RANCHI_LATITUDE}&longitude=${RANCHI_LONGITUDE}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    const current = data?.current;
    if (
      typeof current?.temperature_2m !== "number" ||
      typeof current?.relative_humidity_2m !== "number" ||
      typeof current?.wind_speed_10m !== "number" ||
      typeof current?.weather_code !== "number"
    ) {
      return null;
    }
    return {
      temperatureC: current.temperature_2m,
      humidityPercent: current.relative_humidity_2m,
      windKmh: current.wind_speed_10m,
      weatherCode: current.weather_code,
    };
  } catch {
    return null;
  }
}
