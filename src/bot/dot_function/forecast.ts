import axios from 'axios';
import dayjs from 'dayjs';
import { EmbedBuilder, Message } from 'discord.js';
import url from 'url';
import { Logger } from '../../common/logger.js';
import { CONFIG } from '../../config/config.js';
import { Forecast, FORECAST_URI } from '../../interface/forecast.js';
import {
  Geocoding,
  JP_GEOCODING_URI,
  JP_LOCATION_URI,
  WorldGeocoding,
  WW_GEOCODING_URI,
} from '../../interface/geocoding.js';
import { Onecall, ONECALL_URI } from '../../interface/onecall.js';
import { UsersRepository } from '../../model/repository/usersRepository.js';
import { LogLevel } from '../../type/types.js';

/**
 * 現在の天気を返す.
 * @param message 受け取ったメッセージング情報
 * @param args 0: 地名 1: x日後(number | undefined)
 * @returns
 */
export async function weather(message: Message, args?: string[]) {
  try {
    const forecastKey = CONFIG.FORECAST.KEY;
    if (!forecastKey) {
      throw new Error('天気情報取得用のAPIキーが登録されていません');
    }
    if (args == undefined || args.length === 0) {
      throw new Error('地名が入力されていません');
    }

    const cityName = args[0];
    let day = 0;

    const addDay = Number(args[1]);
    if (addDay != undefined && addDay <= 6) {
      day = day + addDay;
    }

    const geoResponse = await axios.get(JP_GEOCODING_URI, {
      params: new url.URLSearchParams({
        method: 'suggest',
        keyword: cityName,
        matching: 'like',
      }),
    });

    let lat: number, lon: number;

    const response = (<Geocoding>geoResponse.data).response;
    const geoList = response.location;

    if (response.error != undefined || geoList.length <= 0) {
      await Logger.put({
        guild_id: message.guild?.id,
        channel_id: message.channel.id,
        user_id: message.id,
        level: LogLevel.INFO,
        event: 'get-forecast',
        message: [`geocoding(JP) not found.`],
      });

      const geoResponse = await axios.get(WW_GEOCODING_URI, {
        params: new url.URLSearchParams({
          q: cityName,
          limit: '5',
          appid: forecastKey,
          lang: 'ja',
          unit: 'metric',
        }),
      });

      const geoList = <WorldGeocoding[]>geoResponse.data;

      if (geoList == undefined || geoList.length <= 0) {
        await Logger.put({
          guild_id: message.guild?.id,
          channel_id: message.channel.id,
          user_id: message.id,
          level: LogLevel.ERROR,
          event: 'get-forecast',
          message: [`geocoding get failed.`],
        });
        throw new Error('名前から場所を検索できませんでした');
      }

      lat = geoList[0].lat;
      lon = geoList[0].lon;

      await Logger.put({
        guild_id: message.guild?.id,
        channel_id: message.channel.id,
        user_id: message.id,
        level: LogLevel.INFO,
        event: 'get-forecast | geocode',
        message: [`lat: ${lat}, lon: ${lon}, name: ${geoList[0].local_names}`],
      });
    } else {
      lat = geoList[0].y;
      lon = geoList[0].x;
      await Logger.put({
        guild_id: message.guild?.id,
        channel_id: message.channel.id,
        user_id: message.id,
        level: LogLevel.INFO,
        event: 'get-forecast | geocode',
        message: [`lat: ${lat}, lon: ${lon}, name: ${geoList[0].prefecture}${geoList[0].city} / ${geoList[0].town}`],
      });
    }

    const forecastResponse = await axios.get(FORECAST_URI, {
      params: new url.URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        appid: forecastKey,
        lang: 'ja',
        units: 'metric',
      }),
    });

    const onecallResponse = await axios.get(ONECALL_URI, {
      params: new url.URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        exclude: 'current,minutely,hourly',
        appid: forecastKey,
        units: 'metric',
        lang: 'ja',
      }),
    });

    const forecast = <Forecast>forecastResponse.data;
    const onecall = <Onecall>onecallResponse.data;

    let embed: EmbedBuilder | undefined = undefined;
    if (day === 0) {
      embed = await weatherToday(forecast, onecall);
      embed.setThumbnail(`http://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`);
    } else {
      embed = await weatherDay(onecall, day);
      embed.setThumbnail(`http://openweathermap.org/img/wn/${onecall.daily[day].weather[0].icon}@2x.png`);
    }

    embed.setColor('#0099ff').setTitle(`${cityName} の天気`);

    if (day === 0) {
      message.reply({ content: `今日の天気ね！はいどーぞ！`, embeds: [embed] });
    } else if (day === 1) {
      message.reply({ content: `明日の天気ね！はいどーぞ！`, embeds: [embed] });
    } else {
      message.reply({ content: `${day}日後の天気ね！はいどーぞ！`, embeds: [embed] });
    }
  } catch (e) {
    const error = <Error>e;
    const send = new EmbedBuilder().setColor('#ff0000').setTitle('エラー').setDescription(error.message);

    message.reply({ content: `ありゃ、エラーみたい…なんだろ？`, embeds: [send] });
  }
}

