# Portfolio enhancement audit: animation and visual polish

**Date:** 11 November 2026
**Branch:** `feat/about-stack-counters`
**Scope:** every route (Home, About, Projects, Achievements, Contact, 404), the navigation and the theme toggle.

**Method:** I read every page, shared component and stylesheet, then ran the site in Chromium with Playwright:

- widths from 320 to 1920 px;
- light and dark themes;
- with and without reduced motion;
- with and without touch emulation.

Wherever a claim depended on a number (glyph bounds, colours mid-transition, bundle size, focus order), I measured it rather than inferring it from the code.

> **Status: recommendations only.** Nothing in sections B to D has been implemented. The three enhancements that were approved for this round are listed in A4.

**Summary.** The motion system is coherent: one easing family, one masked rise for type, one hairline, one colour wipe.

- **Start with fixes that add no motion:**
  - get the bundle back under Vite's 500 kB warning;
  - fix two dialog focus bugs;
  - show Kochi time beside the label "Kochi";
  - fix three headings where the hairline cuts through letter tails.
- **Then five small enhancements**, each extending a motif the site already owns instead of introducing a new one.

---

## A. Current state

### A1. Libraries and implementation patterns

- **Motion 13** (`motion/react`) is the only JavaScript animation library. Everything else is:
  - CSS transitions and keyframes;
  - one canvas, for the certificate confetti.

  GSAP isn't installed, and nothing on the site pins or scrubs, so it doesn't need to be.
- **One vocabulary.** `src/lib/motion.js` defines the shared motion constants:
  - `EASE` (cubic out) and `EASE_INOUT`;
  - `DUR` and `STAGGER`;
  - the `riseChild`, `fadeChild` and `riseParent` variants.

  `src/index.css` mirrors the easings as `--ease-out` and `--ease-inout`, so Motion and CSS transitions feel the same.
- **Fonts gate every entrance.** `useFontsReady` waits up to 1.6 s, so display type never animates in a fallback face.
- **Patterns:**
  - Variant trees: parents stagger, children inherit.
  - `whileInView` / `useInView` with `once`.
  - `AnimatePresence` for the route sheets and dialogs, and now the technology turnover.
  - Hover states in CSS behind `(hover: hover)`.
  - Decoration in lazy chunks: doodles, robot, featured worlds, confetti.
  - Reduced motion: 18 files branch on `useReducedMotion`, and every stylesheet has a `prefers-reduced-motion` block.

### A2. Existing animations and interactions, by surface

| Surface | Entrances | Interactions and ambient motion |
|---|---|---|
| **Navigation** | n/a | Labels roll on hover (link-reveal, 0.55 s out, 0.75 s back). The active underline slides between links (`layoutId`). On mobile, the menu sheet rises from the bottom and its items arrive as headline lines. |
| **Theme toggle** | n/a | The half-filled dot turns over (0.6 s). Every colour cross-fades for 720 ms (`html.theme-switching *`). |
| **Page change** | The sheet rises (y 48, scale 0.985, 0.6 s). | The outgoing sheet lifts away (0.32 s). With `AnimatePresence mode="wait"`, a navigation takes about 0.9 s. |
| **Home** | The name's characters rise from masks. Then, in order: the meta strip, the statement rows, the tiles. Repeat visits play at 45 % speed. | Tiles get the ink wipe and their description. The clock ticks. Nothing else moves after the intro. |
| **About** | Headline, then statement, prose stagger, and the facts after the prose. | Elsewhere tiles get a brand-colour wipe and a micro-world (hover or focus; a still tableau on touch). New this round: the technology turnover and the Bytestrone card (A4). |
| **Projects** | Headline, then each project rises into view and its screenshot is revealed with a clip-path. | The media scales and the title nudges right. A cursor-following "Live" pill moves on springs. Preview reels play on hover/focus, or through a Preview toggle on touch and under reduced motion. The showcase modal is portaled and focus-trapped. |
| **Achievements** | Headline, with doodles drawing on. Then the statement and the three figures (now counting up), then featured tiles and index rows as they come into view. | Featured worlds play on hover/focus. Index rows get a band, an accent hairline, a lift and sibling dimming. Doodles hop after a certificate. Confetti bursts the first time each certificate opens. |
| **Contact** | Headline, then the fields rise. | Doodles drift and perform small actions. A paper plane loops. The pixel robot follows focus and reacts to typing. Hovering Send previews what sending will do. |
| **404** | The code and message lines, then the sentence, then the tile. | Tile wipe. The empty middle is deliberate. |

