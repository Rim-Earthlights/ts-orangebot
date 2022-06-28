/**
 * GET
 * https://api.openweathermap.org/data/2.5/onecall
 * ?lat={lat}&lon={lon}&exclude=current,minutely,hourly&appid={appid}
 */

export const ONECALL_URI = 'https://api.openweathermap.org/data/2.5/onecall';

export interface Onecall {
    lat: number;
    lon: number;
    timezone: string;
    timezone_offset: number;
    daily: OnecallDay[];
}

interface OnecallDay {
    dt: number;
    sunrise: number;
    sunset: number;
    moonrise: number;
    moonset: number;
    moon_phase: number;
    temp: {
        day: number;
        min: number;
        max: number;
        night: number;
        eve: number;
        morn: number;
    };
    feels_like: {
        day: number;
        night: number;
        eve: number;
        morn: number;
    };
    pressure: number;
    humidity: number;
    dew_point: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    weather: [
        {
            id: number;
            main: string;
            description: string;
            icon: string;
        }
    ];
    clouds: number;
    pop: number;
    rain: number;
    uvi: number;
}
