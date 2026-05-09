/**
 * 音楽キューに追加する楽曲の最小限の型。
 * Discord/YouTube 等のソースに依らず、リポジトリ層が受け付ける DTO として用いる。
 */
export interface MusicAddItem {
  videoId: string;
  title: string;
  thumbnail: string;
}
