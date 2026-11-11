---
name: add-achievement
description: Add a certificate, badge or credential to the portfolio's /achievements page from a link (Credly, Accredible, Microsoft Learn, Anthropic Academy/Skilljar, Oracle CertView, Parchment/Open Badges and others), or check for new credentials that aren't listed yet. Use when the owner shares a credential, verify or badge link, says they earned or passed something, or asks to update, refresh or remove an achievement.
---

# Add an achievement

The /achievements page reads one data file, `src/data/achievements.js`. Its
header comment is the field contract, so read it first. The page works out the
order, stats, filters and numbering from the data, so **adding a credential
means editing data and adding files under `public/achievements/`, never
components**.

The helper script reads public credential links anonymously. It sees only
what the public sees, and nothing is sent anywhere:

```bash
node .agents/skills/add-achievement/scripts/credential.mjs inspect "<link>"                     # draft entry + notes
node .agents/skills/add-achievement/scripts/credential.mjs inspect "<link>" --download <slug>   # also saves artwork
node .agents/skills/add-achievement/scripts/credential.mjs scan                                 # what's missing or expiring
```

## Steps

1. **Inspect the link.** Run `inspect` and read every note it prints.
   - "ALREADY ON THE SITE" means update that entry (dates, expiry, artwork)
     instead of adding a duplicate.
   - If the page is behind a login (LinkedIn, a Microsoft Learn profile link
     with no `sharingId`, a `blob:` URL), stop and ask the owner for a public
     share link. A credential the public can't open gets `verify: null`, so
     only list it like that if the owner says to.
   - Platform-specific details are in `references/platforms.md`.

2. **Choose the slug.** Use the issuer's title in kebab-case, as the existing
   entries do, for example `microsoft-certified-azure-fundamentals`. It
   becomes the `id` and the file name of every asset. Run `inspect` again
   with `--download <slug>` to save the badge, plus the certificate image
   and/or PDF where the platform makes them public.

3. **Fill the gaps the script can't.**
   - `title`: keep the issuer's exact wording (the site keeps "Academy
     Accreditation - ...").
   - `category`: the script guesses from keywords. Confirm it against
     `CATEGORIES` and the neighbouring entries. A new category key needs the
     owner's OK.
   - `description`: the issuer's own words, as plain text. If the page has
     none, write one factual sentence from the issuer's public course page.
     Don't add praise.
   - `image`: the issuer's official badge artwork. If there is none (Skilljar
     certificates, Hacktoberfest), ask the owner for it or use the issuer's
     official mark. **Never draw or generate badge art.** Set `imageSource` to
     where the art came from, or to "supplied by the holder".
   - `expires`: fill it whenever the platform gives one.
   - `platforms`: every public page that shows the credential. Add the
     owner's wallet or profile only if they want it.
   - `embed`: only for Credly. It's kept for reference and not rendered.
   - `featured`: `0` unless the owner asks for it. Featured values are a
     display order (1 is the lead tile). Only the three ids in
     `src/components/achievements/worlds/FeaturedWorld.jsx` have hover
     scenes. A new featured tile still works without one, but say so.

4. **Certificates.** The Certificate button shows `certificate` (an image)
   and offers `certificatePdf` as the download.
   - **PDF only:** render it to an image on macOS:
     `qlmanage -t -s 2000 -o /tmp/cert public/achievements/certificates/<slug>.pdf && mv /tmp/cert/<slug>.pdf.png public/achievements/certificates/<slug>.png`
   - **Over ~1 MB:** convert to JPEG:
     `sips -s format jpeg -s formatOptions 82 <png> --out <slug>.jpg`
     Delete the PNG and point `certificate` at the `.jpg`.
   - **Owner-only certificates** (Credly, Oracle, Postman): ask the owner to
     download the file, then place it the same way.
   - **No certificate at all:** set both fields to `null`, which hides the
     button.

5. **Insert the entry.** Paste the printed object into `credentials`. Keep
   the file newest-first by `issued` (null dates go last), matching the
   existing order. Update the "checked against its public verification page
   on <date>" line in the header comment if you re-verified everything.

6. **Verify.**
   - `npm run lint` and `npm run build` must pass. The main JS chunk sits just
     under Vite's 500 kB warning, but a data entry adds well under 1 kB.
   - Open `/achievements` in the dev server, in both themes and at phone
     width. Check that the new row shows the right field, date and buttons,
     that the badge looks right in the lightbox, and that the stats moved
     (credentials, issuers, fields).
   - If you can't run a browser, say so instead of claiming the page was
     checked.

7. **Report back.** List what was added, what came from the platform and
   what the owner still needs to supply (badge art, certificate files).
   Don't commit or push unless asked. Work on a branch, not `main`.

## Checking for new credentials

`scan` lists Credly badges on the owner's public profile (`aaron-correya`)
that aren't on the site. It skips anything in `excluded.json`, which holds
credentials the owner deliberately removed; add to that list when they remove
one. It also lists entries that are expired or expire within 90 days.

Only Credly has a public account listing. Accredible wallets, Microsoft Learn,
Skilljar, Oracle and LinkedIn need a login to list everything, so new
credentials from those platforms arrive as links from the owner.

## Removing or updating

- **Removing:** delete the entry and its files under `public/achievements/`,
  and add it to `excluded.json` if `scan` would otherwise suggest it again.
- **Renewing:** update `issued`, `expires` and the artwork. Keep the `id` so
  links stay stable.
