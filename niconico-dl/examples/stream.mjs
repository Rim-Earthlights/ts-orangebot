// Readable ストリームとして取得し、任意の出力へパイプする例。
// 実行: NICO_SESSION=xxxx node examples/stream.mjs sm9 > out.mp4
import { NiconicoClient } from "../dist/index.js";

const [, , target = "sm9"] = process.argv;

const nico = new NiconicoClient({ userSession: process.env.NICO_SESSION });

const { stream, done, format } = await nico.getStream(target, {
  quality: "best",
  container: "mp4",
});

console.error(`取得中: ${format.label}`);
stream.pipe(process.stdout);
await done;
console.error("完了");
