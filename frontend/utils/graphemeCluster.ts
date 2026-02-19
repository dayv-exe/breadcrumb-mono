import GraphemeSplitter from "grapheme-splitter";

const splitter = new GraphemeSplitter()

export function countVisibleCharacters(text: string): number {
  return splitter.countGraphemes(text)
}

export function containsOnlyEmojis(input: string): boolean {
  // remove all whitespace (space, tab, newline, etc.)
  const s = input.replace(/\s+/g, "");
  if (!s) return false;

  // One-or-more emoji grapheme sequences, nothing else
  const emojiRegex =
    /^(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)+$/u;

  return emojiRegex.test(s);
}
