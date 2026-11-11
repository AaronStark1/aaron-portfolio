#!/usr/bin/env node
/**
 * Credential helper for the add-achievement skill. Zero dependencies (Node 18+).
 *
 *   node .agents/skills/add-achievement/scripts/credential.mjs inspect <url>
 *   node .agents/skills/add-achievement/scripts/credential.mjs inspect <url> --download <slug>
 *   node .agents/skills/add-achievement/scripts/credential.mjs scan
 *
 * inspect  Reads a public credential link and prints a draft entry for
 *          src/data/achievements.js plus notes on anything it could not get.
 *          --download also saves the badge artwork (and the certificate where
 *          the platform hands it out publicly) under public/achievements/.
 * scan     Lists Credly badges on the owner's public profile that are not on
 *          the site yet (minus excluded.json), and listed credentials that
 *          have expired or expire within 90 days.
 *
 * Every request is anonymous: it only sees what the public sees.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../../..");
const DATA = join(ROOT, "src/data/achievements.js");
const CREDLY_USER = "aaron-correya";
const UA = "Mozilla/5.0 (portfolio credential helper)";
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/* ------------------------------------------------------------------ http */

async function get(url, { accept = "*/*", redirect = "follow" } = {}) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept }, redirect });
  return res;
}
async function getJson(url, accept = "application/json") {
  const res = await get(url, { accept });
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return res.json();
}
async function getText(url) {
  const res = await get(url, { accept: "text/html,*/*" });
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return { text: await res.text(), url: res.url, type: res.headers.get("content-type") || "" };
}

/* --------------------------------------------------------------- helpers */

const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

