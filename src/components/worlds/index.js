/* Registry of platform worlds, keyed by social id. Files are picked up by
   name (`<id>World.jsx` → id, lowercase) so a tile without a world simply
   plays none. */
const modules = import.meta.glob("./*World.jsx", { eager: true });

export const worlds = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [path.replace(/^\.\/(.*)World\.jsx$/, "$1").toLowerCase(), mod.default])
);
