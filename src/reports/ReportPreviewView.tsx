import React, { useState } from 'react';
import { ReportData } from '../types';
import { AVAILABLE_REPORT_SECTIONS } from './reportBuilder';
import { downloadReport, shareReport } from './reportActions';
import { Download, Share2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export interface ReportPreviewViewProps {
  initialReportData: ReportData;
  onSectionsChange?: (activeSections: string[]) => void;
  onRetry?: () => void;
}

export const ReportPreviewView: React.FC<ReportPreviewViewProps> = ({
  initialReportData,
  onSectionsChange,
  onRetry,
}) => {
  const [reportData, setReportData] = useState<ReportData>(initialReportData);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [actionStatus, setActionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Handle section toggles (removing optional sections dynamically)
  const toggleSection = (sectionId: string) => {
    const isCurrentlyIncluded = reportData.sectionsIncluded.includes(sectionId);
    let updatedSections: string[];

    if (isCurrentlyIncluded) {
      updatedSections = reportData.sectionsIncluded.filter((s) => s !== sectionId);
    } else {
      updatedSections = [...reportData.sectionsIncluded, sectionId];
    }

    const updatedData: ReportData = {
      ...reportData,
      sectionsIncluded: updatedSections,
    };

    setReportData(updatedData);
    if (onSectionsChange) {
      onSectionsChange(updatedSections);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setActionStatus({ type: null, message: '' });

    const result = await downloadReport(reportData);
    setIsDownloading(false);

    if (result.ok) {
      setActionStatus({
        type: 'success',
        message: 'Report PDF downloaded successfully.',
      });
    } else {
      setActionStatus({
        type: 'error',
        message: result.message || 'Download failed. Please retry.',
      });
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    setActionStatus({ type: null, message: '' });

    const result = await shareReport(reportData);
    setIsSharing(false);

    if (result.ok) {
      if (result.data.shared) {
        setActionStatus({
          type: 'success',
          message: 'Report shared successfully via native share sheet.',
        });
      } else {
        setActionStatus({
          type: 'success',
          message: 'Share sheet unavailable; report downloaded to your device as fallback.',
        });
      }
    } else {
      setActionStatus({
        type: 'error',
        message: result.message || 'Sharing failed. Please retry or download directly.',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Controls Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              Report Preview & Customization
              {reportData.isSample && (
                <span className="text-xs bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200 px-2 py-0.5 rounded-full font-medium">
                  Sample Data
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and toggle optional sections below before downloading or sharing.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownload}
              disabled={isDownloading || isSharing}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-sage-700 hover:bg-sage-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download PDF
            </button>

            <button
              onClick={handleShare}
              disabled={isDownloading || isSharing}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSharing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              Share
            </button>
          </div>
        </div>

        {/* Section Inclusion Toggles */}
        <div className="border-t border-border/60 pt-3">
          <p className="text-xs font-medium text-foreground mb-2">
            Included Report Sections:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AVAILABLE_REPORT_SECTIONS.map((sec: { id: string; title: string; isOptional: boolean }) => {
              const isChecked = reportData.sectionsIncluded.includes(sec.id);
              return (
                <label
                  key={sec.id}
                  className={`flex items-center gap-2 text-xs p-2 rounded border cursor-pointer select-none transition-colors ${
                    isChecked
                      ? 'bg-sage-50 border-sage-300 dark:bg-sage-950/40 dark:border-sage-800 text-foreground'
                      : 'bg-muted/40 border-border text-muted-foreground'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSection(sec.id)}
                    className="rounded text-sage-600 focus:ring-sage-500"
                  />
                  <span>{sec.title}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Feedback message */}
        {actionStatus.type && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              actionStatus.type === 'success'
                ? 'bg-sage-100 text-sage-900 border border-sage-200 dark:bg-sage-900/30 dark:text-sage-100 dark:border-sage-800'
                : 'bg-rose-100 text-rose-900 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-800'
            }`}
          >
            {actionStatus.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-sage-700" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
            )}
            <span>{actionStatus.message}</span>
            {actionStatus.type === 'error' && onRetry && (
              <button
                onClick={onRetry}
                className="underline ml-auto font-medium hover:text-rose-950"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Synchronized Visual Preview Body (Identical structure to PDF Document) */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b-2 border-sage-600 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-sage-800 dark:text-sage-200">
                FEMORA
              </h1>
              <p className="text-xs text-sage-600 dark:text-sage-400 italic">
                Care for every phase of her life.
              </p>
            </div>
            {reportData.isSample && (
              <span className="bg-rose-500 text-white text-xs px-2.5 py-1 rounded font-semibold uppercase tracking-wider">
                Sample Data
              </span>
            )}
          </div>

          <h2 className="text-lg font-bold text-foreground mt-3 capitalize">
            {reportData.journey} Health Consultation Summary
          </h2>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground mt-2">
            <span>
              <strong>Patient:</strong> {reportData.profileNickname}
            </span>
            <span>
              <strong>Period:</strong> {reportData.periodLabel} ({reportData.dateRange.start} to {reportData.dateRange.end})
            </span>
            <span>
              <strong>Generated:</strong> {reportData.generatedAt.slice(0, 10)}
            </span>
          </div>
        </div>

        {/* Section 1: Executive Metrics */}
        {reportData.sectionsIncluded.includes('summary') && (
          <div className="bg-sage-50 dark:bg-sage-950/30 border-l-4 border-sage-600 p-4 rounded-r-lg space-y-2">
            <h3 className="text-sm font-semibold text-sage-900 dark:text-sage-100">
              1. Recorded Health Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.entries(reportData.metrics).map(([key, val]) => (
                <div
                  key={key}
                  className="flex justify-between py-1 border-b border-sage-200 dark:border-sage-800"
                >
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-semibold text-foreground">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Symptoms Summary */}
        {reportData.sectionsIncluded.includes('symptoms') && (
          <div className="bg-sage-50 dark:bg-sage-950/30 border-l-4 border-sage-600 p-4 rounded-r-lg space-y-2">
            <h3 className="text-sm font-semibold text-sage-900 dark:text-sage-100">
              2. Symptom Frequency & Severity
            </h3>
            {reportData.symptomsSummary.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No symptoms recorded during this reporting window.
              </p>
            ) : (
              <div className="space-y-1 text-xs">
                {reportData.symptomsSummary.map((item) => (
                  <div
                    key={item.symptomId}
                    className="flex justify-between py-1 border-b border-sage-200 dark:border-sage-800"
                  >
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-semibold text-foreground">
                      {item.count} check-ins
                      {item.avgScore !== undefined && ` (Avg Severity: ${item.avgScore}/10)`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 3: Trends */}
        {reportData.sectionsIncluded.includes('trends') && (
          <div className="bg-sage-50 dark:bg-sage-950/30 border-l-4 border-sage-600 p-4 rounded-r-lg space-y-2">
            <h3 className="text-sm font-semibold text-sage-900 dark:text-sage-100">
              3. Trend Summaries
            </h3>
            <ul className="text-xs text-foreground space-y-1 list-disc list-inside">
              {reportData.trends.map((t, i) => (
                <li key={i}>{t.summary}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 4: Care Encounters */}
        {reportData.sectionsIncluded.includes('appointments') && reportData.appointments && (
          <div className="bg-sage-50 dark:bg-sage-950/30 border-l-4 border-sage-600 p-4 rounded-r-lg space-y-2">
            <h3 className="text-sm font-semibold text-sage-900 dark:text-sage-100">
              4. Care Encounters & Appointments
            </h3>
            <div className="space-y-1 text-xs">
              {reportData.appointments.map((apt, i) => (
                <div
                  key={i}
                  className="flex justify-between py-1 border-b border-sage-200 dark:border-sage-800"
                >
                  <span>{apt.date}: {apt.title}</span>
                  <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                    [{apt.status}]
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidential Sexual Wellbeing Section */}
        {reportData.sexualWellbeingSection && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 p-4 rounded-r-lg space-y-1">
            <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-200">
              Confidential: Sexual Wellbeing
            </h3>
            <p className="text-xs text-rose-900 dark:text-rose-100">
              {reportData.sexualWellbeingSection.summary} (Included by explicit patient confirmation)
            </p>
          </div>
        )}

        {/* AI Explanation Grounding Section */}
        {reportData.aiExplanation && (
          <div className="bg-card border border-sage-300 dark:border-sage-800 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-sage-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                AI-GENERATED EXPLANATION
              </span>
              <h3 className="text-xs font-semibold text-foreground">
                Clinical Communication Summary
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
              {reportData.aiExplanation}
            </p>
          </div>
        )}

        {/* Disclaimer Box */}
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-3 rounded-lg text-center">
          <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300 font-medium">
            {reportData.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};
