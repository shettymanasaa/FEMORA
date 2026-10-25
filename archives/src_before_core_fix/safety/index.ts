import type {Journey} from '../core/contracts';
export type SafetyLevel='none'|'info'|'seek_care'|'urgent';
export type SafetyReviewStatus='review_pending'|'reviewed';
export interface SafetyRule { id:string; journey:Journey; condition:(payload:unknown)=>boolean; messageKey:string; sourceId:string; reviewStatus:SafetyReviewStatus; level:Exclude<SafetyLevel,'none'> }
export interface SafetyResult { level:SafetyLevel; ruleIds:string[]; messageKey:string; sourceId:string; reviewStatus:SafetyReviewStatus; evaluationStatus:'unavailable'|'evaluated'; triggered:boolean }
/** No clinical rules are enabled until sourced and clinically reviewed. Invalid input fails closed to an uncertain review result. */
export const safetyRules:readonly SafetyRule[]=Object.freeze([] as SafetyRule[]);
export function evaluateSafety(journey:Journey,payload:unknown):SafetyResult {
 const fallback:SafetyResult={level:'none',ruleIds:[],messageKey:'safety.evaluation_unavailable',sourceId:'FEMORA-SAFETY-POLICY-UNREVIEWED',reviewStatus:'review_pending',evaluationStatus:'unavailable',triggered:true};
 try { if(!['menstrual','maternity','menopause'].includes(journey)||payload===null||typeof payload!=='object')return fallback;
  const activeRules=safetyRules.filter(r=>r.reviewStatus==='reviewed'&&!!r.id.trim()&&!!r.sourceId.trim()&&!!r.messageKey.trim());if(!activeRules.length)return fallback;const matches=activeRules.filter(r=>r.journey===journey&&r.condition(payload)).sort((a,b)=>a.id.localeCompare(b.id));if(!matches.length)return{level:'none',ruleIds:[],messageKey:'safety.no_configured_rule',sourceId:'FEMORA-SAFETY-CATALOG',reviewStatus:'reviewed',evaluationStatus:'evaluated',triggered:false};
  const level=matches.some(r=>r.level==='urgent')?'urgent':matches.some(r=>r.level==='seek_care')?'seek_care':'info';return{level,ruleIds:matches.map(r=>r.id),messageKey:matches[0]!.messageKey,sourceId:matches[0]!.sourceId,reviewStatus:'reviewed',evaluationStatus:'evaluated',triggered:true};
 }catch{return fallback;}
}