### A3. What already works well

- **It reads as a system, not as effects.** Type always rises out of a mask. Rules always draw left to right. Tiles always wipe from the bottom edge. Links always roll.
- **Interactions reveal information** instead of decorating: tile descriptions, social handles, Verify, the Live pill, previews.
- **Visitors are respected:**
  - Reduced motion is handled almost everywhere.
  - Touch gets explicit controls rather than hover-only content.
  - Previews never play with sound, and only one plays at a time.
  - Video loads only metadata until someone asks for it.
- **The details are crafted:**
  - Kerning is repaired in split headlines.
  - A preview fades in only once a frame is really playing.
  - The video modal handles Escape in the capture phase.
  - The doodles' celebration waits until the lightbox has closed.

### A4. Added in this round (approved, implemented)

- **Achievements.** The three figures count up from zero, eased out and a beat apart, once, when they come into view:
  - built on Motion's CSS-variable animation and `onUpdate`, so React doesn't re-render while they count;
  - the standalone "Since 2025" figure is gone.
- **About: "What I work with".** One technology at a time at display size:
  - the characters turn over through a mask;
  - an index doubles as navigation and shows a progress hairline;
  - rotation pauses off-screen and on interaction.
- **About: Bytestrone.** The name now links to the company's site. On hover or focus (a "+" toggle on touch screens) it shows an ink identity card with the official logo.

---

## B. Recommended enhancements

**How these were chosen:** extend motifs the site already owns (the mask, the hairline, the wipe, the roll) and add no new ones. That gives five enhancements (B1 to B5), followed by four small polish fixes that add no motion (B6).

### B1. Theme switch as one wipe

- **Page/component:** theme toggle. `src/context/ThemeProvider.jsx`, `src/index.css`.
- **Proposal:** the new palette rises from the bottom edge of the window in a single clip-path wipe (0.6 s, ease-out). This is the same gesture as the tiles' ink wipe. The theme dot still turns over.
- **Why:**
  - **Elements don't change together.** Today's cross-fade transitions every element for 720 ms, and elements with their own `transition` drop out of it. Measured on About 150 ms into a switch, the sheet was mid-fade while the ink-toned DEV tile had already snapped to its dark colour.
  - **It's cheaper.** A View Transition moves everything on one clock and costs one composite, instead of a colour transition on every node.
- **Implementation:**
  - In `setTheme`, when `document.startViewTransition` exists and reduced motion is off:
    - call it with a callback that sets `data-theme` on `<html>` directly;
    - in the same callback, update the state with `flushSync`, so the new snapshot already carries the new palette.
  - Animate `::view-transition-new(root)` from `clip-path: inset(100% 0 0 0)` to `inset(0)`. Leave the old snapshot still.
  - Fallbacks:
    - browsers without View Transitions keep today's class-based cross-fade;
    - under reduced motion, use a 200 ms opacity cross-fade.
- **Complexity:** Low to Medium. **Priority:** Medium to High.

### B2. Hairlines that draw

- **Page/component:**
  - About: the facts list.
  - Achievements: the top rule of each figure, and the index's top rule.
- **Proposal:** a rule that opens a block draws from left to right (scaleX 0 to 1, 0.9 s, `EASE`) as the block enters, exactly like the rules under the headlines. The content then rises as it does now. Row separators stay as plain borders.
- **Why:**
  - **The motif is only half applied.** The hairline is the site's signature and draws under every headline. The rules that structure content, though, just fade in with their blocks.
  - **It adds rhythm, not vocabulary.** Drawing them gives long pages a quiet rhythm without anything new.
