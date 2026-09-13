"use client";

import { useEffect, useRef, useState } from "react";
import { DatePicker, PhoneNumber, VolumeControl } from "@/components/specimens/physical-specimens";
import { CheckboxGroup, ConfirmDialog, PasswordField } from "@/components/specimens/form-specimens";

const specimens = [
  { name: "Volume control", id: "volume-control", component: VolumeControl },
  { name: "Date picker", id: "date-picker", component: DatePicker },
  { name: "Password field", id: "password-field", component: PasswordField },
  { name: "Checkboxes", id: "checkboxes", component: CheckboxGroup },
  { name: "Phone number", id: "phone-number", component: PhoneNumber },
  { name: "Confirmation dialog", id: "confirmation-dialog", component: ConfirmDialog },
];

function ResetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 7.5a6.25 6.25 0 1 1-.1 4.5M4 3.5v4.25h4.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Collection() {
  const [versions, setVersions] = useState(() => specimens.map(() => 0));
  const [announcement, setAnnouncement] = useState({ text: "", sequence: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08 });
    gridRef.current?.querySelectorAll(".specimen").forEach((card) => {
      if (card.getBoundingClientRect().top > window.innerHeight) card.classList.add("reveal-ready");
      observer.observe(card);
    });
    return () => observer.disconnect();
  }, []);

  function resetSpecimen(index: number) {
    setVersions((current) => current.map((version, i) => i === index ? version + 1 : version));
    setAnnouncement((current) => ({ text: `${specimens[index].name} reset.`, sequence: current.sequence + 1 }));
  }

  function resetAll() {
    setVersions((current) => current.map((version) => version + 1));
    setAnnouncement((current) => ({ text: "All six specimens reset.", sequence: current.sequence + 1 }));
  }

  return (
    <section className="collection" id="collection" aria-labelledby="collection-title" tabIndex={-1}>
      <div className="collection-toolbar">
        <div className="collection-heading">
          <h2 id="collection-title">The collection</h2>
          <span className="collection-count">01 — 06</span>
        </div>
        <button className="reset-all" type="button" data-sidekick="reset" onClick={resetAll}><ResetIcon /> Reset all</button>
      </div>
      <div className="specimen-grid" ref={gridRef}>
        {specimens.map(({ name, id, component: Specimen }, index) => (
          <article className={`specimen specimen-${index + 1}`} id={id} key={id} aria-labelledby={`${id}-title`}>
            <div className="specimen-stage" role="group" aria-label={`${name} specimen`}>
              <Specimen key={versions[index]} />
            </div>
            <div className="specimen-caption">
              <span className="specimen-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h3 id={`${id}-title`}>{name}</h3>
              <button className="specimen-reset" type="button" data-sidekick="reset" onClick={() => resetSpecimen(index)} aria-label={`Reset ${name.toLowerCase()}`} title={`Reset ${name.toLowerCase()}`}><ResetIcon /></button>
            </div>
          </article>
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true"><span key={announcement.sequence}>{announcement.text}</span></p>
    </section>
  );
}
