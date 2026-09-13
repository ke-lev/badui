# Product

<!-- impeccable:product-schema 1 -->

> **Confirmed 2026-09-13 — do not reopen without being asked to.** The project
> pivoted from a fixed set of six hostile specimens to an open component
> library. These are settled decisions, not gaps awaiting an interview:
> the open-ended scale; component documentation as required entry content;
> "Explain the component, never the joke"; "Each entry ships finished"; and a
> Voice commitment that permits documentation while still forbidding
> commentary. `AGENTS.md` holds the same rules and is the newer authority.
> A regeneration of this file must preserve all of them.

## Platform

web

## Users

The author is the primary user: this is a personal project, built for its own sake rather than to serve an external audience.

A secondary evaluative audience is confirmed — hiring reviewers and prospective clients, who encounter it as a portfolio piece. They arrive with a link, skim, and judge execution quality. They are not users of the collection; they are assessors of the craft behind it.

No general-public or student audience is a target. Reach is not a goal.

## Product Purpose

A library of interface components: some deliberately awful, some genuinely good, presented together as one collection. Each entry is a live, working artifact the visitor can operate — whether that means using it or suffering through it.

Success is execution quality, not reach: the project is finished when it stands as proof of craft that the author would put in front of an employer or client.

## Positioning

The components are working, not screenshots. A visitor can actually try to pick the date, set the volume, dismiss the modal — and fail. A gallery of captured images could not deliver the felt experience of a hostile control; that operability is the mechanism. The sound components are held to the same bar, and earn their place by being genuinely worth using.

Presentation is deadpan. Entries are documented — what a component is, how it behaves, how to use it — but the collection never explains the joke, which distinguishes it from the explanatory "dark patterns" literature. Hostile and sound entries are described in the same straight register, with no nudge and no commentary.

## Operating Context

Reviewers reach the project by link and evaluate it in a single sitting. Browsing device is not confirmed.

## Capabilities and Constraints

- **Scale:** an open library that grows over time. Each entry is still hand-composed and bespoke rather than fitted to a content shell, and the index is built from the components' own metadata, so no CMS or content pipeline is required.
- **Entry content:** the component, its name, and its documentation — what it is, how it behaves, and how to use it. Documentation is written in the same change as the component it describes. Commentary, verdict, teardown, and corrected versions remain out of scope: describe the mechanism, never the joke.
- **Component origin:** all components are original work authored in this project. No real company, product, or brand is named, depicted, or attributed. No screenshots or recordings of shipped third-party interfaces.
- **Stack:** existing codebase — Next.js 16 (App Router, `src/`), React 19, TypeScript, Tailwind CSS v4, ESLint, Turbopack. Verified building.
- **Undecided:** deployment target and whether the project is published at a public URL; the roster of components, which is open by design.

## Brand Commitments

- **Name:** `badui`. Confirmed as the product concept, not a working title.
- **Voice:** deadpan. Describe the component — what it is, how it behaves, how to use it — and stop there. Never apologize for it, wink at the visitor, name the anti-pattern, or coach anyone past a hostile control. Documentation states the mechanism; copy that justifies, editorialises, or teaches the joke violates a confirmed decision.

## Evidence on Hand

None. There is no real-world capture, attribution, testimonial, case study, usage data, or press.

Future work must not fabricate any of it: no invented company names on components, no "as seen in" attributions, no fictional user quotes, no usage or traffic claims. The components are the only evidence this project has, and they are self-produced.

## Product Principles

1. **Operable, not depicted.** An entry earns its place only if the visitor can interact with it firsthand. If it works as a screenshot, it is not an entry.
2. **Explain the component, never the joke.** Documentation says what a component is and how it behaves; that is required. Editorialising, winking, naming the anti-pattern, or coaching the visitor past a hostile control is a confirmed exclusion, not a gap waiting to be filled.
3. **Hostile by design, never by defect.** The failure must read as authored intent. Sloppiness that could be mistaken for an accident undermines the entire premise.
4. **Each entry ships finished.** The library grows, but nothing lands half-built: a component arrives documented, operable, and complete, or it does not arrive.
5. **The craft is the deliverable.** The audience judges execution. Everything that frames the collection is held to portfolio standard.

## Accessibility & Inclusion

A confirmed boundary separates the frame from the artifact:

- **The frame meets WCAG 2.2 AA.** Navigation, index, headings, landmarks, focus order, and contrast on all chrome surrounding the components are held to standard.
- **Hostile components are exempt.** Inside such an entry, hostile interaction is the artifact. The exemption covers interaction design only: roles, names, and states stay correct, because the library index is built from them.

The distinction must be legible to a reviewer: the frame's rigor is what proves the hostility is authored rather than incompetent.
