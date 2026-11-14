// fontkit 3 ships without types: just the part the cards use

declare module 'fontkit' {
  export interface Font {
    unitsPerEm: number;
    /** In font units: above the baseline */
    ascent: number;
    /** In font units: below the baseline, negative */
    descent: number;
    capHeight: number;
    layout(text: string): { advanceWidth: number };
  }

  export function create(buffer: Buffer): Font;
}
