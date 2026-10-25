```javascript
const fs = require("fs");

const file = "tests/core.test.ts";
let source = fs.readFileSync(file, "utf8");

const marker = "Phase 4 safety and trend verification";

if (source.includes(marker)) {
  console.log("Phase 4 tests already exist. No changes made.");
  process.exit(0);
}

const tests = `
describe('${marker}',()=>{
  it('keeps the safety evaluator unavailable when no reviewed rules exist',async()=>{
    const {safetyRules,evaluateSafety}=await import('../src/safety');
    expect(safetyRules).toHaveLength(0);
    expect(evaluateSafety('menstrual',{kind:'daily',symptoms:[]})).toMatchObject({
      evaluationStatus:'unavailable',
      reviewStatus:'review_pending',
      triggered:true
    });
  });

  it('blocks AI payload generation when the real safety evaluator is unavailable',()=>{
    const result=buildAiPayload({
      journey:'menstrual',
      checkIns:[],
      safety:{
        level:'none',ruleIds:[],messageKey:'safety.no_configured_rule',
        sourceId:'FEMORA-SAFETY-CATALOG',reviewStatus:'reviewed',
        evaluationStatus:'evaluated',triggered:false
      },
      consent:{purpose:'health-summary',granted:true,policyVersion:'v1'}
    });
    expect(result).toEqual({ok:false,reason:'SAFETY_REVIEW'});
  });

  it('aggregates severity averages and excludes observations outside the window',async()=>{
    const {summarizeSymptoms}=await import('../src/journeys/checkins');
    const rows=[
      {date:'2026-02-01',symptoms:[{code:'cramp',severity:4}]},
      {date:'2026-02-10',symptoms:[{code:'cramp',severity:8}]},
      {date:'2026-02-15',symptoms:[{code:'cramp'}]},
      {date:'2026-01-31',symptoms:[{code:'cramp',severity:10}]}
    ];
    expect(summarizeSymptoms(rows as never,30,'2026-03-03')).toContainEqual({
      symptom:'cramp',count:2,meanSeverity:6
    });
  });

  it('does not count a missing severity as a severity observation',async()=>{
    const {summarizeSymptoms}=await import('../src/journeys/checkins');
    expect(summarizeSymptoms([
      {date:'2026-03-01',sympt
```
