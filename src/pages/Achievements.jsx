import { useCallback, useMemo, useRef, useState } from "react";
import { motion as Motion, useInView, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import Sheet from "../components/Sheet";
import NavCard from "../components/NavCard";
import RevealLink from "../components/RevealLink";
import Lightbox from "../components/Lightbox";
import { TitleLines, TitleLine, TitleText } from "../components/TitleLines";
import { EASE, STAGGER, fadeChild, riseChild, riseParent, useFontsReady } from "../lib/motion";
import { CATEGORIES, credentials } from "../data/achievements";
import "../styles/achievements.css";

/* Editorial rhythm for the featured tiles: one lead split, then alternating halves. */
const TONES = ["cream", "ochre", "brick", "ink"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* "2026-02-14" | "2026-02" | "2026" -> "Feb 2026" | "2026"; null -> "Date pending" */
function formatIssued(iso) {
  if (!iso) return "Date pending";
  const [year, month] = iso.split("-");
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year;
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function meta(c) {
  return `${c.issuer} · ${formatIssued(c.issued)}${c.expires ? ` · Valid to ${formatIssued(c.expires)}` : ""}`;
}

export default function Achievements() {
  const ready = useFontsReady();
  const reduce = useReducedMotion();
  const child = reduce ? fadeChild : riseChild;

  // Newest first; the same order numbers both the featured tiles and the index.
  const all = useMemo(
    () => [...credentials].sort((a, b) => (b.issued ?? "").localeCompare(a.issued ?? "")),
    []
  );
  const featured = useMemo(() => all.filter((c) => c.featured).sort((a, b) => a.featured - b.featured), [all]);

  const stats = useMemo(() => {
    const first = Math.min(...all.filter((c) => c.issued).map((c) => Number(c.issued.slice(0, 4))));
    return [
      { value: all.length, label: all.length === 1 ? "Credential" : "Credentials" },
      { value: new Set(all.map((c) => c.issuer)).size, label: "Issuers" },
      { value: new Set(all.map((c) => c.category)).size, label: "Fields" },
      { value: first, label: "Since" },
    ];
  }, [all]);

  /* Two galleries, each stepping only through its own kind of artwork */
  const galleries = useMemo(
    () => ({
      badge: all.map((c) => ({ id: c.id, src: c.image, alt: `${c.title} badge`, title: c.title, meta: meta(c), verify: c.verify })),
      certificate: all
        .filter((c) => c.certificate)
        .map((c) => ({ id: c.id, src: c.certificate, alt: `${c.title} certificate`, title: c.title, meta: meta(c), verify: c.verify, pdf: c.certificatePdf })),
    }),
    [all]
  );
  const [view, setView] = useState(null); // { kind, index } | null
  const open = useCallback(
    (kind, id) => {
      const index = galleries[kind].findIndex((i) => i.id === id);
      if (index >= 0) setView({ kind, index });
    },
    [galleries]
  );
  const close = useCallback(() => setView(null), []);
  const navigate = useCallback((index) => setView((v) => (v ? { ...v, index } : v)), []);

  const statement = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, delay: 0.45 } } }
    : { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: 0.45 } } };

  return (
    <Sheet className="pb-[clamp(4rem,14vh,10rem)]" aria-labelledby="achievements-title">
      {/* Headline: "Proof of" left, "Progress" right, each line carrying its own hairline */}
      <header className="pt-[max(1.25rem,3.5vh)] md:pt-[max(1.5rem,4.5vh)]">
        <h1 id="achievements-title" className="sr-only">
          Achievements: proof of progress
        </h1>
        <div aria-hidden="true">
          <TitleLines font="sans" start={ready}>
            <TitleLine as="div" delay={0.15} innerClassName="grid-15 items-end">
              <TitleText col="1 / span 9">Proof of</TitleText>
            </TitleLine>
            <TitleLine as="div" delay={0.27} innerClassName="grid-15 items-end pt-[0.12em]" descenders>
              <TitleText col="7 / -1" align="right">
                Progress
              </TitleText>
            </TitleLine>
          </TitleLines>
        </div>
      </header>

      {/* Statement left, the numbers right; stacked on small screens */}
      <div className="grid-15 mt-[clamp(3rem,8vh,6rem)] gap-y-10 md:gap-y-0">
        <Motion.p
          className="col-span-full m-0 font-serif text-[length:var(--fs-statement)] font-normal leading-[1.2] tracking-[-0.01em] md:col-span-5"
          variants={statement}
          initial="hidden"
          animate={ready ? "visible" : "hidden"}
        >
          Certifications and badges earned along the way. Every one links back to its issuer, so nothing here has to be
          taken <em>on trust</em>.
        </Motion.p>

        <Motion.dl
          className="col-span-full m-0 grid grid-cols-2 gap-x-6 gap-y-8 md:col-span-8 md:col-start-8 md:grid-cols-4"
          variants={riseParent(0.6, STAGGER.card)}
          initial="hidden"
          animate={ready ? "visible" : "hidden"}
          aria-label="Achievement statistics"
        >
          {stats.map((s) => (
            <Motion.div key={s.label} className="flex flex-col-reverse border-t border-rule pt-3" variants={child}>
              <dt className="label mt-2 text-fg-muted">{s.label}</dt>
              <dd className="display-sans m-0 text-[clamp(2.5rem,4.6vw,4.25rem)] leading-[0.95] tabular-nums">{s.value}</dd>
            </Motion.div>
          ))}
        </Motion.dl>
      </div>

      {featured.length > 0 && (
        <section aria-labelledby="featured-heading" className="mt-[clamp(4rem,12vh,8rem)]">
          <SectionTitle id="featured-heading" delay={0}>
            Featured
          </SectionTitle>
          <ol className="grid-15 mt-[clamp(2.5rem,6vh,4rem)] items-start gap-y-[clamp(3rem,8vh,6rem)]">
            {featured.map((credential, i) => (
              <FeaturedItem
                key={credential.id}
                credential={credential}
                number={pad(all.indexOf(credential) + 1)}
                tone={TONES[i % TONES.length]}
                kind={i === 0 ? "lead" : i % 2 ? "half-left" : "half-right"}
                index={i}
                onOpen={open}
              />
            ))}
          </ol>
        </section>
      )}

      <Archive all={all} onOpen={open} />

      <Closing />

      <Lightbox
        open={view !== null}
        items={view ? galleries[view.kind] : []}
        index={view ? view.index : 0}
        kind={view ? view.kind : "badge"}
        onClose={close}
        onNavigate={navigate}
      />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */

/* Section heading set at the small display size, drawn when it scrolls into view */
function SectionTitle({ id, children, delay = 0, align = "left" }) {
  return (
    <>
      <h2 id={id} className="sr-only">
        {children}
      </h2>
      <div aria-hidden="true">
        <TitleLines font="sans" style={{ fontSize: "var(--fs-display-sm)" }}>
          <TitleLine as="div" inView delay={delay} innerClassName="grid-15 items-end">
            <TitleText col="1 / -1" align={align}>
              {children}
            </TitleText>
          </TitleLine>
        </TitleLines>
      </div>
    </>
  );
}

/* Official badge artwork, or the seal when the image is missing or fails to load */
function Badge({ credential, className = "" }) {
  const [broken, setBroken] = useState(false);
  if (!credential.image || broken) {
    return (
      <span className={`cred-seal ${className}`} aria-hidden="true">
        <span>{initials(credential.issuer)}</span>
      </span>
    );
  }
  return (
    <img
      src={credential.image}
      alt=""
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

/* Text button in the label register, sharing the link-reveal hover with the links beside it */
function ActionButton({ children, onClick, ariaLabel }) {
  return (
    <button type="button" className="link-reveal label cursor-pointer" data-text={children} onClick={onClick} aria-label={ariaLabel}>
      <span>{children}</span>
    </button>
  );
}

/* Badge · Certificate · (links), used by both the featured captions and the index rows */
function Actions({ credential, onOpen, className = "", children }) {
  return (
    <ul className={`cred-actions label m-0 flex list-none flex-wrap items-center gap-x-6 gap-y-3 p-0 ${className}`} aria-label={`${credential.title} actions`}>
      <li>
        <ActionButton onClick={() => onOpen("badge", credential.id)} ariaLabel={`View badge, ${credential.title}`}>
          Badge
        </ActionButton>
      </li>
      {credential.certificate && (
        <li>
          <ActionButton onClick={() => onOpen("certificate", credential.id)} ariaLabel={`View certificate, ${credential.title}`}>
            Certificate
          </ActionButton>
        </li>
      )}
      {children}
    </ul>
  );
}

const tileRise = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};
const tileFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const ITEM_CLASS = {
  lead: "col-span-full grid-15",
  "half-left": "col-span-full md:col-start-1 md:col-span-7",
  "half-right": "col-span-full md:col-start-9 md:col-span-7",
};

function FeaturedItem({ credential, number, tone, kind, index, onOpen }) {
  const reduce = useReducedMotion();
  const child = reduce ? fadeChild : riseChild;
  const parent = { hidden: {}, visible: { transition: { delayChildren: index === 0 ? 0.2 : 0, staggerChildren: 0.12 } } };
  const platform = credential.platforms[0]?.name ?? credential.issuer;
  const Tile = credential.verify ? Motion.a : Motion.div;
  const tileLink = credential.verify
    ? { href: credential.verify, target: "_blank", rel: "noopener noreferrer", "aria-label": `${credential.title}, verify on ${platform}` }
    : {};

  const tile = (
    <Tile
      {...tileLink}
      className={`cred-tile tone-${tone} ${kind === "lead" ? "col-span-full md:col-start-1 md:col-span-9" : "w-full"}`}
      variants={reduce ? tileFade : tileRise}
    >
      <span
        className="absolute left-3 top-3 text-[length:var(--fs-ui)] font-medium leading-none tabular-nums tracking-[-0.02em] md:left-4 md:top-4"
        aria-hidden="true"
      >
        {number}
      </span>
      <span className="label absolute right-3 top-3.5 md:right-4 md:top-4" aria-hidden="true">
        {credential.issuer}
      </span>
      <Badge credential={credential} className="cred-tile__badge" />
      {credential.verify && (
        <span className="cred-tile__cta label" aria-hidden="true">
          Verify
          <ArrowUpRight size={14} weight="regular" />
        </span>
      )}
    </Tile>
  );

  const caption = (
    <>
      <Motion.h3
        variants={child}
        className="m-0 text-[length:var(--fs-title)] font-normal leading-[1.05] tracking-[-0.02em]"
      >
        {credential.title}
      </Motion.h3>
      <Motion.p variants={child} className="label mt-3 text-fg-muted">
        {meta(credential)}
      </Motion.p>
      {credential.description && (
        <Motion.p variants={child} className="mt-3 max-w-[38ch] text-[length:var(--fs-body)] leading-[1.35]">
          {credential.description}
        </Motion.p>
      )}
      <Motion.div variants={child}>
        <Actions credential={credential} onOpen={onOpen} className="mt-5">
          {credential.platforms.map((p) => (
            <li key={p.url} className="inline-flex items-center gap-1">
              <RevealLink href={p.url}>{p.name}</RevealLink>
              <ArrowUpRight size={14} weight="regular" aria-hidden="true" />
            </li>
          ))}
        </Actions>
      </Motion.div>
    </>
  );

  return (
    <Motion.li
      className={ITEM_CLASS[kind]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={parent}
    >
      {kind === "lead" ? (
        <>
          {tile}
          <div className="col-span-full mt-5 md:col-start-11 md:col-span-5 md:mt-0 md:self-end">{caption}</div>
        </>
      ) : (
        <>
          {tile}
          <div className="mt-5 md:mt-6">{caption}</div>
        </>
      )}
    </Motion.li>
  );
}

/* ------------------------------------------------------------------ */

/* Every credential as an index: filters appear only once there are enough to need them */
function Archive({ all, onOpen }) {
  const reduce = useReducedMotion();
  const child = reduce ? fadeChild : riseChild;
  const [filter, setFilter] = useState("all");

  const fields = useMemo(() => Object.keys(CATEGORIES).filter((k) => all.some((c) => c.category === k)), [all]);
  const showFilters = all.length >= 6 && fields.length >= 3;
  const rows = filter === "all" ? all : all.filter((c) => c.category === filter);

  return (
    <section aria-labelledby="index-heading" className="mt-[clamp(4rem,12vh,8rem)]">
      <SectionTitle id="index-heading">Index</SectionTitle>

      {showFilters && (
        <div className="label mt-6 flex flex-wrap gap-x-6 gap-y-2" role="group" aria-label="Filter by field">
          {[["all", "All"], ...fields.map((k) => [k, CATEGORIES[k]])].map(([key, text]) => (
            <button
              key={key}
              type="button"
              className="cred-filter label"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {text}
              <span className="ml-1.5 tabular-nums text-fg-muted">
                {key === "all" ? all.length : all.filter((c) => c.category === key).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {showFilters && (
        <p className="sr-only" aria-live="polite">
          {rows.length} of {all.length} credentials shown
        </p>
      )}

      <Motion.ol
        key={filter}
        className="cred-index m-0 mt-6 list-none border-t border-rule p-0 md:mt-8"
        variants={riseParent(0.05, STAGGER.item)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
      >
        {rows.map((c) => (
          <Motion.li key={c.id} className="cred-row" variants={child}>
            <span className="cred-row__num label pt-1 tabular-nums text-fg-muted md:pt-0" aria-hidden="true">
              {pad(all.indexOf(c) + 1)}
            </span>
            <Badge credential={c} className="cred-row__thumb" />
            <div className="cred-row__main">
              <h3 className="cred-row__title m-0 text-[length:var(--fs-body)] font-medium leading-[1.25] tracking-[-0.01em]">{c.title}</h3>
              <p className="label mt-1.5 text-fg-muted">{c.issuer}</p>
            </div>
            <div className="cred-row__meta label">
              <span className="cred-row__date tabular-nums">{formatIssued(c.issued)}</span>
              <span className="cred-row__field text-fg-muted">{CATEGORIES[c.category]}</span>
              <Actions credential={c} onOpen={onOpen} className="cred-row__actions">
                {c.verify && (
                  <li>
                    <RevealLink href={c.verify} aria-label={`Verify ${c.title}`}>
                      Verify
                    </RevealLink>
                    <ArrowUpRight size={14} weight="regular" aria-hidden="true" />
                  </li>
                )}
              </Actions>
            </div>
          </Motion.li>
        ))}
      </Motion.ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/* Closing: a statement and the two onward tiles, in the Home tones */
function Closing() {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();
  const child = reduce ? fadeChild : riseChild;

  return (
    <section ref={ref} aria-labelledby="next-heading" className="mt-[clamp(4rem,12vh,8rem)]">
      <SectionTitle id="next-heading" align="right">
        Where next
      </SectionTitle>
      <div className="grid-15 mt-[clamp(2rem,5vh,3rem)] items-end gap-y-8">
        <Motion.p
          className="col-span-full m-0 max-w-[34ch] font-serif text-[length:var(--fs-statement)] font-normal leading-[1.2] tracking-[-0.01em] md:col-span-7"
          variants={child}
          initial="hidden"
          animate={seen ? "visible" : "hidden"}
        >
          The credentials are the paperwork. The projects are where it <em>gets used</em>.
        </Motion.p>
        <nav aria-label="Onward" className="col-span-full grid grid-cols-2 gap-2 md:col-span-6 md:col-start-10">
          <NavCard
            to="/projects"
            label="Projects"
            number="02"
            tone="brick"
            description="Explore selected work & experiments."
            start={seen}
            delay={0.1}
            height="clamp(5.5rem, 7.2vw, 6.5rem)"
          />
          <NavCard
            to="/contact"
            label="Contact"
            number="03"
            tone="ochre"
            description="Let's collaborate or say hi."
            start={seen}
            delay={0.2}
            height="clamp(5.5rem, 7.2vw, 6.5rem)"
          />
        </nav>
      </div>
    </section>
  );
}
