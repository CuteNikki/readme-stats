// The font a card is drawn in. GitHub shows cards as <img>, which can't load a
// font from anywhere, so each card carries the faces it uses inside it, and
// every width on a card is measured from the font's own glyphs: text is fitted,
// wrapped and lined up the same in any font, monospaced or not.

import { create, type Font as Glyphs } from 'fontkit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Weight = 400 | 500 | 700 | 800;
export const WEIGHTS: readonly Weight[] = [400, 500, 700, 800];

export interface Face {
  /** The woff2 file, as base64 for a data: URL */
  base64: string;
  glyphs: Glyphs;
}

export function face(file: Buffer): Face {
  return { base64: file.toString('base64'), glyphs: create(file) };
}

/** The weight that's there closest to the one asked for, a heavier one on a tie */
function nearest(weight: Weight, have: Weight[]) {
  return have.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) || (Math.abs(w - weight) === Math.abs(best - weight) && w > best) ? w : best));
}

/** Widths measured so far, per font: the same labels come up on every card */
const MAX_MEASURED = 5000;

export class Font {
  private readonly measured = new Map<string, number>();
  private readonly have: Weight[];

  constructor(
    /** The family name, as the card's CSS calls it */
    readonly name: string,
    private readonly faces: Partial<Record<Weight, Face>>,
    /** What a reader's browser falls back to for a character the font doesn't have */
    readonly generic: 'monospace' | 'sans-serif' | 'serif',
  ) {
    this.have = WEIGHTS.filter((w) => faces[w]);
    if (this.have.length === 0) throw new Error(`${name} has no faces`);
  }

  private face(weight: Weight) {
    return this.faces[weight] ?? this.faces[nearest(weight, this.have)]!;
  }

  /** The CSS font-family list for the card */
  get family() {
    return `'${this.name}', ${this.generic}`;
  }

  /** How far the font reaches above and below the baseline, and its capitals' height, per 1px of size */
  get metrics() {
    const { glyphs } = this.face(400);
    return { ascent: glyphs.ascent / glyphs.unitsPerEm, descent: -glyphs.descent / glyphs.unitsPerEm, capHeight: glyphs.capHeight / glyphs.unitsPerEm };
  }

  /** How wide text is drawn, letter-spacing after each character included, the way browsers add it */
  width(text: string, size: number, weight: Weight = 400, spacing = 0) {
    const key = `${weight} ${text}`;
    let em = this.measured.get(key);
    if (em === undefined) {
      const { glyphs } = this.face(weight);
      em = glyphs.layout(text).advanceWidth / glyphs.unitsPerEm;
      if (this.measured.size >= MAX_MEASURED) this.measured.clear();
      this.measured.set(key, em);
    }
    return em * size + spacing * [...text].length;
  }

  /** Shortens text to fit a width, ending it with an ellipsis */
  fit(text: string, size: number, width: number, weight: Weight = 400, spacing = 0) {
    if (this.width(text, size, weight, spacing) <= width) return text;
    const chars = [...text];
    for (let n = chars.length - 1; n > 0; n--) {
      const cut = `${chars.slice(0, n).join('').trimEnd()}…`;
      if (this.width(cut, size, weight, spacing) <= width) return cut;
    }
    return '…';
  }

  /** Breaks text into lines that fit a width, the last one ellipsised */
  wrap(text: string, size: number, width: number, maxLines: number, weight: Weight = 400) {
    const lines: string[] = [];
    for (const word of text.split(/\s+/).filter(Boolean)) {
      const last = lines.at(-1);
      if (last !== undefined && this.width(`${last} ${word}`, size, weight) <= width) lines[lines.length - 1] = `${last} ${word}`;
      else lines.push(word);
    }
    if (lines.length <= maxLines) return lines.map((line) => this.fit(line, size, width, weight));
    // Too long: the last line that's shown takes the rest, cut off
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = this.fit(lines.slice(maxLines - 1).join(' '), size, width, weight);
    return kept;
  }

  /**
   * @font-face rules for the weights a card uses. A weight the font doesn't
   * have gets the nearest face it does, so the browser doesn't fake a bold
   * the measuring didn't know about.
   */
  css(weights: Weight[]) {
    const byFace = new Map<Weight, Weight[]>();
    for (const w of new Set(weights)) {
      const from = this.faces[w] ? w : nearest(w, this.have);
      byFace.set(from, [...(byFace.get(from) ?? []), w]);
    }
    return [...byFace]
      .map(([from, uses]) => {
        const range = uses.length > 1 ? `${Math.min(...uses)} ${Math.max(...uses)}` : uses[0];
        return `@font-face{font-family:'${this.name}';font-weight:${range};src:url(data:font/woff2;base64,${this.faces[from]!.base64}) format('woff2')}`;
      })
      .join('');
  }
}

const bundled = (file: string) => face(readFileSync(join(import.meta.dir, '..', 'fonts', file)));

/** The default, cut down to Latin (~13 KB a weight), in fonts/ */
export const jetbrainsMono = new Font(
  'JetBrains Mono',
  {
    400: bundled('JetBrainsMono-Regular.woff2'),
    500: bundled('JetBrainsMono-Medium.woff2'),
    700: bundled('JetBrainsMono-Bold.woff2'),
    800: bundled('JetBrainsMono-ExtraBold.woff2'),
  },
  'monospace',
);
