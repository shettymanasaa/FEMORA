import { pinSchema } from '../contract/schemas';
import { CoreError, profiles, getSettings, saveSecuritySettings } from '../data/access';
import type { Settings, Id } from '../core/contracts';
const encoder=new TextEncoder(),KDF_ITERATIONS=310000;
const encode=(bytes:ArrayBuffer)=>{const data=new Uint8Array(bytes);let binary='';for(let offset=0;offset<data.length;offset+=0x8000)binary+=String.fromCharCode(...data.subarray(offset,offset+0x8000));return btoa(binary)};
const decode=(value:string)=>{if(typeof value!=='string'||value.length%4===1||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))throw new CoreError('CRYPTO','Encrypted data encoding is invalid');return Uint8Array.from(atob(value),c=>c.charCodeAt(0))};
async function deriveMaster(pin:string,salt:Uint8Array,iterations=KDF_ITERATIONS){const material=await crypto.subtle.importKey('raw',encoder.encode(pin) as unknown as BufferSource,'PBKDF2',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:salt as unknown as BufferSource,iterations,hash:'SHA-256'},material,256))}
async function derivePurpose(master:Uint8Array,purpose:string){const key=await crypto.subtle.importKey('raw',master as unknown as BufferSource,'HKDF',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt:encoder.encode('FEMORA-v1'),info:encoder.encode(purpose)},key,256))}
export interface Vault{profileId:Id;key:CryptoKey|undefined;lastActivity:number;locked:boolean;timer?:ReturnType<typeof setTimeout>}
export async function enablePin(profileId:Id,pin:string){pinSchema.parse(pin);let active;try{active=await profiles.active()}catch(e){if(!(e instanceof CoreError)||e.code!=='NOT_FOUND')throw e;active=await profiles.select(profileId)}if(active.id!==profileId)throw new CoreError('LOCKED','Select the profile before enabling PIN protection');const old=await getSettings(profileId);if(old?.pinEnabled)throw new CoreError('CONFLICT','PIN protection is already configured');const salt=crypto.getRandomValues(new Uint8Array(16)),rawKey=crypto.getRandomValues(new Uint8Array(32)),master=await deriveMaster(pin,salt),check=await derivePurpose(master,'pin-check'),wrapping=await derivePurpose(master,'data-key-wrap'),aes=await crypto.subtle.importKey('raw',wrapping as unknown as BufferSource,{name:'AES-GCM'},false,['encrypt']),iv=crypto.getRandomValues(new Uint8Array(12)),aad=encoder.encode(profileId),wrapped=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},aes,rawKey),key=await crypto.subtle.importKey('raw',rawKey as unknown as BufferSource,{name:'AES-GCM'},false,['encrypt','decrypt']);const setting:Settings={id:old?.id??crypto.randomUUID(),profileId,pinEnabled:true,kdfVersion:2,pinSalt:encode(salt.buffer),pinCheck:encode(check.buffer),kdfIterations:KDF_ITERATIONS,encryptedDataKey:`${encode(iv.buffer)}.${encode(wrapped)}`,lockAfterMs:600000,createdAt:old?.createdAt??new Date().toISOString(),updatedAt:new Date().toISOString()};try{await saveSecuritySettings(setting,key)}finally{master.fill(0);check.fill(0);wrapping.fill(0);rawKey.fill(0)}}
export async function unlock(profileId:Id,pin:string):Promise<Vault>{pinSchema.parse(pin);const setting=await getSettings(profileId);if(!setting?.pinSalt||!setting.pinCheck||!setting.encryptedDataKey)throw new CoreError('NOT_FOUND','PIN protection is not configured');const salt=decode(setting.pinSalt),master=await deriveMaster(pin,salt,setting.kdfIterations??KDF_ITERATIONS),legacy=setting.kdfVersion===1,check=legacy?master:await derivePurpose(master,'pin-check');if(encode(check.buffer)!==setting.pinCheck){master.fill(0);if(!legacy)check.fill(0);throw new CoreError('LOCKED','PIN is incorrect')}let wrap:Uint8Array|undefined;try{wrap=legacy?master:await derivePurpose(master,'data-key-wrap');const aes=await crypto.subtle.importKey('raw',wrap as unknown as BufferSource,{name:'AES-GCM'},false,['decrypt']),[ivText,cipherText]=setting.encryptedDataKey.split('.');if(!ivText||!cipherText)throw new Error('Malformed key envelope');const params: AesGcmParams=legacy?{name:'AES-GCM',iv:decode(ivText)}:{name:'AES-GCM',iv:decode(ivText),additionalData:encoder.encode(profileId)};const raw=await crypto.subtle.decrypt(params,aes,decode(cipherText)),key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);master.fill(0);if(!legacy)check.fill(0);if(!legacy)wrap.fill(0);new Uint8Array(raw).fill(0);const vault:Vault={profileId,key,lastActivity:Date.now(),locked:false};await profiles.setActive(profileId,vault);return vault}catch{master.fill(0);if(!legacy)check.fill(0);if(wrap&&!legacy)wrap.fill(0);throw new CoreError('CRYPTO','Profile could not be unlocked')}}
export function isExpired(vault:Vault,now=Date.now()){return vault.locked||!vault.key||now-vault.lastActivity>=600000}
export function assertUnlocked(vault:Vault,now=Date.now()){if(isExpired(vault,now)){lock(vault);throw new CoreError('LOCKED','Profile is locked')}touch(vault);vault.lastActivity=now}
export function touch(vault:Vault){if(isExpired(vault)){lock(vault);return}vault.lastActivity=Date.now();if(vault.timer)clearTimeout(vault.timer);vault.timer=setTimeout(()=>lock(vault),600000)}
export function lock(vault:Vault){vault.locked=true;vault.key=undefined;if(vault.timer)clearTimeout(vault.timer);profiles.clearActive(vault.profileId,vault)}
export async function encryptBytes(key:CryptoKey,data:Uint8Array){const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv as unknown as BufferSource},key,data as unknown as BufferSource);return{iv:encode(iv.buffer),ciphertext:encode(cipher)}}
export async function decryptBytes(key:CryptoKey,payload:{iv:string,ciphertext:string}){try{return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(payload.iv) as unknown as BufferSource},key,decode(payload.ciphertext) as unknown as BufferSource))}catch{throw new CoreError('CRYPTO','Encrypted data authentication failed')}}





