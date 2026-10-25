import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../app/providers";
import PageHeader from "../../ui/common/PageHeader";

type IntakeRecord = {
  dateOfBirth?: string;
};

const faqs = [
  {
    question: "How common is painful sex?",
    answer:
      "Pain during intercourse is very common—nearly 3 out of 4 women have pain during intercourse at some time during their lives. For some women, the pain is only a temporary problem; for others, it is a long-term problem.",
  },
  {
    question: "What causes pain during sex?",
    answer:
      "Pain during sex may be a sign of a gynecologic problem, such as ovarian cysts or endometriosis. Pain during sex also may be caused by problems with sexual response, such as a lack of desire (the feeling of wanting to have sex) or a lack of arousal (the physical and emotional changes that occur in the body as a result of sexual stimulation).\n\nThe internal female reproductive organs and the external female genitals.",
  },
  {
    question: "Where is pain during sex felt?",
    answer:
      "You may feel pain in your vulva, in the area surrounding the opening of your vagina (called the vestibule), or within your vagina. The perineum is a common site of pain during sex. You also may feel pain in your lower back, pelvic region, uterus, or bladder.",
  },
  {
    question:
      "When should I see a health care professional about painful sex?",
    answer:
      "If you have frequent or severe pain during sex, you should see an obstetrician-gynecologist (ob-gyn) or other health care professional. It is important to rule out gynecologic conditions that may be causing your pain. Your ob-gyn or other health care professional also can help you address problems with sexual response.",
  },
  {
    question: "What causes sexual response problems?",
    answer:
      "The following reasons are among the most common:\n\nYour state of mind—Emotions such as fear, guilt, shame, embarrassment, or awkwardness about having sex may make it hard to relax. When you cannot relax, arousal is difficult, and pain may result. Stress and fatigue can affect your desire to have sex.\n\nRelationship problems—Problems with your partner may interfere with your sexual response. A common relationship issue is a mismatch between partners in their level of desire for sex.\n\nMedications—Many medications can reduce sexual desire, including some birth control methods. Many pain medications also can reduce sexual desire.\n\nMedical and surgical conditions—Some medical conditions can indirectly affect sexual response. These conditions include arthritis, diabetes, cancer, and thyroid conditions. Some women who have had surgery find that it affects their body image, which may decrease their desire for sex.\n\nYour partner—If your partner has a sexual problem, it can make you anxious about sex. If your partner is taking a drug for erectile dysfunction, he may have delayed orgasm, which can lead to long, painful intercourse.",
  },
  {
    question:
      "What kinds of gynecologic conditions can cause pain during sex?",
    answer:
      "Pain during sexual intercourse can be a warning sign of many gynecologic conditions. Some of these conditions can lead to other problems if not treated:\n\nSkin disorders—Some skin disorders may result in ulcers or cracks in the skin of the vulva. Contact dermatitis is a common skin disorder that affects the vulva. It is a reaction to an irritating substance, such as perfumed soaps, douches, or lubricants. It may cause itching, burning, and pain. Treatment of skin disorders depends on the type of disorder.\n\nVulvodynia—This is a pain disorder that affects the vulva. When pain is confined to the vestibule (the area around the opening of the vagina), it is known as vulvar vestibulitis syndrome (VVS). There are many treatments available for vulvodynia, including self-care measures. Medication or surgery may be needed in some cases. For more information about this condition, see FAQ127 Vulvodynia.\n\nHormonal changes—During perimenopause and menopause, decreasing levels of the female hormone estrogen may cause vaginal dryness. Hormone therapy is one treatment option. Using a lubricant during sex or a vaginal moisturizer also may be helpful.\n\nVaginitis—Vaginitis, or inflammation of the vagina, can be caused by a yeast or bacterial infection. Symptoms are discharge and itching and burning of the vagina and vulva. Vaginitis can be treated with medication (see FAQ028 Vaginitis).\n\nVaginismus—Vaginismus is a reflex contraction (tightening) of the muscles at the opening of your vagina. Vaginismus may cause pain when you try to have sexual intercourse. Vaginismus can be treated with different forms of therapy.\n\nChildbirth—Women who have had an episiotomy or tears in the perineum during childbirth may have pain during sex that may last for several months. Treatments include physical therapy, medications, or surgery.\n\nOther causes—Pelvic inflammatory disease, endometriosis, and adhesions are all associated with pain during sex.",
  },
  {
    question:
      "What can I expect when I see my health care professional about pain during sex?",
    answer:
      "Your medical and sexual history, signs and symptoms, and findings from a physical exam are important factors in determining the cause of your pain. Sometimes, tests are needed to find the cause. A pelvic exam or ultrasound exam often gives clues about the causes of some kinds of pain. Further evaluation, sometimes involving a procedure called a laparoscopy, may be needed.\n\nYou also may be asked about medications that you are taking, whether you have any medical conditions, and past events that may affect how you feel about sex, such as sexual abuse. Other health care professionals may be consulted for further evaluation and treatment, such as a physical therapist or a dermatologist (a specialist in diseases of the skin).",
  },
  {
    question:
      "Are there things a woman can do on her own to help with pain during sex?",
    answer:
      "If you have pain during sex, see an ob-gyn or other health care professional. There also are some self-help measures you can try to relieve pain during sex:\n\nUse a lubricant. Water-soluble lubricants are a good choice if you experience vaginal irritation or sensitivity. Silicone-based lubricants last longer and tend to be more slippery than water-soluble lubricants. Do not use petroleum jelly, baby oil, or mineral oil with condoms. They can dissolve the latex and cause the condom to break.\n\nMake time for sex. Set aside a time when neither you nor your partner is tired or anxious.\n\nTalk to your partner. Tell your partner where and when you feel pain, as well as what activities you find pleasurable.\n\nTry sexual activities that do not cause pain. For example, if intercourse is painful, you and your partner may want to focus on oral sex or mutual masturbation.\n\nTry nonsexual, but sensual, activities like massage.\n\nTake pain-relieving steps before sex: empty your bladder, take a warm bath, or take an over-the-counter pain reliever before intercourse.\n\nTo relieve burning after intercourse, apply ice or a frozen gel pack wrapped in a small towel to the vulva.",
  },
];

