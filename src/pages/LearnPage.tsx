
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../ui/common/PageHeader";
import { mockArticles, sampleLabel } from "../mocks";
import { useAppContext } from "../app/providers";

function isAdult(dob: string | null): boolean {
  if (!dob) return false;
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > new Date()) return false;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age -= 1;

  return age >= 18;
}

export default function LearnPage() {
  const [query, setQuery] = useState("");
  const { activeProfile } = useAppContext();

  const dob = activeProfile
    ? localStorage.getItem(`femora.profile-dob.${activeProfile.id}`)
    : null;
  const adult = isAdult(dob);

  const articles = useMemo(() => {
    const normalised = query.trim().toLowerCase();
    return mockArticles.filter((article) =>
      `${article.title} ${article.category} ${article.summary}`
        .toLowerCase()
        .includes(normalised),
    );
  }, [query]);

  return (
    <div>
      <PageHeader
        eyebrow="THE LEARNING SPACE"
        title="Learn at your own pace."
        description="Explore general educational topics and prepare questions for a qualified healthcare professional."
      />

      <div className="field">
        <label htmlFor="article-search">Search educational topics</label>
        <input
          id="article-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try cycle, pregnancy, menopause..."
        />
      </div>

      <div className="notice notice-warning" style={{ marginBottom: 20 }}>
        {sampleLabel} 
      </div>

      <section className="section-card sexual-wellbeing-entry" aria-labelledby="sexual-wellbeing-title">
        <span className="article-category">OPTIONAL · ADULTS 18+</span>
        <h2 id="sexual-wellbeing-title">Sexual Wellbeing</h2>
        <p>
          Optional educational information, symptom notes and questions to
          discuss with a qualified healthcare professional.
        </p>
        {adult ? (
          <Link className="button button-primary" to="/menstrual/sexual-wellbeing">
            Open Sexual Wellbeing
          </Link>
        ) : (
          <>
            <p className="field-help">
              This section is available only to profiles whose saved date of
              birth indicates age 18 or older. A self-declared DOB is not identity verification.
            </p>
            <Link className="button button-secondary" to="/settings">
              {dob ? "Review profile date of birth" : "Add date of birth in settings"}
            </Link>
          </>
        )}
      </section>

      {articles.length === 0 ? (
        <div className="section-card empty-state">
          <h2>No matching topics</h2>
          <p>Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {articles.map((article) => (
            <article className="section-card article-card" key={article.id}>
              <span className="article-category">{article.category}</span>
              <h2>{article.title}</h2>
              <p>{article.summary}</p>
              <span className={`article-status${article.reviewed ? " article-status-reviewed" : ""}`}>
  {article.reviewed ? "Reviewed resource" : "Learning example"}
</span>
<p className="learning-note">
  Explore health topics and discover questions to discuss with your care team.
  Example articles are provided for learning.
</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