export interface BackupKeyEnvelope { pinSalt: string; kdfVersion: number; kdfIterations: number; encryptedDataKey: string }
/** Recover a profile's data key from the PIN and the non-secret key-wrapping metadata embedded in a backup. Does not activate a session or touch the database. */
export async function recoverVaultKeyFromBackup(profileId: Id, pin: string, envelope: BackupKeyEnvelope): Promise<CryptoKey> {
  pinSchema.parse(pin);
  const salt=decode(envelope.pinSalt);
  if(salt.length!==16 || ![1,2].includes(envelope.kdfVersion) || !Number.isInteger(envelope.kdfIterations) || envelope.kdfIterations<100000 || envelope.kdfIterations>2000000) throw new CoreError('VALIDATION','Backup key envelope is malformed');
  const master=await deriveMaster(pin,salt,envelope.kdfIterations);
  const legacy=envelope.kdfVersion===1;
  let wrap:Uint8Array|undefined;
  try {
    wrap=legacy?master:await derivePurpose(master,'data-key-wrap');
    const aes=await crypto.subtle.importKey('raw',wrap as unknown as BufferSource,{name:'AES-GCM'},false,['decrypt']);
    const [ivText,cipherText]=envelope.encryptedDataKey.split('.');
    if(!ivText||!cipherText)throw new CoreError('VALIDATION','Backup key envelope is malformed');
    const params:AesGcmParams=legacy?{name:'AES-GCM',iv:decode(ivText)}:{name:'AES-GCM',iv:decode(ivText),additionalData:encoder.encode(profileId)};
    let raw:ArrayBuffer;
    try { raw=await crypto.subtle.decrypt(params,aes,decode(cipherText)); }
    catch { throw new CoreError('LOCKED','PIN is incorrect'); }
    const key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
    new Uint8Array(raw).fill(0);
    return key;
  } catch(e) { if(e instanceof CoreError)throw e; throw new CoreError('CRYPTO','Backup could not be unlocked with this PIN'); }
  finally {master.fill(0);if(wrap&&!legacy)wrap.fill(0);}
}
