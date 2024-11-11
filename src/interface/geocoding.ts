export const JP_GEOCODING_URI = 'http://geoapi.heartrails.com/api/json';
export const JP_LOCATION_URI = 'http://geoapi.heartrails.com/api/json?method=searchByGeoLocation';
export const WW_GEOCODING_URI = 'http://api.openweathermap.org/geo/1.0/direct';

export interface WorldGeocoding {
  name: string;
  local_names: {
    ko: string;
    ar: string;
    zh: string;
    et: string;
    ja: string;
    pl: string;
    ru: string;
    es: string;
    de: string;
    uk: string;
    feature_name: string;
    en: string;
    ascii: string;
    fr: string;
  };
  lat: number;
  lon: number;
  country: string;
}

export interface Geocoding {
  response: {
    location: Location[];
    error: string | undefined;
  };
}

export interface Location {
  city: string;
  city_kana: string;
  town: string;
  town_kana: string;
  x: number;
  y: number;
  prefecture: string;
  postal: number;
}
