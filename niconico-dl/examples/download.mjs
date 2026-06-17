// 動画をファイルに保存する例。
// 実行: NICO_SESSION=xxxx node examples/download.mjs sm9 out.mp4
import { NiconicoClient } from "../dist/index.js";

const [, , target = "sm9", dest = "out.mp4"] = process.argv;

const nico = new NiconicoClient({ userSession: process.env.NICO_SESSION });

const info = await nico.getInfo(target);
console.log(`タイトル: ${info.title}`);
console.log(`再生時間: ${info.durationSec}s / 再生数: ${info.viewCount}`);
console.log(
  "画質:",
  info.formats.map((f) => `${f.label}(${Math.round(f.totalBitRate / 1000)}kbps)`).join(", "),
);

const { format } = await nico.download(target, dest, { quality: "best" });
console.log(`保存完了: ${dest} (${format.label})`);