const glossary = [
  {
    term: "Adhesions",
    definition: "Scarring that binds together the surfaces of tissues.",
  },
  {
    term: "Cysts",
    definition: "Sacs or pouches filled with fluid or other material.",
  },
  {
    term: "Endometriosis",
    definition:
      "A condition in which tissue that lines the uterus is found outside of the uterus, usually on the ovaries, fallopian tubes, and other pelvic structures.",
  },
  {
    term: "Episiotomy",
    definition:
      "A surgical incision made into the perineum (the region between the vagina and the anus) to widen the vaginal opening for delivery.",
  },
  {
    term: "Estrogen",
    definition: "A female hormone produced in the ovaries.",
  },
  {
    term: "Laparoscopy",
    definition:
      "A surgical procedure in which an instrument called a laparoscope is inserted into the pelvic cavity through a small incision. The laparoscope is used to view the pelvic organs. Other instruments can be used with it to perform surgery.",
  },
  {
    term: "Masturbation",
    definition:
      "Self-stimulation of the genitals, usually resulting in orgasm.",
  },
  {
    term: "Menopause",
    definition:
      "The time in a woman’s life when menstruation stops; defined as the absence of menstrual periods for 1 year.",
  },
  {
    term: "Obstetrician–Gynecologist (Ob-Gyn)",
    definition:
      "A physician with special skills, training, and education in women’s health.",
  },
  {
    term: "Pelvic Exam",
    definition:
      "A physical examination of a woman’s reproductive organs.",
  },
  {
    term: "Pelvic Inflammatory Disease",
    definition:
      "An infection of the uterus, fallopian tubes, and nearby pelvic structures.",
  },
  {
    term: "Perimenopause",
    definition:
      "The period before menopause that usually extends from age 45 years to 55 years.",
  },
  {
    term: "Perineum",
    definition: "The area between the vagina and the anus.",
  },
  {
    term: "Sexually Transmitted Infection (STI)",
    definition:
      "An infection that is spread by sexual contact, including chlamydia, gonorrhea, human papillomavirus (HPV), herpes, syphilis, and human immunodeficiency virus (HIV, the cause of acquired immunodeficiency syndrome [AIDS]).",
  },
  {
    term: "Ultrasound Exam",
    definition:
      "A test in which sound waves are used to examine internal structures.",
  },
  {
    term: "Vagina",
    definition:
      "A tube-like structure surrounded by muscles leading from the uterus to the outside of the body.",
  },
  {
    term: "Vestibule",
    definition:
      "The space within the labia minora into which the vagina and urethra open.",
  },
  {
    term: "Vulva",
    definition: "The external female genital area.",
  },
];