- **Implementation:**
  1. Extract the rule from `TitleLine` (`src/components/TitleLines.jsx`) into a small `Rule` component with `hidden` / `visible` variants and an opacity-only reduced-motion variant.
  2. Use it in place of `border-t` / `border-b` on the first rule of each block.
- **Complexity:** Low. **Priority:** Medium.

### B3. Statements revealed line by line

- **Page/component:** the serif statements:
  - About: the lede and the Elsewhere statement;
  - Achievements: the statement and "Where next";
  - Contact: the statement;
  - 404: the sentence.
- **Proposal:** each line rises out of its own mask, 0.06 s after the one before. Today the whole paragraph rises 24 px as one block.
- **Why:**
  - **They arrive like body copy.** The statements are the voice of each page. The same 24 px, 0.7 s rise is used for almost every block, in `riseChild` and four hand-copied variants.
  - **Line masks give them headline treatment**, the reference site's signature move, and make the long pages less uniform.
- **Implementation:** a `StatementLines` component.
  1. Once fonts are ready, render the words as spans and group them into lines by `offsetTop`.
  2. Wrap each line in an `overflow: hidden` mask.
  3. Re-split on width changes (`ResizeObserver`, debounced, only when the line count changes).
  4. Keep one plain-text copy for assistive tech.
  5. Under reduced motion, keep today's fade.

  Pilot it on About's lede and judge the effect before rolling it out.
- **Complexity:** Medium. **Priority:** Medium.

### B4. Index filters that re-flow

- **Page/component:** the Achievements index (`Archive` in `src/pages/Achievements.jsx`).
- **Proposal:** when a field is chosen, the rows that stay slide to their new places and the others fold away. Numbers and the count stay put, and nothing re-enters from below.
- **Why:** the list is re-keyed on every filter (`key={filter}`), so all rows vanish and the full entrance stagger replays with each click. It's the one repeated animation on the site that reads as a reload rather than a response.
- **Implementation:**
  1. Remove `key={filter}`.
  2. Give each row Motion's `layout` prop inside `AnimatePresence`. The layout engine is already in the bundle through the navbar's `layoutId`.
  3. Exiting rows fade and collapse their height over 0.3 s.
  4. Keep the polite count announcement.
  5. Under reduced motion, the change is instant.
- **Complexity:** Medium. **Priority:** Medium.

### B5. Kochi time that ticks

- **Page/component:** the Home meta strip (`TimeDisplay` in `src/pages/Home.jsx`).
- **Proposal:**
  - show Kochi's time;
  - roll only the digits that change: each new digit rises into its mask, like the position counter in the new "What I work with" index.
- **Why:**
  - **A correctness fix first.** The clock calls `toLocaleTimeString` without a `timeZone`, so next to the label "Kochi" it shows the visitor's local time. The README describes it as the visitor's time.
  - **Home's only live element.** A quiet roll makes it read as live metadata, without adding motion anywhere else on the page.
- **Implementation:**
  1. Format the time with `Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", … })`.
  2. Key each digit by its value inside a one-character mask under `AnimatePresence`. Tabular numerals keep the width fixed.
  3. Pause the interval while the tab is hidden.
  4. Under reduced motion, render plain text.

  While there, give the email link the house link-reveal: it is the only `hover:underline` link on the site. Then update the README's clock bullet.
- **Complexity:** Low. **Priority:** Medium. The time-zone fix on its own is High.

### B6. Polish fixes that add no motion

