/**
 * Where to find Aaron elsewhere. Data only, no presentation.
 * `tone` is the tile's resting matte (site palette); `brand` and `brandFg` are
 * the platform's own colours, used only while the tile is hovered or focused.
 * `palette` colours the hover illustration (components/worlds) by role:
 *   surface / surface2  bodies and secondary planes of the illustrated objects
 *   detail              marks drawn on those surfaces
 *   shade               flat drop shadow (translucent black, darkens anything)
 *   line                marks drawn straight on the brand colour
 *   a1–a3               the platform's accent colours
 * `href: null` keeps the tile in the row without a destination yet. Marks are
 * drawn by components/BrandIcons.jsx, keyed by `id`.
 */
export const socials = [
  {
    id: "github",
    label: "GitHub",
    handle: "@AaronStark1",
    href: "https://github.com/AaronStark1",
    tone: "cream",
    brand: "#24292f",
    brandFg: "#ffffff",
    // GitHub Primer dark: canvas, overlay, fg; success green, done purple, accent blue
    palette: { surface: "#0d1117", surface2: "#30363d", detail: "#e6edf3", shade: "rgba(0,0,0,.42)", line: "#ffffff", a1: "#3fb950", a2: "#a371f7", a3: "#58a6ff" },
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    handle: "aaron-correya",
    href: "https://www.linkedin.com/in/aaron-correya/",
    tone: "ochre",
    brand: "#0a66c2",
    brandFg: "#ffffff",
    // LinkedIn blue family plus its warm illustration accents
    palette: { surface: "#ffffff", surface2: "#dbeafe", detail: "#004182", shade: "rgba(0,20,60,.28)", line: "#ffffff", a1: "#70b5f9", a2: "#f5c75d", a3: "#5fd08f" },
  },
  {
    id: "dev",
    label: "DEV",
    handle: "@aaronstark1",
    href: "https://dev.to/aaronstark1",
    tone: "ink",
    brand: "#0a0a0a",
    brandFg: "#ffffff",
    // DEV: white cards on black, indigo primary, reaction red and yellow
    palette: { surface: "#ffffff", surface2: "#e5e5e5", detail: "#171717", shade: "rgba(255,255,255,.12)", line: "#ffffff", a1: "#3b49df", a2: "#ef4444", a3: "#fbbf24" },
  },
  {
    id: "discord",
    label: "Discord",
    handle: "Profile",
    href: "https://discord.com/users/481099487910035466",
    tone: "brick",
    brand: "#5865f2",
    brandFg: "#ffffff",
    // Discord brand palette: green, yellow, fuchsia; dark not-quite-black for detail
    palette: { surface: "#ffffff", surface2: "#e3e5e8", detail: "#23272a", shade: "rgba(20,24,80,.3)", line: "#ffffff", a1: "#57f287", a2: "#fee75c", a3: "#eb459e" },
  },
  {
    id: "spotify",
    label: "Spotify",
    handle: "Profile",
    href: "https://open.spotify.com/user/61jeufdqi4ys9wolb0gqn1daf",
    tone: "cream",
    brand: "#1db954",
    brandFg: "#121212",
    // Spotify black and white with its editorial pink and orange
    palette: { surface: "#121212", surface2: "#2a2a2a", detail: "#ffffff", shade: "rgba(0,40,10,.3)", line: "#121212", a1: "#ffffff", a2: "#f573a0", a3: "#ffa42b" },
  },
  {
    id: "email",
    label: "Email",
    handle: "djaaronmirage123@gmail.com",
    href: "mailto:djaaronmirage123@gmail.com",
    tone: "ochre",
    brand: "#ea4335",
    brandFg: "#ffffff",
    // Gmail: white paper, Google blue, yellow and green, deep red for depth
    palette: { surface: "#ffffff", surface2: "#f1f3f4", detail: "#5f6368", shade: "rgba(90,0,0,.3)", line: "#ffffff", a1: "#4285f4", a2: "#fbbc04", a3: "#34a853" },
  },
];
