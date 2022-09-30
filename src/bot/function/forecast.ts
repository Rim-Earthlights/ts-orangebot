import { getAsync } from '../../common/webWrapper';
import { TypeOrm } from '../../model/typeorm/typeorm';
import { Users } from '../../model/models/users';
import { Forecast } from '../../interface/forecast';
import { Onecall } from '../../interface/onecall';

/**
 * 今日の天気を返す.
 * @param forecast
 * @param onecall
 */
export async function weatherToday(forecast: Forecast, onecall: Onecall): Promise<string[]> {
    // 気温や気象情報
    const weather = forecast.weather[0].description;
    const cloud = forecast.clouds.all;
    const temp = forecast.main.temp.toFixed(1);
    const feelLike = forecast.main.feels_like.toFixed(1);
    const tempMin = onecall.daily[0].temp.min.toFixed(1);
    const tempMax = onecall.daily[0].temp.max.toFixed(1);

    // 降水確率
    const popDay = (onecall.daily[0].pop * 100).toFixed(0);
    const humidityDay = onecall.daily[0].humidity;
    // UVインデックス
    const uvi = uvstr(onecall.daily[0].uvi);
    // 風
    const windDeg = findDeg(forecast.wind.deg);
    const windSpeed = forecast.wind.speed.toFixed(0);

    const description = [];

    if (forecast.sys.country === 'JP') {
        const geores = await getAsync(
            'http://geoapi.heartrails.com/api/json?method=searchByGeoLocation',
            new URLSearchParams({
                x: forecast.coord.lon.toString(),
                y: forecast.coord.lat.toString()
            })
        );
        const data = geores.data;

        // 情報の整形
        description.push(`緯度: ${forecast.coord.lat} / 経度: ${forecast.coord.lon}`);
        description.push(
            `実際の場所: ${data.response.location[0].prefecture}${data.response.location[0].city}${data.response.location[0].town}`
        );
        description.push('');
    } else {
        description.push(`緯度: ${forecast.coord.lat} / 経度: ${forecast.coord.lon}`);
        description.push(
            `実際の場所: https://www.google.co.jp/maps/search/${forecast.coord.lat},${forecast.coord.lon}/`
        );
        description.push('');
    }

    description.push(`天候: ${weather} (雲の量: ${cloud} ％)`);
    description.push(`気温: ${temp} ℃ (${tempMin} ℃/${tempMax} ℃)`);
    description.push(`体感: ${feelLike} ℃`);
    description.push(`降水確率: ${popDay} ％ | 湿度: ${humidityDay} ％`);

    description.push(`風速: ${windDeg} ${windSpeed}m/s`);
    description.push(`UV指数: ${uvi}`);
    return description;
}

/**
 * 指定日の天気を返す
 * @param onecall
 * @param index
 * @returns
 */
export async function weatherDay(onecall: Onecall, index: number): Promise<string[]> {
    // 気温や気象情報
    const weather = onecall.daily[index].weather[0].description;
    const cloud = onecall.daily[index].clouds;
    const temp = onecall.daily[index].temp.day.toFixed(1);
    const feelLike = onecall.daily[index].feels_like.day.toFixed(1);
    const tempMin = onecall.daily[index].temp.min.toFixed(1);
    const tempMax = onecall.daily[index].temp.max.toFixed(1);

    // 降水確率
    const popDay = (onecall.daily[index].pop * 100).toFixed(0);
    const humidityDay = onecall.daily[index].humidity;
    // UVインデックス
    const uvi = uvstr(onecall.daily[index].uvi);
    // 風
    const windDeg = findDeg(onecall.daily[index].wind_deg);
    const windSpeed = onecall.daily[index].wind_speed.toFixed(0);

    // 情報の整形
    const description = [];

    const geores = await getAsync(
        'http://geoapi.heartrails.com/api/json?method=searchByGeoLocation',
        new URLSearchParams({
            x: onecall.lon.toString(),
            y: onecall.lat.toString()
        })
    );
    const data = geores.data;

    if (!data.response.error) {
        // 情報の整形
        description.push(`緯度: ${onecall.lat} / 経度: ${onecall.lon}`);
        description.push(
            `実際の場所: ${data.response.location[0].prefecture}${data.response.location[0].city}${data.response.location[0].town}`
        );
        description.push('');
    } else {
        description.push(`緯度: ${onecall.lat} / 経度: ${onecall.lon}`);
        description.push(`実際の場所: https://www.google.co.jp/maps/search/${onecall.lat},${onecall.lon}/`);
        description.push('');
    }

    description.push(`天候: ${weather} (雲の量: ${cloud} ％)`);
    description.push(`気温: ${temp} ℃ (${tempMin} ℃/${tempMax} ℃)`);
    description.push(`体感: ${feelLike} ℃`);
    description.push(`降水確率: ${popDay} ％ | 湿度: ${humidityDay} ％`);

    description.push(`風速: ${windDeg} ${windSpeed}m/s`);
    description.push(`UV指数: ${uvi}`);

    return description;
}

/**
 * 居住地を取得する
 */
export async function getPref(uid: string): Promise<string | null> {
    const users = TypeOrm.dataSource.getRepository(Users);
    const user = await users.findOne({ where: { id: uid } });
    if (user) {
        if (user.pref) {
            return user.pref;
        }
    }
    return null;
}

/**
 * UV指数に強さを入れて返す
 * @param uvi
 * @returns
 */
function uvstr(uvi: number): string {
    if (uvi >= 11) {
        return `${uvi} (極端に強い)`;
    } else if (uvi >= 8) {
        return `${uvi} (非常に強い)`;
    } else if (uvi >= 6) {
        return `${uvi} (強い)`;
    } else if (uvi >= 3) {
        return `${uvi} (中程度)`;
    } else {
        return `${uvi} (弱い)`;
    }
}

/**
 * 風向を返す
 * @param deg Forecast.wind.deg
 * @returns 方角
 */
function findDeg(deg: number): string {
    if (deg >= 337.5 || deg <= 22.5) {
        return '北';
    } else if (deg > 292.5) {
        return '北西';
    } else if (deg > 247.5) {
        return '西';
    } else if (deg > 202.5) {
        return '南西';
    } else if (deg > 157.5) {
        return '南';
    } else if (deg > 112.5) {
        return '南東';
    } else if (deg > 67.5) {
        return '東';
    } else {
        return '北東';
    }
}
