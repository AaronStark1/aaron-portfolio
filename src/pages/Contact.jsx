import { Suspense, lazy, useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";
import Sheet from "../components/Sheet";
import { TitleLines, TitleLine, TitleText } from "../components/TitleLines";
import SendButton from "../components/contact/SendButton";
import { ARM_ROW, FEET } from "../components/contact/robotMetrics";
import { DUR, EASE, fadeChild, riseChild, riseParent, useFontsReady, useMediaQuery } from "../lib/motion";
import "../styles/doodles.css";
import "../styles/contact.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Field order, names, placeholders and `required` are kept from the original form. */
const FIELDS = [
  { name: "name", label: "Name", type: "text", placeholder: "Enter your name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", placeholder: "Enter your email", autoComplete: "email" },
  { name: "message", label: "Message", placeholder: "Type your message", multiline: true },
];

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Your name is required";
  if (!form.email.trim()) errors.email = "Your email is required";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address";
  if (!form.message.trim()) errors.message = "A message is required";
  return errors;
}

/* Choreography after mount (the sheet itself takes .6s; overlap is intended) */
const T = {
  line1: 0.15,
  line2: 0.27,
  statement: 0.55,
  fields: 0.6,
  button: 1.0,
  robot: 1.15,
  hello: 1.6,
};

/* The robot and the doodles are decoration only this page needs, so they
   load on their own once the page is up (the form never waits for them).
   If a chunk fails to load (a stale tab after a deploy, a flaky network) the
   page simply goes without it. */
const Nothing = () => null;
const optional = (load) => lazy(() => load().catch(() => ({ default: Nothing })));
const Robot = optional(() => import("../components/contact/Robot"));
const DoodleLayer = optional(() => import("../components/contact/ContactDoodles").then((m) => ({ default: m.DoodleLayer })));
const PlaneFlight = optional(() => import("../components/contact/ContactDoodles").then((m) => ({ default: m.PlaneFlight })));

const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const RATE_LIMIT_MS = 3000;

/* What the robot says when a field takes focus */
const PROMPTS = {
  name: "Who's saying hi?",
  email: "Where can I reply?",
  message: "What's on your mind?",
};

/**
 * Where the robot should be, in px from the top of the form. On wide
 * screens ("track") it floats beside the form with its arm level with the
 * active field; on narrow ones ("perch") it stands on the field's label row.
 */
function robotTarget(form, focus, layout) {
  const robot = form.querySelector(".robot");
  if (!robot) return null;
  const cell = parseFloat(getComputedStyle(robot).getPropertyValue("--cell")) || 6;
  const field = focus && focus !== "send" ? focus : layout === "track" ? "email" : "name";
  const el = focus === "send" ? form.querySelector(".send-card") : form.querySelector(`[data-field="${field}"] .field__input`);
  if (!el) return null;
  /* Ignore entrance offsets still in flight between the element and the
     form, so the robot heads for where the field will settle */
  let lift = 0;
  for (let n = el.parentElement; n && n !== form; n = n.parentElement) {
    const tf = getComputedStyle(n).transform;
    if (tf && tf !== "none") lift += new DOMMatrixReadOnly(tf).m42;
  }
  const top = form.getBoundingClientRect().top + lift;
  const r = el.getBoundingClientRect();
  if (layout === "track") return r.top - top + Math.min(r.height / 2, 30) - ARM_ROW * cell;
  if (focus === "send") return r.bottom - top - FEET * cell;
  /* feet a few px into the input's top padding, clear of the text */
  return r.top - top - FEET * cell + 4;
}

