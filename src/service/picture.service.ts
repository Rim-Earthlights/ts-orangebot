import sharp from 'sharp';

export class PictureService {
  constructor() {}

  /**
   * 画像を圧縮する
   * @param buffer 画像バッファ
   * @param contentType 元の画像のContent-Type
   * @param maxSizeMB 最大サイズ（MB）
   * @returns 圧縮後のbase64形式の画像
   */
  async compressImage(buffer: Buffer, contentType: string = 'image/jpeg', maxSizeMB: number = 10): Promise<string> {
    console.log('compressImage', buffer.length);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // 現在のサイズを確認
    if (buffer.length <= maxSizeBytes) {
      // サイズが制限内ならそのままbase64に変換
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    }

    // 圧縮率を計算（目標サイズに合わせる）
    const compressionRatio = maxSizeBytes / buffer.length;

    // 画像のメタデータを取得
    const metadata = await sharp(buffer).metadata();

    // 新しいサイズを計算（面積比で縮小）
    const newWidth = Math.round(metadata.width! * Math.sqrt(compressionRatio));
    const newHeight = Math.round(metadata.height! * Math.sqrt(compressionRatio));

    // 画像をリサイズして圧縮
    let sharpInstance = sharp(buffer).resize(newWidth, newHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // 元の画像形式に基づいて適切な出力形式を設定
    if (contentType.includes('png') || contentType.includes('bmp')) {
      // BMPはPNGとして処理
      sharpInstance = sharpInstance.png({ quality: 80 });
    } else if (contentType.includes('gif')) {
      sharpInstance = sharpInstance.gif();
    } else {
      // デフォルトはJPEG
      sharpInstance = sharpInstance.jpeg({ quality: 80 });
    }

    const compressedBuffer = await sharpInstance.toBuffer();

    // 圧縮後のサイズを確認
    if (compressedBuffer.length > maxSizeBytes) {
      // まだ大きい場合はさらに圧縮
      return this.compressImage(compressedBuffer, contentType, maxSizeMB * 0.8);
    }

    return `data:${contentType};base64,${compressedBuffer.toString('base64')}`;
  }
}
