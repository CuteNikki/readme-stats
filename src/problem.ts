/** Something about a card's link that can't be drawn, said on the card itself with this status */
export class Problem extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
