import { getRanchiWeather, describeWeatherCode } from "@/lib/public/weather";
import LiveClock from "./LiveClock";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Small live-time + real current-weather strip for Ranchi, shown near the top of the homepage. */
export default async function RanchiClockWeather() {
  const weather = await getRanchiWeather();

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-dark/80">
      <span className="flex items-center gap-1.5">
        <svg {...iconProps} className="h-4 w-4 text-brand-teal">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        Ranchi time: <span className="font-semibold text-brand-dark"><LiveClock /></span>
      </span>
      {weather && (
        <span className="flex items-center gap-1.5">
          <svg {...iconProps} className="h-4 w-4 text-brand-orange">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
          {Math.round(weather.temperatureC)}°C, {describeWeatherCode(weather.weatherCode).toLowerCase()}
          <span className="text-brand-dark/50">· {weather.humidityPercent}% humidity</span>
        </span>
      )}
    </div>
  );
}
