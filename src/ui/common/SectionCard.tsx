import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  description,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section className={`section-card ${className}`.trim()}>
      <div className="section-card-heading">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}