export default function Contact() {
  const ready = useFontsReady();
  const reduce = useReducedMotion();
  const md = useMediaQuery("(min-width: 768px)");
  const wide = useMediaQuery("(min-width: 1024px)");
  const layout = wide ? "track" : "perch";
  const formRef = useRef(null);
  const lastSubmitRef = useRef(0);

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  /* The robot's side of things: where the visitor is, what it says, how it looks */
  const [focus, setFocus] = useState(null);
  const [say, setSay] = useState(null);
  const [emote, setEmote] = useState(null);
  const [cue, setCue] = useState(null);
  const [beats, setBeats] = useState({ tick: 0, shake: 0, jump: 0, nudge: 0, celebrate: 0 });
  const timers = useRef({});
  const sayCount = useRef(0);
  const lastReaction = useRef(0);
  const greeted = useRef("");
  const robotRef = useRef(null);
  const placed = useRef(false);

  const errors = validate(form);
  const errorFor = (name) => ((touched[name] || attempted) && errors[name]) || null;

  /* ---- robot helpers (called from event handlers and timers only) ---- */

  const later = useCallback((key, ms, fn) => {
    window.clearTimeout(timers.current[key]);
    timers.current[key] = window.setTimeout(fn, ms);
  }, []);

  const speak = useCallback(
    (text, ms = 2600) => {
      sayCount.current += 1;
      setSay({ id: sayCount.current, text });
      window.clearTimeout(timers.current.say);
      if (ms) later("say", ms, () => setSay(null));
    },
    [later]
  );

  const flash = useCallback(
    (kind, ms = 1300) => {
      setEmote(kind);
      later("emote", ms, () => setEmote(null));
    },
    [later]
  );

  const pulse = (...keys) => setBeats((b) => keys.reduce((acc, k) => ({ ...acc, [k]: acc[k] + 1 }), b));

  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach((id) => window.clearTimeout(id));
  }, []);

  /* Hello: once the page has settled, the robot waves */
  useEffect(() => {
    if (!ready) return undefined;
    const t1 = window.setTimeout(() => {
      if (formRef.current?.contains(document.activeElement)) return;
      setCue("wave");
      speak("Hi there!", 2400);
    }, T.hello * 1000);
    const t2 = window.setTimeout(() => setCue(null), (T.hello + 1.7) * 1000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [ready, speak]);

  /* Keep the robot beside the active field, also when the layout shifts
     (fonts, error messages, resizing) */
  /* With nothing focused, it waits by the button while a message is on its way and after */
  const status = sending ? "sending" : sent ? "sent" : error ? "error" : "idle";
  const anchor = focus ?? (status !== "idle" ? "send" : null);

  const place = useCallback(
    (instant = false) => {
      const el = formRef.current;
      const robot = robotRef.current;
      if (!el || !robot) return;
      const target = robotTarget(el, anchor, layout);
      if (target != null) robot.place(target, instant || reduce);
    },
    [anchor, layout, reduce]
  );

  /* Placing on mount must not re-run when the target changes, or the robot
     would jump instead of gliding: keep a stable handle on the latest place() */
  const placeRef = useRef(place);
  useEffect(() => {
    placeRef.current = place;
  }, [place]);
  const placeNow = useCallback(() => placeRef.current(true), []);

  useEffect(() => {
    place(!placed.current);
    placed.current = true;
    const ro = new ResizeObserver(() => place(false));
    ro.observe(formRef.current);
    return () => ro.disconnect();
  }, [place]);

  /* ---- form handlers ---- */

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (sent) setSent(false);
    if (error) setError(null);
    pulse("tick");
  };

  const handleFocus = (e) => {
    const { name } = e.target;
    setFocus(name);
    if (Date.now() - lastReaction.current > 1600) speak(PROMPTS[name]);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((t) => (t[name] ? t : { ...t, [name]: true }));
    setFocus((f) => (f === name ? null : f));

    const v = value.trim();
    if (name === "name" && v) {
      const first = v.split(/\s+/)[0].slice(0, 14);
      if (first.toLowerCase() !== greeted.current) {
        greeted.current = first.toLowerCase();
        lastReaction.current = Date.now();
        speak(`Hi, ${first}!`);
        flash("happy");
      }
    } else if (name === "email" && v) {
      lastReaction.current = Date.now();
      if (EMAIL_RE.test(v)) {
        speak("Got it!", 1800);
        flash("happy", 1000);
      } else {
        speak("Hmm, check that email");
        flash("oops", 1500);
        pulse("shake");
      }
    } else if (name === "message" && v) {
      flash("happy", 1000);
    }
  };

  const handleSendFocus = () => {
    setFocus("send");
    if (!Object.keys(errors).length && !sending && Date.now() - lastReaction.current > 1200) speak("Ready when you are!");
  };

  const handleSendBlur = () => setFocus((f) => (f === "send" ? null : f));

  const handleSubmit = async (e) => {
    e.preventDefault();
    /* A new attempt always clears the last result */
    setSent(false);
    if (Object.keys(errors).length) {
      setAttempted(true);
      const first = FIELDS.find((f) => errors[f.name]);
      if (first) formRef.current?.elements[first.name]?.focus();
      lastReaction.current = Date.now();
      speak("Almost there!");
      flash("oops", 1400);
      pulse("shake", "nudge");
      return;
    }

    /* Client-side rate limit: reject rapid re-submissions */
    const now = Date.now();
    if (now - lastSubmitRef.current < RATE_LIMIT_MS) return;
    lastSubmitRef.current = now;

    setSending(true);
    setError(null);
    speak("Off it goes…", null);

    try {
      const payload = {
        access_key: import.meta.env.VITE_WEB3FORMS_KEY,
        subject: `New message from ${form.name.trim()} via portfolio`,
        from_name: form.name.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        /* Web3Forms honeypot: people never see the checkbox, so a tick means a bot */
        botcheck: formRef.current?.elements.botcheck?.checked ? true : "",
      };

      const res = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!formRef.current) return;

      if (data.success) {
        setSent(true);
        setForm({ name: "", email: "", message: "" });
        setTouched({});
        setAttempted(false);
        greeted.current = "";
        lastReaction.current = Date.now();
        speak("Delivered! Talk soon", 3400);
        flash("love", 3400);
        setCue("cheer");
        later("cue", 1900, () => setCue(null));
        pulse("jump", "celebrate");
      } else {
        setError(data.message || "Something went wrong. Please try again.");
        speak("Hmm, that didn't send", 3400);
        pulse("shake");
      }
    } catch {
      setError("Network error — please check your connection and try again.");
      speak("Hmm, that didn't send", 3400);
      pulse("shake");
    } finally {
      setSending(false);
    }
  };

  const child = reduce ? fadeChild : riseChild;

  /* The robot's state, derived */
  const look = sending
    ? "up-right"
    : anchor === "send"
      ? layout === "track"
        ? "right"
        : "left"
      : anchor
        ? layout === "track"
          ? "right"
          : "down-left"
        : "pointer";
  const pose = cue ?? (focus && layout === "track" && !sending ? "point" : "idle");
  const expression = emote ?? (error ? "sad" : "open");

  return (
    <Sheet
      invert
      className="min-h-[calc(100dvh-4rem)] pb-[clamp(4rem,14vh,10rem)] md:min-h-[calc(100dvh-5rem)]"
      aria-labelledby="contact-title"
    >
      {/* Headline: "Let's Connect" set as two display lines */}
      <header className="contact-region pt-[max(1.25rem,3.5vh)] md:pt-[max(1.5rem,4.5vh)]">
        <Suspense fallback={null}>
          <DoodleLayer region="header" on={ready} celebrate={beats.celebrate} />
          <PlaneFlight on={ready && wide} reduce={reduce} celebrate={beats.celebrate} />
        </Suspense>
        <h1 id="contact-title" className="sr-only">
          Let's Connect
        </h1>
        <div aria-hidden="true">
          <TitleLines font="sans" start={ready}>
            <TitleLine as="div" delay={T.line1} innerClassName="grid-15 items-end">
              <TitleText col="1 / span 8">Let's</TitleText>
            </TitleLine>
            <TitleLine as="div" delay={T.line2} className="pt-[0.12em]" innerClassName="grid-15 items-end">
              <TitleText col={md ? "9 / -1" : "1 / -1"} align="right">
                Connect
              </TitleText>
            </TitleLine>
          </TitleLines>
        </div>
      </header>

      {/* Statement + form */}
      <div className="contact-region grid-15 mt-[clamp(3rem,8vh,6rem)]">
        <Suspense fallback={null}>
          <DoodleLayer region="body" on={ready} celebrate={beats.celebrate} />
        </Suspense>
        <Motion.p
          className="col-span-full m-0 max-w-[8.5em] font-serif text-[length:var(--fs-statement)] font-normal leading-[1.2] tracking-[-0.01em] md:col-span-5 md:col-start-1"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={
            ready
              ? reduce
                ? { opacity: 1, transition: { duration: DUR.fade, delay: T.statement } }
                : { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: T.statement } }
              : reduce
              ? { opacity: 0 }
              : { opacity: 0, y: 24 }
          }
        >
          Let's collaborate or <em className="font-normal italic">say hi.</em>
        </Motion.p>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="relative col-span-full mt-12 md:col-span-9 md:col-start-7 md:mt-0"
          aria-label="Contact form"
        >
          {/* Honeypot — hidden from real users, catches bots */}
          <input
            type="checkbox"
            name="botcheck"
            className="hidden"
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

          <Suspense fallback={null}>
            <Robot
              ref={robotRef}
              layout={layout}
              start={ready}
              delay={T.robot}
              expression={expression}
              look={look}
              pose={pose}
              tick={beats.tick}
              shake={beats.shake}
              jump={beats.jump}
              say={say}
              sayAt={layout === "track" ? "above" : anchor === "send" ? "above-end" : "side"}
              busy={sending}
              reduce={reduce}
              onReady={placeNow}
            />
          </Suspense>

          <Motion.div
            className="grid gap-y-10"
            variants={riseParent(T.fields, 0.1)}
            initial="hidden"
            animate={ready ? "visible" : "hidden"}
            onAnimationComplete={() => place(false)}
          >
            {FIELDS.map((f) => (
              <Field
                key={f.name}
                field={f}
                value={form[f.name]}
                error={errorFor(f.name)}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                variants={child}
              />
            ))}
          </Motion.div>

          <SendButton
            label={sending ? "Sending…" : "Send message"}
            status={status}
            nudge={beats.nudge}
            className="mt-10 w-[15rem]"
            start={ready}
            delay={T.button}
            disabled={sending}
            onFocus={handleSendFocus}
            onBlur={handleSendBlur}
          />

          <p role="status" aria-live="polite" className="label mt-6 min-h-[1em]">
            <AnimatePresence mode="wait">
              {sent ? (
                <Motion.span
                  key="sent"
                  className="block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.5, ease: EASE } }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                >
                  Message sent — I'll get back to you soon!
                </Motion.span>
              ) : error ? (
                <Motion.span
                  key="error"
                  className="block text-fg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.5, ease: EASE } }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                >
                  {error}
                </Motion.span>
              ) : null}
            </AnimatePresence>
          </p>
        </form>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */

function Field({ field, value, error, onChange, onFocus, onBlur, variants }) {
  const id = useId();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const Input = field.multiline ? "textarea" : "input";

  return (
    <Motion.label className="field block" data-field={field.name} data-invalid={error ? "true" : undefined} variants={variants}>
      <span id={labelId} className="label mb-2 block">
        {field.label}
      </span>
      <span className="relative block">
        <Input
          className="field__input block"
          name={field.name}
          type={field.multiline ? undefined : field.type}
          rows={field.multiline ? 4 : undefined}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          required
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          aria-labelledby={labelId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <span className="field__bar" aria-hidden="true" />
      </span>
      {error ? (
        <span id={errorId} role="alert" className="label mt-2 block text-fg">
          {error}
        </span>
      ) : null}
    </Motion.label>
  );
}
