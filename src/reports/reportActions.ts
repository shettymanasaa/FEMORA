import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { ReportDocument } from './ReportDocument';
import { ReportData, Result } from '../types';

/**
 * Generates a PDF Blob from the shared ReportDocument component.
 */
export async function generateReportPdfBlob(data: ReportData): Promise<Blob> {
  // @react-pdf/renderer pdf() returns a PDF document instance with .toBlob()
  const doc = React.createElement(ReportDocument, { data }) as any;
  const instance = pdf(doc);
  const blob = await instance.toBlob();
  return blob;
}

/**
 * Downloads the generated PDF report directly to the user's device.
 * Never uploads to any server.
 */
export async function downloadReport(
  data: ReportData
): Promise<Result<boolean>> {
  try {
    const blob = await generateReportPdfBlob(data);
    const filename = `femora-${data.journey}-report-${data.dateRange.end}.pdf`;

    if (typeof window !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return { ok: true, data: true };
  } catch (err: unknown) {
    return {
      ok: false,
      code: 'UNKNOWN',
      message: `Failed to download report PDF: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

export interface ShareReportResult {
  shared: boolean;
  method: 'web_share' | 'download_fallback';
}

/**
 * Shares the report using the device's native share sheet.
 * Triggers ONLY on explicit user action.
 * If file sharing is unavailable on the device or fails, falls back cleanly to file download.
 */
export async function shareReport(
  data: ReportData
): Promise<Result<ShareReportResult>> {
  try {
    const blob = await generateReportPdfBlob(data);
    const filename = `femora-${data.journey}-report-${data.dateRange.end}.pdf`;

    const file = new File([blob], filename, { type: 'application/pdf' });

    // Check if Web Share API with files is supported
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        title: `FEMORA ${data.journey.toUpperCase()} Report`,
        text: `Health trend report for ${data.profileNickname} (${data.periodLabel}). Generated securely on-device.`,
        files: [file],
      });

      return {
        ok: true,
        data: { shared: true, method: 'web_share' },
      };
    }

    // Fallback to direct download
    await downloadReport(data);
    return {
      ok: true,
      data: { shared: false, method: 'download_fallback' },
    };
  } catch (err: unknown) {
    // If user cancelled the share dialog, do not treat as an unrecoverable failure
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        ok: true,
        data: { shared: false, method: 'web_share' },
      };
    }

    // Attempt fallback download if share sheet errored
    try {
      await downloadReport(data);
      return {
        ok: true,
        data: { shared: false, method: 'download_fallback' },
      };
    } catch {
      return {
        ok: false,
        code: 'UNKNOWN',
        message: `Share and download fallback both failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      };
    }
  }
}
