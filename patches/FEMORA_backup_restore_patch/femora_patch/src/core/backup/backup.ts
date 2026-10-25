import { CoreError, snapshotProfile, restoreProfile, getSettings } from '../../data/access';
import { backupSchema } from '../../contract/schemas';
import type { EncryptedBackup, Id, BackupPayload } from '../contracts';
import { encryptBytes, decryptBytes, type Vault, assertUnlocked, recoverVaultKeyFromBackup } from '../security/vault';

export const BACKUP_FORMAT = 'femora-backup-v1' as const;
const ITERATIONS = 600000;
const enc = new TextEncoder();
const b64 = (a: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(a)));
const un = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

function validatePayload(value: unknown, expectedProfileId: string): BackupPayload {
  const result = backupSchema.safeParse(value);
  if (!result.success || result.data.profileId !== expectedProfileId) {
    throw new CoreError('VALIDATION', 'Backup format, profile, or schema is invalid');
  }
  const required = ['profiles', 'healthProfile', 'journeyProfiles', 'checkins', 'records', 'appointments', 'notifications', 'bookmarks', 'recentlyViewed', 'consents', 'settings'];
  if (Object.keys(result.data.tables).length !== required.length || required.some(n => !(n in result.data.tables))) {
    throw new CoreError('VALIDATION', 'Backup tables do not match this version');
  }
  const profileRows = result.data.tables.profiles!;
  if (profileRows.length !== 1) throw new CoreError('VALIDATION', 'Backup must contain exactly one profile');
  const allIds = new Set<string>();
  for (const name of required) {
    for (const item of result.data.tables[name]!) {
      if (!item || typeof item !== 'object') throw new CoreError('VALIDATION', 'Backup record is invalid');
      const row = item as { id?: unknown; profileId?: unknown };
      if (typeof row.id !== 'string' || row.profileId !== result.data.profileId) throw new CoreError('VALIDATION', 'Backup contains a cross-profile or invalid record');
      if (allIds.has(row.id)) throw new CoreError('CONFLICT', 'Backup contains duplicate record IDs');
      allIds.add(row.id);
    }
  }
  if ((profileRows[0] as { id: string }).id !== result.data.profileId) throw new CoreError('VALIDATION', 'Backup profile row does not match its manifest');
  return result.data as BackupPayload;
}

export async function createBackup(profileId: Id, credential?: Vault): Promise<EncryptedBackup> {
  const setting = await getSettings(profileId);
  const tables = await snapshotProfile(profileId);
  const payload: BackupPayload = { format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), profileId, tables };

  // An unprotected profile is deliberately exported as plaintext. The warning is
  // part of the returned object so the UI can require confirmation before saving.
  if (!setting?.pinEnabled) {
    if (credential) throw new CoreError('VALIDATION', 'A vault must not be supplied for a profile without PIN protection');
    return { format: BACKUP_FORMAT, mode: 'plaintext', profileId, iv: '', ciphertext: '', payload, warning: true };
  }
  if (!credential) throw new CoreError('LOCKED', 'Unlock this PIN-protected profile before exporting a backup');
  assertUnlocked(credential);
  if (credential.profileId !== profileId || !credential.key) throw new CoreError('LOCKED', 'Unlock the requested profile');
  const encrypted = await encryptBytes(credential.key, enc.encode(JSON.stringify(payload)));
  if (!setting.pinSalt || !setting.encryptedDataKey || !setting.kdfVersion || !setting.kdfIterations) throw new CoreError('CRYPTO', 'PIN key metadata is incomplete; cannot create a restorable backup');
  return { format: BACKUP_FORMAT, mode: 'profile-key', profileId, ...encrypted, warning: false, keyEnvelope: { pinSalt: setting.pinSalt, kdfVersion: setting.kdfVersion, kdfIterations: setting.kdfIterations, encryptedDataKey: setting.encryptedDataKey } };
}

