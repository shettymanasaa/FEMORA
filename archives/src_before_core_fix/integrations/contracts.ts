import type{coreApi}from'../data/public';import type{AiSafeAggregatePayload}from'./aiPayload';import type{SafetyResult}from'../safety';
/** Stable Person 1 contract. All operation results use coreApi's discriminated result shape. */
export type FrontendCoreContract=typeof coreApi;
/** Person 3 receives only the allowlisted aggregate; it contains no profile ID or raw check-in. */
export type ReportingInput=AiSafeAggregatePayload;
export type SafetyEvaluationContract=SafetyResult;
