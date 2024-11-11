/**
 * プレイリスト取得APIのレスポンス
 */
export interface playlistItemsResponse {
  kind: 'youtube#playlistItemListResponse';
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  items: [
    {
      kind: 'youtube#playlistItem';
      etag: string;
      id: string;
      snippet: {
        publishedAt: Date;
        channelId: string;
        title: string;
        description: string;
        thumbnails: {
          default: {
            url: string;
            width: number;
            height: number;
          };
          medium?: {
            url: string;
            width: number;
            height: number;
          };
          high?: {
            url: string;
            width: number;
            height: number;
          };
          standard?: {
            url: string;
            width: number;
            height: number;
          };
          maxres?: {
            url: string;
            width: number;
            height: number;
          };
        };
        channelTitle: string;
        playlistId: string;
        position: number;
        resourceId: {
          kind: 'youtube#video';
          videoId: string;
        };
        videoOwnerChannelTitle: string;
        videoOwnerChannelId: string;
      };
    }
  ];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}