export async function inspectBackup(credential: string | Vault | undefined, backup: EncryptedBackup): Promise<BackupPayload> {
  if (!backup || backup.format !== BACKUP_FORMAT || !['profile-key', 'passphrase', 'plaintext'].includes(backup.mode)) {
    throw new CoreError('VALIDATION', 'Backup version is unsupported');
  }
  if (typeof backup.profileId !== 'string' || backup.profileId.length < 1 || backup.profileId.length > 128) {
    throw new CoreError('VALIDATION', 'Backup envelope is malformed');
  }
  if (backup.mode === 'plaintext') {
    if (backup.payload === undefined || backup.iv !== '' || backup.ciphertext !== '' || backup.salt !== undefined || backup.iterations !== undefined) {
      throw new CoreError('VALIDATION', 'Plaintext backup envelope is malformed');
    }
    return validatePayload(backup.payload, backup.profileId);
  }
  if (typeof backup.iv !== 'string' || typeof backup.ciphertext !== 'string' || backup.ciphertext.length > 140_000_000) {
    throw new CoreError('VALIDATION', 'Backup envelope is malformed');
  }
  if (backup.mode === 'passphrase') {
    // Existing passphrase backups remain importable for backward compatibility;
    // new exports never create this mode.
    if (typeof credential !== 'string' || typeof backup.salt !== 'string' || !/^[A-Za-z0-9+/]{22}==$/.test(backup.salt) || backup.iterations !== ITERATIONS) {
      throw new CoreError('VALIDATION', 'Backup key-derivation parameters are unsupported or malformed');
    }
    const salt = un(backup.salt);
    if (salt.length !== 16) throw new CoreError('VALIDATION', 'Backup salt is malformed');
    if (credential.length < 12) throw new CoreError('VALIDATION', 'Backup passphrase must be at least 12 characters');
    const material = await crypto.subtle.importKey('raw', enc.encode(credential), 'PBKDF2', false, ['deriveBits']);
    const raw = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, 256);
    const key = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    let parsed: unknown;
    try { parsed = JSON.parse(new TextDecoder().decode(await decryptBytes(key, backup))); }
    catch (e) { if (e instanceof CoreError) throw e; throw new CoreError('VALIDATION', 'Backup JSON is invalid'); }
    return validatePayload(parsed, backup.profileId);
  }
  if (backup.salt !== undefined || backup.iterations !== undefined) throw new CoreError('VALIDATION', 'Profile-key backup contains unexpected key-derivation fields');
  let key: CryptoKey;
  if (typeof credential === 'string') {
    const envelope = backup.keyEnvelope;
    if (!envelope || typeof envelope.pinSalt !== 'string' || typeof envelope.encryptedDataKey !== 'string' || !Number.isInteger(envelope.kdfVersion) || !Number.isInteger(envelope.kdfIterations)) throw new CoreError('VALIDATION', 'Backup is missing PIN recovery metadata');
    key = await recoverVaultKeyFromBackup(backup.profileId, credential, envelope);
  } else {
    if (typeof credential !== 'object' || credential === null) throw new CoreError('LOCKED', 'This backup requires the profile PIN or vault');
    assertUnlocked(credential);
    if (credential.profileId !== backup.profileId || !credential.key) throw new CoreError('NOT_FOUND', 'Backup belongs to another profile');
    key = credential.key;
  }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder().decode(await decryptBytes(key, backup))); }
  catch (e) { if (e instanceof CoreError) throw e; throw new CoreError('VALIDATION', 'Backup JSON is invalid'); }
  return validatePayload(parsed, backup.profileId);
}

export async function restoreBackup(credential: string | Vault | undefined, backup: EncryptedBackup) {
  const payload = await inspectBackup(credential, backup);
  await restoreProfile(payload.profileId, payload.tables);
  return { profileId: payload.profileId, importedAt: new Date().toISOString() };
}
