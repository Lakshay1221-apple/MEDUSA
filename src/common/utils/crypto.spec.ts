import {
  encryptToken,
  decryptToken,
  hashPassword,
  comparePassword,
  hashToken,
} from './crypto';

describe('CryptoUtils', () => {
  const secretKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  it('should encrypt and decrypt tokens using AES-256-GCM', () => {
    const rawToken = 'gho_16C7e42F292c6912E7710c838347Ae178B4a';
    const encrypted = encryptToken(rawToken, secretKey);

    expect(encrypted).not.toBe(rawToken);
    expect(encrypted.split(':')).toHaveLength(3); // iv:tag:encrypted

    const decrypted = decryptToken(encrypted, secretKey);
    expect(decrypted).toBe(rawToken);
  });

  it('should hash and compare passwords securely', async () => {
    const rawPassword = 'superSecurePassword123!';
    const hashed = await hashPassword(rawPassword);

    expect(hashed).not.toBe(rawPassword);
    const isValid = await comparePassword(rawPassword, hashed);
    expect(isValid).toBe(true);

    const isInvalid = await comparePassword('wrongPassword', hashed);
    expect(isInvalid).toBe(false);
  });

  it('should hash tokens deterministically with SHA-256', () => {
    const token = 'sample-refresh-token';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
  });
});
