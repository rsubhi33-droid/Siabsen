const { generateQrToken, verifyQrToken, generateQrImage } = require('../../src/services/qr.service');

describe('QR Service Unit Tests', () => {
  it('harus menghasilkan QR token dengan format sesiId:timestamp:signature', () => {
    const sesiId = 42;
    const token = generateQrToken(sesiId);

    expect(typeof token).toBe('string');
    const parts = token.split(':');
    expect(parts.length).toBe(3);
    expect(parseInt(parts[0], 10)).toBe(sesiId);
    expect(Number(parts[1])).toBeGreaterThan(0);
    expect(parts[2].length).toBe(16);
  });

  it('harus memvalidasi QR token yang baru dibuat sebagai valid', () => {
    const sesiId = 99;
    const token = generateQrToken(sesiId);
    const result = verifyQrToken(token);

    expect(result.valid).toBe(true);
    expect(result.sesiId).toBe(sesiId);
  });

  it('harus menolak QR token dengan format yang salah', () => {
    const result = verifyQrToken('invalid-format-token');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/format/i);
  });

  it('harus menolak QR token dengan signature yang tidak cocok', () => {
    const result = verifyQrToken('99:1700000000000:bad_signature12');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/signature mismatch/i);
  });

  it('harus dapat membuat QR image base64 data URL', async () => {
    const image = await generateQrImage('test-token');
    expect(typeof image).toBe('string');
    expect(image.startsWith('data:image/png;base64,')).toBe(true);
  }, 15000);
});
