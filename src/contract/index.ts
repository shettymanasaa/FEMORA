export * from '../types';

// Person 3 Deliverables
export {
  buildAiPayload,
  previewAiPayload,
  getAiExplanation,
  ClientAiPayloadSchema,
} from '../ai/payload';
export type {
  BuildAiPayloadOptions,
  AiPayloadPreview,
  GetAiExplanationOptions,
} from '../ai/payload';
export { generateLocalRuleBasedExplanation } from '../ai/localFallback';
export {
  searchContent,
  getTopic,
  getAllTopics,
  getReviewedPassagesForAi,
} from '../content/search';
export type { ContentSearchFilters } from '../content/search';
export {
  buildReport,
  AVAILABLE_REPORT_SECTIONS,
} from '../reports/reportBuilder';
export type { BuildReportOptions } from '../reports/reportBuilder';
export { ReportDocument } from '../reports/ReportDocument';
export type { ReportDocumentProps } from '../reports/ReportDocument';
export {
  downloadReport,
  shareReport,
  generateReportPdfBlob,
} from '../reports/reportActions';
export type { ShareReportResult } from '../reports/reportActions';
export { ReportPreviewView } from '../reports/ReportPreviewView';
export type { ReportPreviewViewProps } from '../reports/ReportPreviewView';
export { generateNotifications } from '../data/notifications';
export {
  loadDemoData,
  resetDemoData,
  wipeDemoData,
  isDemoLoaded,
} from '../data/demoLoader';
export { DEMO_PROFILE_ID } from '../data/demoData';
export { db } from '../data/db';

// Person 2 Engine Functions
export { evaluateSafety, CLINICAL_SAFETY_RULES } from '../safety/rules';
export type { SafetyRule } from '../safety/rules';
