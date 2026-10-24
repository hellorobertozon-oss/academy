export function formatPolishCount(
  count: number,
  singular: string,
  plural: string,
  genitive: string,
): string {
  const absoluteCount = Math.abs(count);
  const lastTwoDigits = absoluteCount % 100;
  const lastDigit = absoluteCount % 10;
  const form = count === 1
    ? singular
    : lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)
      ? plural
      : genitive;

  return `${count} ${form}`;
}