const mythCards = [
  {
    myth: "Pain during sex always has one obvious cause.",
    fact: "Similar symptoms can have different causes. A qualified clinician can assess your circumstances.",
  },
  {
    myth: "You should ignore frequent or severe pain.",
    fact: "Frequent or severe pain is a reason to speak with a qualified health care professional.",
  },
  {
    myth: "Vaginal dryness only happens during menopause.",
    fact: "Hormonal changes during perimenopause and menopause can contribute to dryness, but symptoms and causes vary.",
  },
  {
    myth: "It is always possible to identify the cause from symptoms alone.",
    fact: "A clinician may need your medical history, an examination or tests to assess the cause.",
  },
  {
    myth: "You have to share intimate details in an app to get health information.",
    fact: "Reading educational information does not require you to record or share personal sexual details in FEMORA.",
  },
  {
    myth: "One treatment works for every cause of pain.",
    fact: "Treatment depends on the cause. A health care professional can help discuss suitable options.",
  },
];

function calculateAge(dateOfBirth: string): number | null {
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  const now = new Date();

  if (
    !dateOfBirth ||
    Number.isNaN(birth.getTime()) ||
    birth > now
  ) {
    return null;
  }

  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() &&
      now.getDate() < birth.getDate());

  if (beforeBirthday) age -= 1;
  return age;
}

