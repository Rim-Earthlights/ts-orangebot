import axios, { AxiosResponse } from 'axios';
import { URLSearchParams } from 'url';

/**
 * 指定URLにGETしてレスポンスを返却する
 *
 * @param uri uri
 * @param params parameters
 * @returns AxiosResponse
 */
export async function getAsync(uri: string, params: URLSearchParams): Promise<AxiosResponse> {
    return await axios.get(uri, { params });
}
