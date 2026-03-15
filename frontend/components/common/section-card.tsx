import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className="aurora-panel glass-card hover-lift rounded-2xl p-5">
      <div className="content-layer">
        <h2 className="text-lg font-semibold text-gh-heading">{title}</h2>
      </div>
      <div className="mt-4 text-gh-text">{children}</div>
    </section>
  );
}
