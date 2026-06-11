import { describe, expect, it } from 'vitest';
import { cat } from '../../src/services/photo.service.js';

describe('cat', () => {
  it('猫画像のURLを返す', async () => {
    for (let i = 0; i < 20; i++) {
      const url = await cat();
      expect(url).toMatch(/^https:\/\/s3-ap-northeast-1\.amazonaws\.com\/rim\.public-upload\/pic\/cat\/.+\.jpg$/);
    }
  });
});
