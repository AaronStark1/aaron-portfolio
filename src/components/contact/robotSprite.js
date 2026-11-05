/* The contact robot, drawn as pixel art on a cell grid. Each sprite is a
   list of rows; every character is one cell:

     o  outline (the panel's text colour: cream on ink, ink on cream)
     B  body (ochre)          S  body shade (deep ochre)
     V  visor (char)          H  visor glint (cream, translucent)
     R  accent (brick)        E  eye (cream)
     Y  thruster flame (ochre)
     .  or space: empty

   Sprites are parsed once into rectangles (horizontal runs merged), with
   an origin so parts can be laid over the body: the body grid is 20 cells
   wide and 17 tall, the pointing arm reaches to column 26. */

const BODY = [
  "         oo         ",
  "        oRRo        ",
  "        oRRo        ",
  "         oo         ",
  "         oo         ",
  "   oooooooooooooo   ",
  "  oBBBBBBBBBBBBBBo  ",
  "  oBBVVVVVVVVVVBBo  ",
  "  oBBVVVVVVVVVVBBo  ",
  "  oBBVVVVVVVVVVBBo  ",
  "  oBBVVVVVVVVVVBBo  ",
  "  oBBBRRBBBBRRBBBo  ",
  "  oSSSSSSSSSSSSSSo  ",
  "   oooooooooooooo   ",
  "     oBBo  oBBo     ",
  "     oBBo  oBBo     ",
  "     oooo  oooo     ",
];

/* Glint on the visor's top-right corner */
const GLINT = ["HH"];

/* Arms. Rest arms hang at the sides; the raised arms are used for waving
   and cheering (two frames each, swapped in a step loop). */
const ARM_LEFT_REST = ["oo", "oB", "oB", "oB", "oo"]; // origin (0, 8)
const ARM_RIGHT_REST = ["oo", "Bo", "Bo", "Bo", "oo"]; // origin (18, 8)

const ARM_LEFT_UP_A = ["ooo", "oBo", "oBo", "oBo", "oB ", "oB ", "oo "]; // origin (0, 2)
const ARM_LEFT_UP_B = ["ooo ", "oBo ", "oBo ", "oBBo", " oB ", " oB ", " oo "]; // origin (-1, 2)
const ARM_RIGHT_UP_A = ["ooo", "oBo", "oBo", "oBo", " Bo", " Bo", " oo"]; // origin (17, 2)
const ARM_RIGHT_UP_B = [" ooo", " oBo", " oBo", "oBBo", " Bo ", " Bo ", " oo "]; // origin (17, 2)

/* Pointing arm: reaches out to the right, towards the form */
const ARM_POINT = ["oooooooo", "BBBBBBHo", "oooooooo"]; // origin (18, 8)

/* Thruster flames under the feet, two flicker frames */
const FLAME_A = ["YY    YY", "R      R"]; // origin (6, 17)
const FLAME_B = ["YY    YY", " R    R "]; // origin (6, 17)

/* Eyes, relative to the visor's top-left cell (5, 7); the visor is 10 × 4. */
const EYES = {
  open: [" ", "  EE  EE", "  EE  EE"],
  blink: [" ", " ", "  EE  EE"],
  happy: [" ", "  E    E", " E E  E E"],
  sad: [" ", " E E  E E", "  E    E"],
  oops: ["  E    E", "   E  E", "  E    E"],
  love: [" R R  R R", " RRR  RRR", "  R    R"],
};

export const VISOR = { x: 5, y: 7, w: 10, h: 4 };
export const GRID = { w: 20, h: 17 };

/* ---------------------------------------------------------------------- */

function parse(rows, ox = 0, oy = 0) {
  const out = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const k = row[x];
      if (k === " " || k === ".") {
        x += 1;
        continue;
      }
      let w = 1;
      while (row[x + w] === k) w += 1;
      out.push({ k, x: x + ox, y: y + oy, w, h: 1 });
      x += w;
    }
  });
  return out;
}

export const SPRITES = {
  body: parse(BODY),
  glint: parse(GLINT, 13, 7),
  armLeftRest: parse(ARM_LEFT_REST, 0, 8),
  armRightRest: parse(ARM_RIGHT_REST, 18, 8),
  armLeftUpA: parse(ARM_LEFT_UP_A, 0, 2),
  armLeftUpB: parse(ARM_LEFT_UP_B, -1, 2),
  armRightUpA: parse(ARM_RIGHT_UP_A, 17, 2),
  armRightUpB: parse(ARM_RIGHT_UP_B, 17, 2),
  armPoint: parse(ARM_POINT, 18, 8),
  flameA: parse(FLAME_A, 6, 17),
  flameB: parse(FLAME_B, 6, 17),
  eyes: Object.fromEntries(Object.entries(EYES).map(([name, rows]) => [name, parse(rows, VISOR.x, VISOR.y)])),
};
