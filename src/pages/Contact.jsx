import { useId, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";
import Sheet from "../components/Sheet";
import NavCard from "../components/NavCard";
import { TitleLines, TitleLine, TitleText } from "../components/TitleLines";
import { DUR, EASE, fadeChild, riseChild, riseParent, useFontsReady, useMediaQuery } from "../lib/motion";

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
};

const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const RATE_LIMIT_MS = 3000;

export default function Contact() {
  const ready = useFontsReady();
  const reduce = useReducedMotion();
  const md = useMediaQuery("(min-width: 768px)");
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

  const errors = validate(form);
  const errorFor = (name) => ((touched[name] || attempted) && errors[name]) || null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (sent) setSent(false);
    if (error) setError(null);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((t) => (t[name] ? t : { ...t, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length) {
      setAttempted(true);
      const first = FIELDS.find((f) => errors[f.name]);
      if (first) formRef.current?.elements[first.name]?.focus();
      return;
    }

    /* Client-side rate limit: reject rapid re-submissions */
    const now = Date.now();
    if (now - lastSubmitRef.current < RATE_LIMIT_MS) return;
    lastSubmitRef.current = now;

    setSending(true);
    setError(null);

    try {
      const payload = {
        access_key: import.meta.env.VITE_WEB3FORMS_KEY,
        subject: `New message from ${form.name.trim()} via portfolio`,
        from_name: form.name.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        /* Web3Forms bot-check honeypot — bots that fill this get rejected */
        botcheck: "",
      };

      const res = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSent(true);
        setForm({ name: "", email: "", message: "" });
        setTouched({});
        setAttempted(false);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const child = reduce ? fadeChild : riseChild;

  return (
    <Sheet
      invert
      className="min-h-[calc(100dvh-4rem)] pb-[clamp(4rem,14vh,10rem)] md:min-h-[calc(100dvh-5rem)]"
      aria-labelledby="contact-title"
    >
      {/* Headline: "Let's Connect" set as two display lines */}
      <header className="pt-[max(1.25rem,3.5vh)] md:pt-[max(1.5rem,4.5vh)]">
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
      <div className="grid-15 mt-[clamp(3rem,8vh,6rem)]">
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
          className="col-span-full mt-12 md:col-span-9 md:col-start-7 md:mt-0"
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

          <Motion.div
            className="grid gap-y-10"
            variants={riseParent(T.fields, 0.1)}
            initial="hidden"
            animate={ready ? "visible" : "hidden"}
          >
            {FIELDS.map((f) => (
              <Field
                key={f.name}
                field={f}
                value={form[f.name]}
                error={errorFor(f.name)}
                onChange={handleChange}
                onBlur={handleBlur}
                variants={child}
              />
            ))}
          </Motion.div>

          <NavCard
            type="submit"
            label={sending ? "Sending…" : "Send message"}
            number=""
            tone="brick"
            className="mt-10 w-[15rem]"
            height="6.5rem"
            start={ready}
            delay={T.button}
            disabled={sending}
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

function Field({ field, value, error, onChange, onBlur, variants }) {
  const id = useId();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const Input = field.multiline ? "textarea" : "input";

  return (
    <Motion.label className="field block" data-invalid={error ? "true" : undefined} variants={variants}>
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
