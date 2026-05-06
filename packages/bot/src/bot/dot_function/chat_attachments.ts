import axios from 'axios';
import { Attachment, Message } from 'discord.js';
import iconv from 'iconv-lite';
import { ChatCompletionContentPart } from 'openai/resources/index.js';
import { detectMimeType } from '../../common/common.js';
import { PictureService } from '../../service/picture.service.js';

const IMAGE_COMPRESS_THRESHOLD = 1 * 1024 * 1024;
const TEXT_FILE_SIZE_LIMIT = 100_000;

export async function processAttachments(message: Message): Promise<ChatCompletionContentPart[]> {
  return Promise.all(message.attachments.map((a) => processAttachment(a)));
}

async function processAttachment(a: Attachment): Promise<ChatCompletionContentPart> {
  const fileName = a.name;
  const contentTypes = a.contentType?.split('; ');
  const contentType = contentTypes?.[0];
  const charset = contentTypes?.[1]?.replace('charset=', '');

  if (!contentType) {
    return { type: 'text', text: `error: contentType is null or undefined` };
  }

  if (contentType.includes('image/')) {
    return processImage(a, contentType);
  }

  if (a.size > TEXT_FILE_SIZE_LIMIT) {
    return { type: 'text', text: `error: file size is too large, max size is 100KB. file: ${fileName}` };
  }

  return processTextFile(a, contentType, charset, fileName);
}

async function processImage(a: Attachment, contentType: string): Promise<ChatCompletionContentPart> {
  const { data } = (await axios.get(a.url, { responseType: 'arraybuffer' })) as { data: Buffer };

  if (data.length > IMAGE_COMPRESS_THRESHOLD) {
    const pictureService = new PictureService();
    const compressedImage = await pictureService.compressImage(data, contentType, 1);
    return { type: 'image_url', image_url: { url: compressedImage } };
  }
  const base64Image = `data:${detectMimeType(data)};base64,${data.toString('base64')}`;
  return { type: 'image_url', image_url: { url: base64Image } };
}

async function processTextFile(
  a: Attachment,
  contentType: string,
  charset: string | undefined,
  fileName: string
): Promise<ChatCompletionContentPart> {
  const { data: fileData } = (await axios.get(a.url, { responseType: 'arraybuffer' })) as { data: Buffer };
  const text = iconv.decode(fileData, charset === 'SHIFT_JIS' ? 'SHIFT_JIS' : 'utf-8');

  const lang = detectLang(contentType);
  if (lang === null) {
    return { type: 'text', text: `not support file type: [${a.contentType}]` };
  }
  return {
    type: 'text',
    text: [`file: ${fileName}`, '```' + lang, text, '```'].join('\n'),
  };
}

function detectLang(contentType: string): string | null {
  if (contentType.includes('application/json')) return 'json';
  if (contentType.includes('application/javascript')) return 'javascript';
  if (contentType.includes('video/MP2T')) return 'typescript';
  if (contentType.includes('text/')) return contentType.split('/')[1];
  return null;
}
