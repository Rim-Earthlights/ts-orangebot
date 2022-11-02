import { playlistItemsResponse } from '../../constant/youtube/youtube';
import axios, { AxiosResponse } from 'axios';
import { CONFIG } from '../../config/config';

/**
 * プレイリストの動画を抽出する
 * @param playlistId
 * @returns
 */
export async function getPlaylistItems(playlistId: string): Promise<Playlists[]> {
    let p = await getPlaylistItemsResponse(playlistId);

    let result = await convertPlaylist(p);

    while (p.nextPageToken) {
        p = await getPlaylistItemsResponse(playlistId, p.nextPageToken);
        const playlists = await convertPlaylist(p);
        result = result.concat(playlists);
    }
    return result;
}

/**
 * 取得したレスポンスからプレイリスト形式に抽出する
 * @param itemresponse
 * @returns
 */
async function convertPlaylist(itemresponse: playlistItemsResponse): Promise<Playlists[]> {
    return itemresponse.items.map((i) => {
        return {
            videoId: i.snippet.resourceId.videoId,
            title: i.snippet.title,
            thumbnail: i.snippet.thumbnails.medium?.url
                ? i.snippet.thumbnails.medium.url
                : i.snippet.thumbnails.default.url
        };
    });
}

/**
 * API GET: playlistItems;
 * @param playlistId
 * @param pageToken
 * @returns
 */
async function getPlaylistItemsResponse(playlistId: string, pageToken?: string): Promise<playlistItemsResponse> {
    const uri = 'https://www.googleapis.com/youtube/v3/playlistItems';

    const params = new URLSearchParams({
        key: CONFIG.YOUTUBE_API_KEY,
        part: 'snippet',
        playlistId: playlistId,
        maxResults: '50'
    });
    if (pageToken) {
        params.set('pageToken', pageToken);
    }

    return await axios.get(uri, { params });
}

interface Playlists {
    videoId: string;
    title: string;
    thumbnail: string;
}
