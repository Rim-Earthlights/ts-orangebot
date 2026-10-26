/** Discord のメッセージ 1 件あたりの最大文字数 */
export const DISCORD_MESSAGE_LIMIT = 2000;

/**
 * 長い文章を Discord に送れる長さに分割する
 * 行単位でまとめ、1 行だけで上限を超える場合はその行を上限ごとに切る
 * @param content 分割する文章
 * @param limit 1 件あたりの最大文字数
 * @returns 分割後の文章 (連結すると元の文章に戻る)
 */
export function splitMessage(content: string, limit: number = DISCORD_MESSAGE_LIMIT): string[] {
  if (content.length <= limit) {
    return [content];
  }
  const chunks: string[] = [];
  let chunk = '';
  const lines = content.split('\n');
  lines.forEach((text, i) => {
    let line = i < lines.length - 1 ? text + '\n' : text;
    if (chunk.length + line.length > limit && chunk.length > 0) {
      chunks.push(chunk);
      chunk = '';
    }
    while (line.length > limit) {
      chunks.push(line.slice(0, limit));
      line = line.slice(limit);
    }
    chunk += line;
  });
  if (chunk.length > 0) {
    chunks.push(chunk);
  }
  return chunks;
}