/**
 * 現在の天気をJson情報で返す.
 * @param message 受け取ったメッセージング情報
 * @param args 0: 地名 1: x日後(number | undefined)
 * @returns
 */
export async function weatherJson(message: Message, args?: string[]) {
  try {
    const forecastKey = CONFIG.FORECAST.KEY;
    if (!forecastKey) {
      throw new Error('天気情報取得用のAPIキーが登録されていません');
    }
    if (args == undefined || args.length === 0) {
      throw new Error('地名が入力されていません');
    }

    const cityName = args[0];
    let day = 0;

    const addDay = Number(args[1]);
    if (addDay != undefined && addDay <= 6) {
      day = day + addDay;
    }

    const geoResponse = await axios.get(JP_GEOCODING_URI, {
      params: new url.URLSearchParams({
        method: 'suggest',
        keyword: cityName,
        matching: 'like',
      }),
    });

    let lat: number, lon: number;

    const response = (<Geocoding>geoResponse.data).response;
    const geoList = response.location;

    if (response.error != undefined || geoList.length <= 0) {
      await Logger.put({
        guild_id: message.guild?.id,
        channel_id: message.channel.id,
        user_id: message.id,
        level: LogLevel.INFO,
        event: 'get-forecast',
        message: [`geocoding(JP) not found.`],
      });

      const geoResponse = await axios.get(WW_GEOCODING_URI, {
        params: new url.URLSearchParams({
          q: cityName,
          limit: '5',
          appid: forecastKey,
          lang: 'ja',
          unit: 'metric',
        }),
      });

      const geoList = <WorldGeocoding[]>geoResponse.data;

      if (geoList == undefined || geoList.length <= 0) {
        await Logger.put({
          guild_id: message.guild?.id,
          channel_id: message.channel.id,
          user_id: message.id,
          level: LogLevel.ERROR,
          event: 'get-forecast',
          message: [`geocoding get failed.`],
        });
        throw new Error('名前から場所を検索できませんでした');
      }

      lat = geoList[0].lat;
      lon = geoList[0].lon;

      await Logger.put({
        guild_id: message.guild?.id,
        channel_id: message.channel.id,
        user_id: message.id,
        level: LogLevel.INFO,
        event: 'get-forecast | geocode',
        message: [`lat: ${lat}, lon: ${lon}, name: ${geoList[0].local_names}`],
      });
    } else {
      lat = geoList[0].y;
      lon = geoList[0].x;
      await Logger.put({
        guild_id: message.guild?.id,
        channel_id: message.channel.id,
        user_id: message.id,
        level: LogLevel.INFO,
        event: 'get-forecast | geocode',
        message: [`lat: ${lat}, lon: ${lon}, name: ${geoList[0].prefecture}${geoList[0].city} / ${geoList[0].town}`],
      });
    }

    const forecastResponse = await axios.get(FORECAST_URI, {
      params: new url.URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        appid: forecastKey,
        lang: 'ja',
        units: 'metric',
      }),
    });

    const onecallResponse = await axios.get(ONECALL_URI, {
      params: new url.URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        exclude: 'current,minutely,hourly',
        appid: forecastKey,
        units: 'metric',
        lang: 'ja',
      }),
    });

    const forecast = <Forecast>forecastResponse.data;
    const onecall = <Onecall>onecallResponse.data;

    if (day === 0) {
      return await weatherTodayJson(forecast, onecall, cityName);
    } else {
      return await weatherDayJson(onecall, day, cityName);
    }
  } catch (e) {
    const error = <Error>e;
    const send = new EmbedBuilder().setColor('#ff0000').setTitle('エラー').setDescription(error.message);

    message.reply({ content: `ありゃ、エラーみたい…なんだろ？`, embeds: [send] });
  }
}

/**
 * 今日の天気を返す.
 * @param forecast
 * @param onecall
 */
