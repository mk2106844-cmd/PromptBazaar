import { describe, it, expect } from 'vitest';
import { compressImageTo1MB } from './compression';

describe('Compression', () => {
  describe('compressImageTo1MB', () => {
    it('throws an error if file is not an image', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      await expect(compressImageTo1MB(file)).rejects.toThrow('Kripya sirf image file upload karein (JPG, PNG, WEBP).');
    });
  });
});
