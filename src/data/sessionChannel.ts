export const FEMORA_SESSION_CHANNEL='femora-session-v1';
const STORAGE_KEY='femora:session-invalidation:v1';
type Invalidation={type:'invalidate';profileId:string;source:string};
function isInvalidation(value:unknown):value is Invalidation{return!!value&&typeof value==='object'&&(value as Invalidation).type==='invalidate'&&typeof (value as Invalidation).profileId==='string'&&typeof (value as Invalidation).source==='string'}
export function createSessionInvalidationChannel(onInvalidate:(profileId:string)=>void){
 const source=globalThis.crypto?.randomUUID?.()??String(Date.now())+'-'+String(Math.random());
 let channel:BroadcastChannel|undefined;
 let storageListener:((event:StorageEvent)=>void)|undefined;
 const receive=(value:unknown)=>{if(isInvalidation(value)&&value.source!==source)onInvalidate(value.profileId)};
 try{if(typeof BroadcastChannel!=='undefined')channel=new BroadcastChannel(FEMORA_SESSION_CHANNEL)}catch{channel=undefined}
 if(channel)channel.onmessage=event=>receive(event.data);
 if(typeof window!=='undefined'){storageListener=event=>{if(event.key!==STORAGE_KEY||!event.newValue)return;try{receive(JSON.parse(event.newValue))}catch{/* Ignore malformed cross-tab events. */}};window.addEventListener('storage',storageListener)}
 const publishStorage=(message:Invalidation)=>{try{if(typeof localStorage==='undefined')return;localStorage.setItem(STORAGE_KEY,JSON.stringify(message));localStorage.removeItem(STORAGE_KEY)}catch{/* Storage may be disabled; no secret data is written. */}}
 return{
  invalidate(profileId:string){if(!profileId)return;const message:Invalidation={type:'invalidate',profileId,source};try{channel?.postMessage(message)}catch{/* Try the storage fallback below. */}publishStorage(message)},
  close(){channel?.close();if(storageListener&&typeof window!=='undefined')window.removeEventListener('storage',storageListener)}
 };
}
