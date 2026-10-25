import { describe, it, expect } from 'vitest';
import { CONTENT_TOPICS } from '../src/content/data';
import {
  searchContent,
  getTopic,
  getAllTopics,
  getReviewedPassagesForAi,
} from '../src/content/search';

describe('Reviewed Medical Content Library Tests', () => {
  it('parses all markdown topics with required metadata fields', () => {
    expect(CONTENT_TOPICS.length).toBeGreaterThanOrEqual(21);

    for (const topic of CONTENT_TOPICS) {
      expect(topic.id).toBeDefined();
      expect(topic.id.length).toBeGreaterThan(3);
      expect(topic.title).toBeDefined();
      expect(topic.title.length).toBeGreaterThan(5);
      expect(['menstrual', 'maternity', 'menopause', 'shared']).toContain(topic.journey);
      expect(['reviewed', 'pending']).toContain(topic.reviewStatus);
      expect(topic.content).toBeDefined();
      expect(topic.content.length).toBeGreaterThan(100);
    }
  });

  it('guarantees all topic IDs are strictly unique across journeys', () => {
    const ids = CONTENT_TOPICS.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('verifies every topic contains credible medical source metadata', () => {
    for (const topic of CONTENT_TOPICS) {
      expect(topic.sources).toBeDefined();
      expect(topic.sources.length).toBeGreaterThan(0);

      for (const source of topic.sources) {
        expect(source.name).toBeDefined();
        expect(source.organization).toBeDefined();
      }
    }
  });

  it('verifies pending content is explicitly flagged as pending and not marked reviewed', () => {
    const pendingTopics = CONTENT_TOPICS.filter((t) => t.reviewStatus === 'pending');
    expect(pendingTopics.length).toBeGreaterThanOrEqual(3);

    for (const pt of pendingTopics) {
      expect(pt.reviewStatus).toBe('pending');
      // Content body should also contain a pending notice
      expect(pt.content.toLowerCase()).toContain('pending');
    }
  });

  it('MiniSearch searches titles, keywords, and content accurately', () => {
    // Search for dysmenorrhea / cramps
    const results = searchContent('dysmenorrhea');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBeDefined();
    expect(results[0].excerpt).toBeDefined();
    expect(results[0].sources.length).toBeGreaterThan(0);

    // Search with journey filter
    const maternityResults = searchContent('preterm', { journey: 'maternity' });
    for (const r of maternityResults) {
      expect(['maternity', 'shared']).toContain(r.journey);
    }
  });

  it('supports empty queries by returning topics filtered by journey', () => {
    const allMenopause = searchContent('', { journey: 'menopause' });
    expect(allMenopause.length).toBeGreaterThanOrEqual(7);
    for (const r of allMenopause) {
      expect(['menopause', 'shared']).toContain(r.journey);
    }
  });

  it('guarantees ONLY reviewed passages enter the AI payload (pending strictly excluded)', () => {
    // Query terms that match pending topics
    const passages = getReviewedPassagesForAi('glossary terminology', 'menstrual', 5);

    for (const p of passages) {
      const topic = getTopic(p.id);
      expect(topic).toBeDefined();
      // MUST BE REVIEWED ONLY!
      expect(topic?.reviewStatus).toBe('reviewed');
      expect(topic?.reviewStatus).not.toBe('pending');
    }
  });
});
