import type { EducationArticle, Journey } from "../types";

export interface ContentContract {
  listArticles(journey?: Journey): Promise<EducationArticle[]>;
  getArticle(articleId: string): Promise<EducationArticle | null>;
}