/** Visible text of an HTML page, one trimmed line per text node. */
function lines(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "")
    .split(/<[^>]+>/)
    .map((l) => decode(l).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
/** The line after the first line matching `label`. */
function after(ls, label) {
  const i = ls.findIndex((l) => label.test(l));
  return i >= 0 ? ls[i + 1] ?? null : null;
}
function meta(html, prop) {
  const m =
    html.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`, "i")) ||
    html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${prop}"`, "i"));
  return m ? decode(m[1]) : null;
}
const plain = (html) => (html ? decode(html.replace(/<br\s*\/?>|<\/p>|<\/li>/gi, " ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim() : null);

/** "May 27, 2026", "Nov. 27, 2026", "23 April 2025", "2025-06-21T..." -> "YYYY-MM-DD" */
function isoDate(s) {
  if (!s) return null;
  // Timestamps become the calendar date in this machine's time zone (the
  // owner's, IST), the date their certificate shows: Microsoft stamps DP-900
  // 2026-06-17T19:48:59Z and the certificate reads 18 June.
  if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return new Date(s).toLocaleDateString("en-CA");
  const iso = String(s).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const t = String(s).toLowerCase().replace(/\./g, "");
  const mon = MONTHS.findIndex((m) => new RegExp(`\\b${m}`).test(t));
  const year = t.match(/\b(19|20)\d{2}\b/);
  const day = t.replace(/\b(19|20)\d{2}\b/, "").match(/\b(\d{1,2})\b/);
  if (mon < 0 || !year || !day) return null;
  return `${year[0]}-${String(mon + 1).padStart(2, "0")}-${day[1].padStart(2, "0")}`;
}

const slug = (s) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Open Badges issuers come embedded or as a link; the embedded copy may lack a name. */
async function issuerOf(ref) {
  if (ref && typeof ref === "object" && ref.name) return ref;
  const url = typeof ref === "string" ? ref : ref?.id;
  return url ? getJson(url, "application/ld+json, application/json").catch(() => ({})) : {};
}

/** First guess at a CATEGORIES key; the agent confirms it. */
function guessCategory(text) {
  const t = text.toLowerCase();
  const rules = [
    ["security", /secur|cyber|threat|identity|zero trust/],
    ["observability", /observab|monitor|new relic|telemetry|apm/],
    ["ai", /\bai\b|artificial|machine learning|\bml\b|generative|llm|claude|agent|prompt|vector/],
    ["data", /data|database|sql|mongo|analytics|warehouse|lakehouse/],
    ["cloud", /cloud|azure|aws|gcp|kubernetes|devops/],
    ["opensource", /open source|hacktoberfest|contributor/],
  ];
  return rules.find(([, re]) => re.test(t))?.[0];
}

/* ------------------------------------------------------------- platforms */

/** Each reader returns a partial entry plus `badgeUrl`, `certUrl` (certificate
    image), `pdfUrl` (certificate PDF) and `notes`. */
const READERS = [
  {
    name: "Credly",
    match: (u) => /(^|\.)credly\.com$/.test(u.hostname) && UUID.test(u.pathname),
    async read(u) {
      const id = u.pathname.match(UUID)[0];
      const a = await getJson(`https://api.credly.com/v1/obi/v2/badge_assertions/${id}`);
      const b = await getJson(a.badge);
      const issuer = await issuerOf(b.issuer);
      const verify = `https://www.credly.com/badges/${id}/public_url`;
      return {
        title: b.name,
        issuer: issuer.name,
        issued: isoDate(a.issuedOn),
        expires: isoDate(a.expires),
        description: plain(b.description),
        verify,
        embed: `https://www.credly.com/embedded_badge/${id}`,
        platforms: [{ name: "Credly", url: verify }],
        badgeUrl: b.image?.id ?? b.image,
        certUrl: null,
        notes: ["Credly's certificate PDF is owner-only: ask the owner to download it from the badge page (Share > Download) if they want a Certificate button."],
      };
    },
  },
  {
    name: "Microsoft Learn",
    match: (u) => u.hostname === "learn.microsoft.com" && /credentials/.test(u.pathname),
    async read(u) {
      // Share links look like /api/credentials/share/<locale>/<user>/<credentialId>?sharingId=...,
      // profile links like /<locale>/users/<user>/credentials/<credentialId>.
      const id = u.pathname.split("/").filter(Boolean).pop();
      const c = await getJson(`https://learn.microsoft.com/api/credentials/${id}?locale=en-gb`);
      return {
        title: c.title,
        issuer: "Microsoft",
        issued: isoDate(c.awardedOn),
        expires: isoDate(c.expiresOn ?? c.expiration ?? null),
        description: c.skills?.length ? `Skills measured: ${c.skills.map((k) => k.charAt(0).toLowerCase() + k.slice(1)).join(", ")}.` : plain(c.description),
        verify: u.href,
        embed: null,
        platforms: [{ name: "Microsoft Learn", url: u.href }],
        badgeUrl: c.iconUrl ? new URL(c.iconUrl, "https://learn.microsoft.com").href : null,
        certUrl: null,
        notes: [
          `Status ${c.credentialStatus}, certification number ${c.certificationNumber ?? "n/a"}.`,
          "Microsoft has no public certificate file: capture the certificate card from the verify page in a headless browser (see references/platforms.md).",
        ],
      };
    },
  },
  {
    name: "Skilljar",
    match: (u) => u.hostname === "verify.skilljar.com",
    async read(u) {
      const { text } = await getText(u.href);
      const ls = lines(text);
      const title = (meta(text, "og:title") || "").replace(/^Certificate for\s+/i, "");
      // The school's name is the header brand ("Anthropic Academy"); the
      // "Issued By" value is the legal-ish issuer ("Anthropic Education").
      const academy = ls.find((l) => /academy|university|school|institute/i.test(l)) || "Skilljar";
      const issuedBy = after(ls, /^Issued by$/i);
      const issuer = academy !== "Skilljar" ? academy.replace(/\s+(Academy|Education)$/i, "") : issuedBy || "TODO";
      const pdf = text.match(/href="([^"]+)"[^>]*title="Download certificate PDF"/i)?.[1];
      return {
        title,
        issuer,
        issued: isoDate(after(ls, /^Completion Date$/i)),
        expires: isoDate(after(ls, /^Certificate Expires$/i)),
        description: null,
        verify: u.href,
        embed: null,
        platforms: [{ name: academy, url: u.href }],
        badgeUrl: null,
        certUrl: meta(text, "og:image"),
        pdfUrl: pdf ? decode(pdf) : null,
        notes: [
          "Skilljar issues a certificate, not a badge: the page needs badge artwork. Use the issuer's official mark supplied by the owner (never draw one).",
          "The certificate image and PDF links are signed and expire, so download them now (--download), never hotlink them.",
          "No description on the page: write one sentence from the course's public catalogue page.",
        ],
      };
    },
  },
  {
    name: "Oracle CertView",
    match: (u) => /oracle\.com$/.test(u.hostname) && /certview/i.test(u.pathname),
    async read(u) {
      const { text } = await getText(u.href);
      const ls = lines(text);
      const title = (text.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
      const skillsAt = ls.findIndex((l) => /^Skills$/i.test(l));
      return {
        title: decode(title),
        issuer: after(ls, /^Issued by$/i) || "Oracle",
        issued: isoDate(after(ls, /^Issued on$/i)),
        expires: isoDate(after(ls, /^Valid until$|^Expires/i)),
        description: skillsAt >= 0 ? ls[skillsAt + 1] : null,
        verify: u.href,
        embed: null,
        platforms: [{ name: "Oracle CertView", url: u.href }],
        badgeUrl: meta(text, "og:image"),
        certUrl: null,
        notes: ["Oracle's eCertificate PDF is owner-only (CertView > Print eCertificate): ask the owner for it."],
      };
    },
  },
];

/** Accredible powers many branded hosts (credentials.newrelic.com, credentials.databricks.com, credential.net). */
async function readAccredible(u) {
  const id = u.pathname.match(UUID)?.[0] || u.pathname.match(/\/(\d{5,})\b/)?.[1];
  if (!id) return null;
  const res = await get(`https://api.accredible.com/v1/credential-net/credentials/${id}`, { accept: "application/json" });
  if (!res.ok) return null;
  const c = (await res.json()).data;
  if (!c?.name) return null;
  const svg = c.group?.badge_design?.svg || "";
  const art = svg.match(/href="(https?:\/\/[^"]+\.png)"/)?.[1];
  const badgeUrl = art ? `https://templates.images.credential.net/${art.split("/").pop()}` : c.badge_image;
  const canPdf = c.issuer?.recipient_functions?.download_pdf === "public";
  const verify = c.url || u.href;
  return {
    platform: "Accredible",
    title: c.name,
    issuer: c.issuer?.name,
    issued: isoDate(c.issued_on),
    expires: isoDate(c.expired_on),
    description: plain(c.description || c.group?.course_description),
    verify,
    embed: null,
    platforms: [{ name: c.issuer?.name || "Accredible", url: verify }],
    badgeUrl,
    badgeFallback: c.badge_image,
    certUrl: null,
    pdfUrl: canPdf ? `https://api.accredible.com/v1/credential/generate_certificate_pdf?credential_id=${c.id}&mode=pdf` : null,
    notes: [
      canPdf ? "Certificate PDF is public: render it to an image (see SKILL.md step 4)." : "Issuer keeps the certificate PDF private: ask the owner for it.",
      c.user?.profile ? `Owner's Accredible wallet: ${c.user.profile}/wallet (can go in platforms if the owner wants it).` : null,
    ].filter(Boolean),
  };
}

/** Any Open Badges 2.0 hosted assertion (Parchment/Badgr and many others). */
async function readOpenBadge(u) {
  const res = await get(u.href, { accept: "application/ld+json, application/json" });
  if (!res.ok || !/json/.test(res.headers.get("content-type") || "")) return null;
  const a = await res.json().catch(() => null);
  if (!a || !/Assertion/.test(a.type || "")) return null;
  const b = typeof a.badge === "string" ? await getJson(a.badge, "application/ld+json, application/json") : a.badge;
  const issuer = await issuerOf(b.issuer);
  const host = u.hostname.replace(/^(www|badges|api)\./, "").split(".")[0];
  return {
    platform: "Open Badges",
    title: b.name,
    issuer: issuer.name,
    issued: isoDate(a.issuedOn),
    expires: isoDate(a.expires),
    description: plain(a.narrative || b.description),
    verify: u.href,
    embed: null,
    platforms: [{ name: host.charAt(0).toUpperCase() + host.slice(1), url: u.href }],
    badgeUrl: typeof b.image === "string" ? b.image : b.image?.id,
    certUrl: null,
    notes: [a.revoked ? "WARNING: this assertion is REVOKED." : null, "Open Badges carry no certificate: ask the owner if they have one."].filter(Boolean),
  };
}

/** Last resort: whatever the page tells link previews. */
async function readGeneric(u) {
  const res = await get(u.href, { accept: "text/html,*/*" });
  const type = res.headers.get("content-type") || "";
  if (/^image\//.test(type)) {
    return {
      platform: "Image",
      title: null, issuer: null, issued: null, expires: null, description: null,
      verify: u.href, embed: null, platforms: [{ name: u.hostname, url: u.href }],
      badgeUrl: null, certUrl: u.href,
      notes: ["The link serves the certificate image itself (like Full Stack Open): read the title, issuer and date off the image."],
    };
  }
  const text = await res.text();
  return {
    platform: "Unknown",
    title: meta(text, "og:title") || text.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || null,
    issuer: meta(text, "og:site_name"),
    issued: null, expires: null,
    description: meta(text, "og:description"),
    verify: res.url, embed: null, platforms: [{ name: meta(text, "og:site_name") || u.hostname, url: res.url }],
    badgeUrl: meta(text, "og:image"), certUrl: null,
    notes: [
      res.status >= 400 || /sign.?in|login|authwall/i.test(res.url) ? "The page is behind a login: the public cannot verify this link. Ask the owner for a public share link." : null,
      "Unrecognised platform: only link-preview tags were read. Check every field against the page (open it in a browser or a headless capture).",
    ].filter(Boolean),
  };
}

async function inspect(link) {
  const u = new URL(link);
  const reader = READERS.find((r) => r.match(u));
  if (reader) return { platform: reader.name, ...(await reader.read(u)) };
  return (await readAccredible(u)) || (await readOpenBadge(u)) || readGeneric(u);
}

/* ------------------------------------------------------------- downloads */

const EXT = { "image/png": "png", "image/svg+xml": "svg", "image/jpeg": "jpg", "image/webp": "webp", "application/pdf": "pdf" };

async function save(url, dir, name, fallback) {
  for (const src of [url, fallback].filter(Boolean)) {
    const res = await get(src);
    const type = (res.headers.get("content-type") || "").split(";")[0];
    if (!res.ok || !EXT[type]) continue;
    const file = join(ROOT, "public/achievements", dir, `${name}.${EXT[type]}`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    return { file: file.slice(ROOT.length + 1), src };
  }
  return null;
}

/* ------------------------------------------------------------------ scan */

async function loadSite() {
  const mod = await import(`${pathToFileURL(DATA).href}?t=${Date.now()}`);
  return mod.credentials;
}

async function scan() {
  const site = await loadSite();
  const onSite = JSON.stringify(site);
  const excluded = JSON.parse(await readFile(join(HERE, "../excluded.json"), "utf8"));
  const skip = new Set(excluded.map((e) => e.id));
  const feed = await getJson(`https://www.credly.com/users/${CREDLY_USER}/badges.json`);
  const fresh = feed.data.filter((b) => !onSite.includes(b.id) && !skip.has(b.id));

  console.log(`Credly (${CREDLY_USER}): ${feed.data.length} public badges, ${fresh.length} not on the site.`);
  for (const b of fresh) {
    console.log(`  NEW  ${b.issued_at_date}  ${b.badge_template.name} (${b.issuer?.entities?.[0]?.entity?.name ?? "?"})`);
    console.log(`       https://www.credly.com/badges/${b.id}/public_url`);
  }
  for (const e of excluded) console.log(`  skip ${e.title} — ${e.reason}`);

  const soon = Date.now() + 90 * 864e5;
  const ending = site.filter((c) => c.expires && Date.parse(c.expires) < soon);
  if (ending.length) {
    console.log("\nExpired or expiring within 90 days:");
    for (const c of ending) console.log(`  ${c.expires}  ${c.title}`);
  }
  console.log("\nOther platforms (Accredible, Microsoft Learn, Skilljar, Oracle, Parchment) have no public account listing: new ones need their link.");
}

/* ------------------------------------------------------------------ main */

function entry(d, id) {
  const q = (v) => (v == null ? "null" : JSON.stringify(v));
  const plat = d.platforms.map((p) => `{ name: ${q(p.name)}, url: ${q(p.url)} }`);
  return `  {
    id: ${q(id)},
    title: ${q(d.title)},
    issuer: ${q(d.issuer)},
    issued: ${q(d.issued)},
    expires: ${q(d.expires)},
    category: ${q(d.category)},
    description: ${q(d.description)},
    image: ${q(d.image)},
    imageSource: ${q(d.badgeUrl)},
    certificate: ${q(d.certificate)},
    certificatePdf: ${q(d.certificatePdf)},
    verify: ${q(d.verify)},
    embed: ${q(d.embed)},
    platforms: [${plat.length > 1 ? `\n      ${plat.join(",\n      ")},\n    ` : plat.join("")}],
    featured: 0,
  },`;
}

async function main() {
  const [cmd, link, ...rest] = process.argv.slice(2);
  if (cmd === "scan") return scan();
  if (cmd !== "inspect" || !link) {
    console.error("usage: credential.mjs inspect <url> [--download <slug>] | scan");
    process.exit(2);
  }
  const d = await inspect(link);
  const flag = rest.indexOf("--download");
  const id = (flag >= 0 && rest[flag + 1]) || (d.title ? slug(d.title) : "TODO-slug");
  d.category = guessCategory(`${d.title} ${d.issuer}`) || guessCategory(d.description || "") || "developer";

  const site = await loadSite().catch(() => []);
  const dupe = site.find((c) => c.id === id || (d.verify && c.verify === d.verify) || JSON.stringify(c).includes(link));
  if (dupe) d.notes.unshift(`ALREADY ON THE SITE as "${dupe.id}": update that entry instead of adding a new one.`);

  if (flag >= 0) {
    const badge = d.badgeUrl ? await save(d.badgeUrl, "badges", id, d.badgeFallback) : null;
    const cert = d.certUrl ? await save(d.certUrl, "certificates", id) : null;
    const pdf = d.pdfUrl ? await save(d.pdfUrl, "certificates", id) : null;
    const web = (f) => `/${f.file.replace(/^public\//, "")}`;
    if (badge) d.image = web(badge);
    if (cert) d.certificate = web(cert);
    if (pdf) d.certificatePdf = web(pdf);
    if (pdf && !cert) d.notes.unshift("Render the PDF to an image for the Certificate button (SKILL.md step 4).");
    d.saved = [badge?.file, cert?.file, pdf?.file].filter(Boolean);
  }

  console.log(`Platform: ${d.platform}\n`);
  console.log(entry(d, id));
  if (d.saved?.length) console.log(`\nSaved: ${d.saved.join(", ")}`);
  console.log(`\nCategory "${d.category}" is a guess from keywords: confirm it.`);
  for (const n of d.notes) console.log(`- ${n}`);
}

main().catch((e) => {
  console.error(`Failed: ${e.message}`);
  process.exit(1);
});