async function weatherToday(forecast: Forecast, onecall: Onecall): Promise<EmbedBuilder> {
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

  const embed = new EmbedBuilder();
  const description: string[] = [];

  if (forecast.sys.country === 'JP') {
    const geores = await axios.get(JP_LOCATION_URI, {
      params: new URLSearchParams({
        x: forecast.coord.lon.toString(),
        y: forecast.coord.lat.toString(),
      }),
    });
    const data = geores.data;

    // 情報の整形
    description.push(`緯度: ${forecast.coord.lat} / 経度: ${forecast.coord.lon}`);
    description.push(
      `実際の場所: ${data.response.location[0].prefecture}${data.response.location[0].city}${data.response.location[0].town}`
    );
    description.push('');
  } else {
    description.push(`緯度: ${forecast.coord.lat} / 経度: ${forecast.coord.lon}`);
    description.push(`実際の場所: https://www.google.co.jp/maps/search/${forecast.coord.lat},${forecast.coord.lon}/`);
    description.push('');
  }
  embed.setDescription(description.join('\n'));

  embed.setFields([
    { name: '天候', value: `${weather} (雲の量: ${cloud} ％)`, inline: false },
    { name: '気温', value: `${temp} ℃ (${tempMin} ℃/${tempMax} ℃)`, inline: true },
    { name: '体感', value: `${feelLike} ℃`, inline: true },
    { name: '降水確率', value: `${popDay} ％`, inline: true },
    { name: '湿度', value: `${humidityDay} ％`, inline: true },
    { name: '風速', value: `${windDeg} ${windSpeed}m/s`, inline: true },
    { name: 'UV指数', value: `${uvi}`, inline: true },
  ]);

  return embed;
}

/**
 * 指定日の天気を返す
 * @param onecall
 * @param index
 * @returns
 */
async function weatherDay(onecall: Onecall, index: number): Promise<EmbedBuilder> {
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
  const embed = new EmbedBuilder();
  const description = [];

  const geores = await axios.get(JP_LOCATION_URI, {
    params: new URLSearchParams({
      x: onecall.lon.toString(),
      y: onecall.lat.toString(),
    }),
  });
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
  embed.setDescription(description.join('\n'));

  embed.setFields([
    { name: '天候', value: `${weather} (雲の量: ${cloud} ％)`, inline: true },
    { name: '気温', value: `${temp} ℃ (${tempMin} ℃/${tempMax} ℃)`, inline: true },
    { name: '体感', value: `${feelLike} ℃`, inline: true },
    { name: '降水確率', value: `${popDay} ％`, inline: true },
    { name: '湿度', value: `${humidityDay} ％`, inline: true },
    { name: '風速', value: `${windDeg} ${windSpeed}m/s`, inline: true },
    { name: 'UV指数', value: `${uvi}`, inline: true },
  ]);

  return embed;
}

/**
 * 今日の天気を返す.
 * @param forecast
 * @param onecall
 */
async function weatherTodayJson(
  forecast: Forecast,
  onecall: Onecall,
  cityName: string
): Promise<{ name: string; value: string }[]> {
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

  return [
    { name: '場所', value: `${cityName}` },
    { name: '日時', value: `${dayjs().format('YYYY/MM/DD HH:mm')}` },
    { name: '座標', value: `緯度: ${forecast.coord.lat} / 経度: ${forecast.coord.lon}` },
    { name: '天候', value: `${weather} (雲の量: ${cloud} ％)` },
    { name: '気温', value: `${temp} ℃ (min: ${tempMin} ℃/max: ${tempMax} ℃)` },
    { name: '体感', value: `${feelLike} ℃` },
    { name: '降水確率', value: `${popDay} ％` },
    { name: '湿度', value: `${humidityDay} ％` },
    { name: '風速', value: `${windDeg} ${windSpeed}m/s` },
    { name: 'UV指数', value: `${uvi}` },
  ];
}

/**
 * 指定日の天気を返す
 * @param onecall
 * @param index
 * @returns
 */
async function weatherDayJson(
  onecall: Onecall,
  index: number,
  cityName: string
): Promise<{ name: string; value: string }[]> {
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

  return [
    { name: '場所', value: `${cityName}` },
    { name: '日時', value: `${dayjs().add(index, 'day').format('YYYY/MM/DD')}` },
    { name: '座標', value: `緯度: ${onecall.lat} / 経度: ${onecall.lon}` },
    { name: '天候', value: `${weather} (雲の量: ${cloud} ％)` },
    { name: '気温', value: `${temp} ℃ (min: ${tempMin} ℃/max: ${tempMax} ℃)` },
    { name: '体感', value: `${feelLike} ℃` },
    { name: '降水確率', value: `${popDay} ％` },
    { name: '湿度', value: `${humidityDay} ％` },
    { name: '風速', value: `${windDeg} ${windSpeed}m/s` },
    { name: 'UV指数', value: `${uvi}` },
  ];
}

/**
 * 居住地を取得する
 */
export async function getPref(uid: string): Promise<string | null> {
  const users = new UsersRepository();
  const user = await users.getByUid(uid);
  if (user) {
    if (user.userSetting.pref) {
      return user.userSetting.pref;
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
