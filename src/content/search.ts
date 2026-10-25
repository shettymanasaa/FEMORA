import MiniSearch from 'minisearch';
import { CONTENT_TOPICS } from './data';
import {
  ContentTopic,
  ContentSearchResult,
  Journey,
  ContentPassage,
} from '../types';

export interface ContentSearchFilters {
  journey?: Journey | 'shared';
  onlyReviewed?: boolean;
  limit?: number;
}

// Initialize MiniSearch instance
let miniSearchInstance: MiniSearch<ContentTopic> | null = null;

function getMiniSearchInstance(): MiniSearch<ContentTopic> {
  if (miniSearchInstance) {
    return miniSearchInstance;
  }

  miniSearchInstance = new MiniSearch<ContentTopic>({
    fields: ['title', 'keywords', 'summary', 'content'], // fields to index
    storeFields: ['id', 'title', 'journey', 'sources', 'reviewStatus', 'summary'],
    searchOptions: {
      boost: { title: 3, keywords: 2, summary: 1.5, content: 1 },
      prefix: true,
      fuzzy: 0.2,
    },
    extractField: (document, fieldName) => {
      if (fieldName === 'keywords') {
        return (document.keywords || []).join(' ');
      }
      return (document as unknown as Record<string, unknown>)[fieldName] as string || '';
    },
  });

  miniSearchInstance.addAll(CONTENT_TOPICS);
  return miniSearchInstance;
}

/**
 * Searches the reviewed educational content library using MiniSearch keyword indexing.
 * Supports filtering by journey, review status, empty queries, and no-results states.
 */
export function searchContent(
  query?: string,
  filters?: ContentSearchFilters
): ContentSearchResult[] {
  const normalizedQuery = (query || '').trim();
  const ms = getMiniSearchInstance();

  let results: ContentSearchResult[] = [];

  if (!normalizedQuery) {
    // If query is empty, return topics matching filter (or all)
    let matched = [...CONTENT_TOPICS];

    if (filters?.journey) {
      matched = matched.filter(
        (t) => t.journey === filters.journey || t.journey === 'shared'
      );
    }

    if (filters?.onlyReviewed) {
      matched = matched.filter((t) => t.reviewStatus === 'reviewed');
    }

    results = matched.map((t) => ({
      id: t.id,
      title: t.title,
      journey: t.journey,
      excerpt: t.summary || t.content.slice(0, 160) + '...',
      sources: t.sources,
      reviewStatus: t.reviewStatus,
      score: 1.0,
    }));
  } else {
    // MiniSearch search
    const searchFilter = (result: Record<string, unknown>) => {
      if (filters?.journey) {
        if (result.journey !== filters.journey && result.journey !== 'shared') {
          return false;
        }
      }
      if (filters?.onlyReviewed) {
        if (result.reviewStatus !== 'reviewed') {
          return false;
        }
      }
      return true;
    };

    const searchResults = ms.search(normalizedQuery, {
      filter: searchFilter,
    });

    results = searchResults.map((res) => {
      const topic = getTopic(res.id);
      const excerpt =
        (res.summary as string) ||
        (topic ? extractExcerpt(topic.content, normalizedQuery) : '');

      return {
        id: res.id,
        title: res.title as string,
        journey: res.journey as Journey | 'shared',
        excerpt: excerpt || 'Relevant health educational guide.',
        sources: (res.sources as ContentSearchResult['sources']) || [],
        reviewStatus: res.reviewStatus as 'reviewed' | 'pending',
        score: res.score,
      };
    });
  }

  if (filters?.limit && filters.limit > 0) {
    return results.slice(0, filters.limit);
  }

  return results;
}

/**
 * Retrieves a full ContentTopic by its unique ID.
 */
export function getTopic(topicId: string): ContentTopic | undefined {
  return CONTENT_TOPICS.find((t) => t.id === topicId);
}

/**
 * Returns all available topics.
 */
export function getAllTopics(): ContentTopic[] {
  return [...CONTENT_TOPICS];
}

/**
 * Retrieves only CLINICALLY REVIEWED passages relevant to a query and journey for AI grounding.
 * Strictly guarantees that pending content is NEVER sent to AI providers.
 */
export function getReviewedPassagesForAi(
  query: string,
  journey: Journey,
  maxPassages = 2
): ContentPassage[] {
  const searchResults = searchContent(query, {
    journey,
    onlyReviewed: true,
    limit: maxPassages,
  });

  const passages: ContentPassage[] = [];

  for (const item of searchResults) {
    const topic = getTopic(item.id);
    if (!topic || topic.reviewStatus !== 'reviewed') {
      continue;
    }

    // Extract a focused, clean paragraph or section (up to 400 chars)
    const paragraphs = topic.content
      .split('\n\n')
      .map((p) => p.replace(/[#*`_]/g, '').trim())
      .filter((p) => p.length > 40 && !p.startsWith('>'));

    const passageText =
      paragraphs.length > 0
        ? paragraphs.slice(0, 2).join(' ').slice(0, 500)
        : topic.summary || topic.title;

    passages.push({
      id: topic.id,
      text: passageText,
    });
  }

  return passages;
}

/**
 * Helper to extract an excerpt surrounding the search query terms.
 */
function extractExcerpt(content: string, query: string, maxLength = 160): string {
  const clean = content.replace(/[#*`_]/g, ' ').replace(/\s+/g, ' ');
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  let matchIndex = -1;
  for (const term of terms) {
    const idx = clean.toLowerCase().indexOf(term);
    if (idx !== -1) {
      matchIndex = idx;
      break;
    }
  }

  if (matchIndex === -1) {
    return clean.slice(0, maxLength) + (clean.length > maxLength ? '...' : '');
  }

  const start = Math.max(0, matchIndex - 40);
  const end = Math.min(clean.length, start + maxLength);
  let excerpt = clean.slice(start, end).trim();

  if (start > 0) excerpt = '...' + excerpt;
  if (end < clean.length) excerpt = excerpt + '...';

  return excerpt;
}
