import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { ReportData } from '../types';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#2c372e',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#647c69',
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#3e5444',
  },
  brandTagline: {
    fontSize: 9,
    color: '#647c69',
    fontStyle: 'italic',
  },
  sampleBadge: {
    backgroundColor: '#cb8b8b',
    color: '#ffffff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#3e5444',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    fontSize: 9,
    color: '#4e6252',
  },
  section: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: '#f4f7f4',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#647c69',
  },
  sectionRose: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: '#fbf5f5',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#cb8b8b',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#3e5444',
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccd9cc',
  },
  tableLabel: {
    fontFamily: 'Helvetica',
    color: '#4e6252',
  },
  tableValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#2c372e',
  },
  symptomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccd9cc',
  },
  aiContainer: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: '#f8faf9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a8c0a9',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiBadge: {
    backgroundColor: '#647c69',
    color: '#ffffff',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    marginRight: 6,
  },
  aiTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#3e5444',
  },
  aiText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#344136',
  },
  disclaimerBox: {
    marginTop: 18,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f6e9e9',
    borderWidth: 0.5,
    borderColor: '#dfb5b5',
  },
  disclaimerText: {
    fontSize: 8,
    lineHeight: 1.3,
    color: '#873d3d',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#849b89',
    borderTopWidth: 0.5,
    borderTopColor: '#ccd9cc',
    paddingTop: 6,
  },
});

export interface ReportDocumentProps {
  data: ReportData;
}

export const ReportDocument: React.FC<ReportDocumentProps> = ({ data }) => {
  const journeyTitleMap: Record<string, string> = {
    menstrual: 'Menstrual Health Clinical Summary',
    maternity: 'Maternity & Postpartum Care Summary',
    menopause: 'Menopause & Transition Health Report',
  };

  const reportTitle =
    journeyTitleMap[data.journey] || 'FEMORA Clinical Health Report';

  return (
    <Document title={`${data.profileNickname} - ${reportTitle}`} author="FEMORA">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View>
              <Text style={styles.brandTitle}>FEMORA</Text>
              <Text style={styles.brandTagline}>Care for every phase of her life.</Text>
            </View>
            {data.isSample && (
              <View style={styles.sampleBadge}>
                <Text>SAMPLE DATA</Text>
              </View>
            )}
          </View>

          <Text style={styles.reportTitle}>{reportTitle}</Text>

          <View style={styles.metaRow}>
            <Text>Patient: {data.profileNickname}</Text>
            <Text>Reporting Period: {data.periodLabel} ({data.dateRange.start} to {data.dateRange.end})</Text>
            <Text>Generated: {data.generatedAt.slice(0, 10)}</Text>
          </View>
        </View>

        {/* Section: Executive Health Summary */}
        {data.sectionsIncluded.includes('summary') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Recorded Health Metrics</Text>
            {Object.entries(data.metrics).map(([key, value]) => (
              <View key={key} style={styles.tableRow}>
                <Text style={styles.tableLabel}>{key}</Text>
                <Text style={styles.tableValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Section: Symptoms Summary */}
        {data.sectionsIncluded.includes('symptoms') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Symptom Frequency & Severity</Text>
            {data.symptomsSummary.length === 0 ? (
              <Text style={{ fontStyle: 'italic', color: '#647c69' }}>
                No symptoms logged during this reporting window.
              </Text>
            ) : (
              data.symptomsSummary.map((item) => (
                <View key={item.symptomId} style={styles.symptomItem}>
                  <Text style={styles.tableLabel}>{item.name}</Text>
                  <Text style={styles.tableValue}>
                    {item.count} check-ins
                    {item.avgScore !== undefined ? ` (Avg Severity: ${item.avgScore}/10)` : ''}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Section: Trend Analysis */}
        {data.sectionsIncluded.includes('trends') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Trend Summaries</Text>
            {data.trends.map((t, idx) => (
              <Text key={idx} style={{ marginBottom: 4, lineHeight: 1.3 }}>
                • {t.summary}
              </Text>
            ))}
          </View>
        )}

        {/* Section: Appointments */}
        {data.sectionsIncluded.includes('appointments') && data.appointments && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Care Encounters & Appointments</Text>
            {data.appointments.length === 0 ? (
              <Text style={{ fontStyle: 'italic', color: '#647c69' }}>
                No appointments recorded in this period.
              </Text>
            ) : (
              data.appointments.map((apt, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.tableLabel}>{apt.date}: {apt.title}</Text>
                  <Text style={styles.tableValue}>[{apt.status.toUpperCase()}]</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Section: Confidential Sexual Wellbeing */}
        {data.sexualWellbeingSection && (
          <View style={styles.sectionRose}>
            <Text style={{ ...styles.sectionTitle, color: '#873d3d' }}>
              Confidential: Sexual Wellbeing Summary
            </Text>
            <Text style={{ color: '#5e3030', lineHeight: 1.3 }}>
              {data.sexualWellbeingSection.summary} (Included by explicit patient request)
            </Text>
          </View>
        )}

        {/* Section: AI Explanation */}
        {data.aiExplanation && (
          <View style={styles.aiContainer}>
            <View style={styles.aiHeader}>
              <View style={styles.aiBadge}>
                <Text>AI-GENERATED EXPLANATION</Text>
              </View>
              <Text style={styles.aiTitle}>Clinical Communication Context</Text>
            </View>
            <Text style={styles.aiText}>{data.aiExplanation}</Text>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>{data.disclaimer}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>FEMORA Health Summary • On-Device Generation</Text>
          <Text>Confidential Medical Record • Page 1</Text>
        </View>
      </Page>
    </Document>
  );
};
