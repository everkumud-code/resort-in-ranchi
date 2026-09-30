import { describe, expect, it } from "vitest";
import { describeWeatherCode } from "./weather";

describe("describeWeatherCode", () => {
  it("maps clear/cloudy codes", () => {
    expect(describeWeatherCode(0)).toBe("Clear sky");
    expect(describeWeatherCode(2)).toBe("Partly cloudy");
    expect(describeWeatherCode(3)).toBe("Overcast");
  });

  it("maps rain and thunderstorm codes", () => {
    expect(describeWeatherCode(63)).toBe("Rain");
    expect(describeWeatherCode(81)).toBe("Rain showers");
    expect(describeWeatherCode(95)).toBe("Thunderstorm");
  });

  it("falls back to an honest unknown label for an unmapped code", () => {
    expect(describeWeatherCode(999)).toBe("Weather update unavailable");
  });
});
