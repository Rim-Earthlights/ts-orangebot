export const GEOCODING_URI = 'http://api.openweathermap.org/geo/1.0/direct';

export interface Geocoding {
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