| Fix | Where | Why | Complexity | Priority |
|---|---|---|---|---|
| **Open the descender masks** | Home's ".NET Developer" (desktop and phone layouts), the mobile menu's "Projects", 404's "Page not found" | On Home at 1440 px, the tail of the `p` runs 7 px past its mask and the hairline cuts through it, on the landing page. On phones the clip is 2–3 px, again with the rule crossing; the same happens in the mobile menu. On the 404 the mask is already open but the rule crosses the `g`. `TitleLine` already has a `descenders` prop, which the Projects and Achievements headings use. Home's serif "Correya" was measured and is fine. | Low | **High** |
| **Mark the current page in the mobile menu** | `MobileMenu` in `src/components/Navbar.jsx` | `aria-current` is set but nothing styles it, while desktop has its underline. Mark the current item with a small index number or a hairline. | Low | Medium |
| **Label links by where they go** | Projects tile 01 (El Conceptz) | Its `live` URL is the GitHub repository, yet the tile's label says "live site" and the cursor pill says "Live". (The modal already removes the duplicate.) Show "GitHub" when `live === github`. | Low | Medium |
| **Pressed state on tiles** | Project tiles, credential tiles, tile buttons | The tap highlight is removed with no `:active` state in its place, so taps on phones give no feedback. Use the 1 px press the navigation tiles already have, or briefly darken the matte. | Low | Low |

### Considered and not recommended

These don't fit the current aesthetic, or cost more than they give:

- **Custom cursors, magnetic buttons, cursor trails.** They're generic, and they would compete with the one cursor element that carries meaning: the Live pill.
- **Smooth-scroll libraries (Lenis), scroll-scrubbed pinning, tile parallax.** They fight native scrolling and the editorial calm, and they would bring in GSAP for little gain.
- **"Curtain" page transitions.** The sheet's rise and lift already is the transition. A curtain would add about 0.5 s to every navigation.
- **More ambient loops.** Contact and Achievements already run many. The next gains come from pausing them (C1), not adding to them.
- **Marquees, grain or noise overlays, text-scramble effects.** They're off-brand for this aesthetic.

---

## C. Performance and accessibility

### C1. Animation performance

| Issue | Evidence | Suggested fix | Priority |
|---|---|---|---|
| **Main JS chunk is over Vite's 500 kB warning** | It was 499.09 kB before this round and is **510.46 kB** now. All six pages are static imports in `src/App.jsx`, and the six Elsewhere worlds are eager (`import.meta.glob(…, { eager: true })`). Making only the new technology section lazy was measured at 503.69 kB, so splitting a single section won't clear the warning. | Route-level code splitting: `lazy()` each page inside the existing `AnimatePresence mode="wait"`, with a `Suspense` boundary per route. The sheet entrance covers the swap. Prefetch a route when its nav link or tile is hovered. | **High** |
| **Ambient loops never pause** | 33 `infinite` keyframe rules across `doodles.css`, `achievements.css` and `contact.css`. The paper-plane flight and the robot's bob loop forever in Motion (`repeat: Infinity`). Nothing is gated by viewport or tab visibility, and the robot's flames keep animating at opacity 0. | Set a `data-paused` attribute from an `IntersectionObserver` and `visibilitychange` on each doodle layer (`animation-play-state: paused`). Pause the Motion loops the same way. | Medium |
| **Permanent `will-change`** | Set on `.title-mask .char` and `.word` (every headline character), `.project-tile__media` and `.cred-tile__badge` | Remove it from the character and word rule, since Motion promotes elements while it animates them. Set it only on hover for the media and badges. | Medium |
| **The theme switch transitions every element** | `html.theme-switching *` transitions five properties on every node for 720 ms | B1 | Medium |
| **One very heavy image** | `public/projects/project5.png` is 2.0 MB. The other screenshots are 72–435 KB. | Convert to WebP or AVIF at the tile's rendered size, with `srcset` | Medium |
| **Font gate on first load** | Entrances wait up to 1.6 s for fonts | Preload the two above-the-fold woff2 files (Instrument Sans latin, Newsreader latin) | Low |
| **Layout reads on every pointer move** | The Live pill reads `getBoundingClientRect` on each `pointermove` | Cache the rectangle on `pointerenter` and refresh it on scroll or resize | Low |
| **Contact re-renders on every keystroke** | `pulse("tick")` sets page state on each keystroke to make the robot hop | Drive the hop through the robot's imperative ref, the way `place()` already works | Low |

### C2. Mobile-specific considerations

