import { playlistItemsResponse } from '../../constant/youtube/youtube.js';
import axios from 'axios';
import { CONFIG } from '../../config/config.js';

/**
 * プレイリストの動画を抽出する
 * @param playlistId
 * @returns
 */
export async function getPlaylistItems(playlistId: string): Promise<{ title: string; playlists: YoutubePlaylists[] }> {
    let p = await getPlaylistItemsResponse(playlistId);
    const title = p.items[0].snippet.channelTitle;
    let result = await convertPlaylist(p);

    while (p.nextPageToken) {
        p = await getPlaylistItemsResponse(playlistId, p.nextPageToken);
        const playlists = await convertPlaylist(p);
        result = result.concat(playlists);
    }
    return {
        title: title,
        playlists: result
    };
}

/**
 * 取得したレスポンスからプレイリスト形式に抽出する
 * @param itemresponse
 * @returns
 */
async function convertPlaylist(itemresponse: playlistItemsResponse): Promise<YoutubePlaylists[]> {
    return itemresponse.items
        .map((i) => {
            if (i.snippet.title === 'Private video' || i.snippet.title === 'Deleted video') {
                return;
            }
            return {
                videoId: i.snippet.resourceId.videoId,
                title: i.snippet.title,
                thumbnail: i.snippet.thumbnails.medium?.url
                    ? i.snippet.thumbnails.medium.url
                    : i.snippet.thumbnails.default.url
            };
        })
        .filter((e) => typeof e !== 'undefined') as YoutubePlaylists[];
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
        key: CONFIG.YOUTUBE.KEY,
        part: 'snippet',
        playlistId: playlistId,
        maxResults: '50'
    });
    if (pageToken) {
        params.set('pageToken', pageToken);
    }

    return (await axios.get(uri, { params })).data;
}

/**
 * プレイリストの動画情報
 */
export interface YoutubePlaylists {
    videoId: string;
    title: string;
    thumbnail: string;
}
