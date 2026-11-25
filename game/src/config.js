// Lapar Kilat — warung cooking game: every tuning number lives here so the
// kitchen, the orders and the pressure curve can be balanced in one place.
export const VIEW = { width: 1280, height: 800 };

export const SHIFT_SECONDS = 150;
export const RUSH_AT_SECONDS_LEFT = 45;
export const MAX_ORDERS = 4;
export const MAX_HEARTS = 3;
export const ORDER_SPAWN_EVERY = 14;
export const ORDER_SPAWN_EVERY_RUSH = 9;
export const ORDER_PATIENCE = 50;
export const ORDER_PATIENCE_RUSH = 34;
export const COMBO_STEP = 0.1;
export const COMBO_CAP = 2.0;

// The cook walks this fast (pixels per second) and can only carry one thing.
export const COOK_SPEED = 340;
export const COOK_RADIUS = 26;
export const INTERACT_RANGE = 92;

// Processing times, in seconds. Chopping is three quick hits; frying and
// grilling run on their own clock and burn if you forget them.
export const CHOP_HITS = 3;
export const CHOP_HIT_SECONDS = 0.35;
export const FRY_SECONDS = 4.5;
export const GRILL_SECONDS = 5.5;
export const BURN_AFTER_SECONDS = 8;
export const POUR_SECONDS = 1.2;

// Where the cook may walk: the open floor between the order board and the
// ingredient counter. Stations sit around its edges.
export const FLOOR = { x: 24, y: 228, width: 1232, height: 400 };

export const PALETTE = {
  wall: '#0f766e',
  wallDark: '#0b5e57',
  floorA: '#f3e3c3',
  floorB: '#ecd9ae',
  wood: '#8a5a2b',
  woodDark: '#6b4420',
  counter: '#a06a33',
  steel: '#9fb3bd',
  steelDark: '#6e828d',
  cream: '#fff8e7',
  ink: '#2b1d12',
  red: '#d64541',
  gold: '#f5b301',
  green: '#3d9b4f',
};

export const STATIONS = {
  wok: { id: 'wok', kind: 'fry', label: 'WAJAN', sub: 'goreng', x: 56, y: 300, w: 190, h: 118 },
  grill: { id: 'grill', kind: 'grill', label: 'PANGGANGAN', sub: 'bakar sate', x: 56, y: 452, w: 190, h: 118 },
  chop: { id: 'chop', kind: 'chop', label: 'MEJA POTONG', sub: 'cincang 3x', x: 300, y: 300, w: 210, h: 112 },
  assemble: { id: 'assemble', kind: 'assemble', label: 'MEJA RACIK', sub: 'susun piring', x: 756, y: 300, w: 230, h: 118 },
  serve: { id: 'serve', kind: 'serve', label: 'JENDELA SAJI', sub: 'antar pesanan', x: 1024, y: 300, w: 200, h: 118 },
  pour: { id: 'pour', kind: 'pour', label: 'ES TEH', sub: 'tuang 1 detik', x: 1024, y: 452, w: 200, h: 104 },
  trash: { id: 'trash', kind: 'trash', label: 'SAMPAH', sub: '', x: 56, y: 596, w: 130, h: 76 },
};

// Ingredient bins along the bottom counter, left to right.
export const BINS = [
  { id: 'nasi', x: 262, w: 108 },
  { id: 'mie', x: 378, w: 108 },
  { id: 'ayam', x: 494, w: 108 },
  { id: 'telur', x: 610, w: 108 },
  { id: 'sayur', x: 726, w: 108 },
  { id: 'cabai', x: 842, w: 108 },
  { id: 'kacang', x: 958, w: 108 },
  { id: 'bawang', x: 1074, w: 108 },
];
export const BIN_Y = 668;
export const BIN_H = 96;