- **Hover is handled well.** Hover-only content has touch fallbacks: still tableaux, CTAs that are always visible, Preview toggles. Keep that rule for anything new. This round's company card follows it with a "+" toggle, so the name stays a one-tap link.
- **Keyboard focus is invisible on touch devices with keyboards** (for example an iPad with a keyboard):
  - NavCard, SocialTile and SendButton sit inside `overflow-hidden` mask wrappers that clip the 3 px focus outline;
  - the colour wipe that otherwise signals focus is gated behind `(hover: hover)`.

  Draw an inset ring (`outline-offset: -3px`) on `:focus-visible` outside the hover query.
- **Taps give no feedback.** Add pressed states (B6).
- **Previews.** They load only metadata until played, which is good. Consider a lighter 720p encoding for the hover previews; the full reels are 1.3–11 MB.

### C3. Reduced-motion support

- **Coverage is broad.** 18 files branch on `useReducedMotion`, and every stylesheet has a reduced-motion block. This round's additions follow the same rules:
  - no rotation;
  - the figures appear at their final values;
  - choices cross-fade in place.
- **Gaps:**
  - the navbar's `layoutId` underline still slides;
  - the theme dot's rotation isn't in the reduced-motion list;
  - the robot's blink timers aren't gated (cosmetic).
- **Safety net.** Wrap the app in `<MotionConfig reducedMotion="user">`. Motion then skips transform and layout animations for these visitors even where a component forgets to branch.

### C4. Accessibility improvements

| Issue | Evidence | Suggested fix | Priority |
|---|---|---|---|
| **The Lightbox renders under the navbar** | It isn't portaled; it lives inside the sheet's stacking context (`isolation: isolate`). With the page scrolled to the top, the navbar paints over the veil and stays clickable. Verified in the browser. | Portal it to `document.body`, as `ShowcaseModal` already does | **High** |
| **Lightbox steps move focus behind the veil** | Its effect depends on `prev` and `next`, which change with every step. On each step:<br>1. the cleanup focuses the opener (scrolling the page behind the veil);<br>2. Close is focused again 60 ms later.<br>So a keyboard user pressing the Next arrow lands on Close. | Keep `prev` and `next` in refs, or split the open/close effect from the key handler, so the effect runs once per opening. Add a Tab trap. | **High** |
| **The mobile menu neither traps nor returns focus** | Escape and the scroll lock work, but:<br>• there is no focus trap and no `inert` on the page;<br>• closing doesn't return focus to Menu;<br>• `aria-controls` points to an element that exists only while the menu is open. | Trap focus (or make the page `inert`) and return focus to the Menu button | Medium |
| **Route changes are silent** | `<title>` is always "Aaron Correya", and focus stays on the clicked link after the sheet swaps | Set `document.title` per route. After the entrance, move focus to the page's `h1` (`tabIndex={-1}`) or announce it politely. Add a skip link. | Medium |
| **Focus outlines clipped inside masks** | See C2 | See C2 | Medium |

---

## D. Suggested implementation roadmap

The order puts the most impact first and gets correctness right before adding polish. Each step can ship on its own.

**Phase 1: fixes with no new motion**
1. Route-level code splitting, to get the main chunk back under 500 kB (C1).
2. Portal the Lightbox, fix its focus handling and add a Tab trap (C4).
3. Show Kochi time beside "Kochi", and update the README bullet (B5, first half).
4. Descender masks on Home, the 404 and the mobile menu (B6).
5. `MotionConfig` safety net, plus the reduced-motion gaps for the theme dot and the `layoutId` underline (C3).

**Phase 2: quick, highly visible polish**

6. Theme switch as one wipe, with its fallbacks (B1).
7. Hairlines that draw (B2).
8. Mobile menu: current-page marker, focus trap, returned focus. Per-route titles and focus on route change (B6, C4).

**Phase 3: refinements**

9. Index filters that re-flow (B4).
10. Rolling digits for the clock, and link-reveal on the email link (B5, second half).
11. Pause off-screen loops, clean up `will-change`, compress the heavy screenshot (C1).

**Phase 4: the largest typographic change**

12. Statements revealed line by line (B3): pilot on About's lede, review, then roll out page by page.