export default function SexualWellbeingPage() {
  const { activeProfile } = useAppContext();
  const navigate = useNavigate();

  const [expandedFaqs, setExpandedFaqs] = useState<number[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandedGlossary, setExpandedGlossary] = useState(false);

  const age = useMemo(() => {
    if (!activeProfile) return null;

    try {
      const raw = localStorage.getItem(
        `femora.intake.v1.${activeProfile.id}`,
      );

      if (!raw) return null;

      const intake = JSON.parse(raw) as IntakeRecord;
      if (!intake.dateOfBirth) return null;

      return calculateAge(intake.dateOfBirth);
    } catch {
      return null;
    }
  }, [activeProfile]);

  function toggleFaq(index: number) {
    setExpandedFaqs((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  }

  function toggleAllFaqs() {
    if (allExpanded) {
      setExpandedFaqs([]);
      setAllExpanded(false);
    } else {
      setExpandedFaqs(faqs.map((_, index) => index));
      setAllExpanded(true);
    }
  }

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile first</h1>
        <p>Create or select a profile before continuing.</p>
        <button
          className="button button-primary"
          type="button"
          onClick={() => navigate("/profiles")}
        >
          Go to profiles
        </button>
      </section>
    );
  }

  if (age === null || age < 18) {
    return (
      <main className="journey-page sexual-wellbeing-page">
        <div className="sexual-quick-exit">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => navigate("/")}
            aria-label="Quick exit to FEMORA home"
          >
            Quick Exit
          </button>
        </div>

        <PageHeader
          eyebrow="YOUR PRIVACY MATTERS"
          title="Sexual wellbeing"
          description="This section is optional and restricted to adults."
        />

        <section className="section-card">
          <h2>Adult-only content</h2>
          <p>
            This educational section is available only to users aged
            18 or older. Your date of birth is collected in intake,
            not on the profile-creation page.
          </p>
          {age === null && (
            <p>
              Your date of birth is missing or could not be verified
              from the saved intake answers. Complete or correct the
              intake date of birth to establish age eligibility.
            </p>
          )}
          {age !== null && age < 18 && (
            <p>
              This section is unavailable because the saved date of
              birth indicates that you are under 18.
            </p>
          )}
          <button
            type="button"
            className="button button-primary"
            onClick={() => navigate("/onboarding")}
          >
            Review intake answers
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="journey-page sexual-wellbeing-page">
      <div className="sexual-quick-exit">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => navigate("/")}
          aria-label="Quick exit to FEMORA home"
        >
          Quick Exit
        </button>
      </div>

      <PageHeader
        eyebrow="OPTIONAL ADULT EDUCATION"
        title="Sexual wellbeing"
        description="Explore educational information at your own pace. You do not need to record intimate details in FEMORA to read this page."
      />

      <section className="section-card sexual-intro">
        <h2>Frequently Asked Questions</h2>
        <div className="sexual-faq-toolbar">
          <p>Choose a question to read its answer.</p>
          <button
            type="button"
            className="text-button"
            onClick={toggleAllFaqs}
          >
            {allExpanded ? "Collapse All" : "Expand All"}
          </button>
        </div>

        <div className="sexual-faq-list">
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaqs.includes(index);
            const answerId = `sexual-faq-answer-${index}`;

            return (
              <article
                className={`sexual-faq-card${isExpanded ? " is-open" : ""}`}
                key={faq.question}
              >
                <button
                  className="sexual-faq-question"
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={answerId}
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>
                  <span aria-hidden="true">
                    {isExpanded ? "−" : "+"}
                  </span>
                </button>

                {isExpanded && (
                  <div
                    id={answerId}
                    className="sexual-faq-answer"
                  >
                    {faq.answer.split("\n\n").map((paragraph, pIndex) => (
                      <p key={`${index}-${pIndex}`}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="sexual-myth-section">
        <PageHeader
          eyebrow="LEARN AND REFLECT"
          title="Myth vs fact"
          description="Flip through these cards to explore common misconceptions."
        />

        <div className="sexual-myth-grid">
          {mythCards.map((card, index) => (
            <details className="sexual-myth-card" key={card.myth}>
              <summary>
                <span className="sexual-myth-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>Myth</strong>
                  <span>{card.myth}</span>
                </span>
                <span className="sexual-myth-toggle" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="sexual-myth-fact">
                <strong>Fact</strong>
                <p>{card.fact}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="section-card sexual-glossary">
        <button
          className="sexual-glossary-toggle"
          type="button"
          aria-expanded={expandedGlossary}
          onClick={() => setExpandedGlossary((value) => !value)}
        >
          <span>
            <span className="eyebrow">REFERENCE</span>
            <strong>Glossary</strong>
            <small>Definitions of the terms used in the FAQs.</small>
          </span>
          <span aria-hidden="true">
            {expandedGlossary ? "−" : "+"}
          </span>
        </button>

        {expandedGlossary && (
          <dl className="sexual-glossary-list">
            {glossary.map((item) => (
              <div key={item.term}>
                <dt>{item.term}</dt>
                <dd>{item.definition}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="section-card sexual-care-note">
        <h2>When to seek care</h2>
        <p>
          If you have frequent or severe pain, unusual bleeding,
          persistent irritation, or symptoms that concern you, contact
          a qualified health care professional. Seek urgent local
          medical help for severe or rapidly worsening symptoms.
        </p>
        <p>
          This page is educational and does not diagnose a condition
          or replace individual medical advice.
        </p>
      </section>

      <p className="sexual-source-note">
        
      </p>

      <div className="sexual-page-footer">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => navigate("/learn")}
        >
          Back to Learn
        </button>
      </div>
    </main>
  );
}
