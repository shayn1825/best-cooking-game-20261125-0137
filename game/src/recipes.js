// Lapar Kilat's food: raw ingredients from the bins, what each station does
// to them, and the five dishes customers order. A dish is a set of finished
// components; the plate is done when it holds exactly that set.
import { pick } from './random.js';

// Raw ingredient: what the bin holds, its colour, and how it is processed.
// process: 'chop' | 'fry' | 'grill' | 'ready' (goes straight on the plate).
export const INGREDIENTS = {
  nasi: { name: 'Nasi', color: '#f7f3e6', process: 'fry', cooked: 'nasi-goreng', cookedName: 'Nasi Goreng' },
  mie: { name: 'Mie', color: '#f2c14e', process: 'fry', cooked: 'mie-goreng', cookedName: 'Mie Goreng' },
  ayam: { name: 'Ayam', color: '#f2a594', process: 'grill', cooked: 'sate-ayam', cookedName: 'Sate Ayam' },
  telur: { name: 'Telur', color: '#f7e08a', process: 'fry', cooked: 'telur-goreng', cookedName: 'Telur Goreng' },
  sayur: { name: 'Sayur', color: '#58a34a', process: 'chop', cooked: 'sayur-cincang', cookedName: 'Sayur Cincang' },
  cabai: { name: 'Cabai', color: '#d64541', process: 'chop', cooked: 'cabai-cincang', cookedName: 'Cabai Cincang' },
  kacang: { name: 'Kacang', color: '#a8763e', process: 'ready', cooked: 'kacang', cookedName: 'Saus Kacang' },
  bawang: { name: 'Bawang', color: '#c9a7d6', process: 'chop', cooked: 'bawang-cincang', cookedName: 'Bawang Cincang' },
};

// Finished component: the thing that lands on a plate, with its plate colour.
export const COMPONENTS = {
  'nasi-goreng': { name: 'Nasi Goreng', color: '#e8b64c' },
  'mie-goreng': { name: 'Mie Goreng', color: '#e09a2b' },
  'sate-ayam': { name: 'Sate Ayam', color: '#b4552d' },
  'telur-goreng': { name: 'Telur Goreng', color: '#f7d774' },
  'sayur-cincang': { name: 'Sayur Cincang', color: '#4c9a3f' },
  'cabai-cincang': { name: 'Cabai Cincang', color: '#c0392b' },
  'bawang-cincang': { name: 'Bawang Cincang', color: '#b48ec9' },
  kacang: { name: 'Saus Kacang', color: '#8a5a2b' },
  'es-teh': { name: 'Es Teh', color: '#c97b2d' },
};

export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', price: 25, components: ['nasi-goreng', 'telur-goreng', 'bawang-cincang'] },
  { id: 'mie-goreng', name: 'Mie Goreng', price: 25, components: ['mie-goreng', 'sayur-cincang', 'cabai-cincang'] },
  { id: 'sate-ayam', name: 'Sate Ayam', price: 30, components: ['sate-ayam', 'kacang', 'bawang-cincang'] },
  { id: 'gado-gado', name: 'Gado-Gado', price: 28, components: ['sayur-cincang', 'telur-goreng', 'kacang'] },
  { id: 'es-teh', name: 'Es Teh Manis', price: 8, components: ['es-teh'], drink: true },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? null;
}

/** The plate matches a recipe when it holds exactly that recipe's set. */
export function matchRecipe(componentIds) {
  const sorted = componentIds.slice().sort().join('|');
  return RECIPES.find((r) => r.components.slice().sort().join('|') === sorted) ?? null;
}

/** Weighted order pick: cheap drinks appear often as filler, big dishes less. */
export function randomRecipe(rng) {
  const bag = ['nasi-goreng', 'nasi-goreng', 'mie-goreng', 'mie-goreng', 'sate-ayam', 'gado-gado', 'es-teh', 'es-teh'];
  return recipeById(pick(rng, bag));
}
