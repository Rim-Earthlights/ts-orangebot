import sharp from 'sharp';

export class PictureService {
  constructor() {}

  /**
   * 画像を圧縮する
   * @param buffer 画像バッファ
   * @param maxSizeMB 最大サイズ（MB）
   * @returns 圧縮後のbase64形式の画像
   */
  async compressImage(buffer: Buffer, maxSizeMB: number = 10): Promise<string> {
    console.log('compressImage', buffer.length);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // 現在のサイズを確認
    if (buffer.length <= maxSizeBytes) {
      // サイズが制限内ならそのままbase64に変換
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }

    // 圧縮率を計算（目標サイズに合わせる）
    const compressionRatio = maxSizeBytes / buffer.length;

    // 画像のメタデータを取得
    const metadata = await sharp(buffer).metadata();

    // 新しいサイズを計算（面積比で縮小）
    const newWidth = Math.round(metadata.width! * Math.sqrt(compressionRatio));
    const newHeight = Math.round(metadata.height! * Math.sqrt(compressionRatio));

    // 画像をリサイズして圧縮
    const compressedBuffer = await sharp(buffer)
      .resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 }) // JPEG品質を下げて圧縮
      .toBuffer();

    // 圧縮後のサイズを確認
    if (compressedBuffer.length > maxSizeBytes) {
      // まだ大きい場合はさらに圧縮
      return this.compressImage(compressedBuffer, maxSizeMB * 0.8);
    }

    return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
  }
}
