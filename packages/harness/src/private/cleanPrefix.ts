export default function cleanPrefix(value: string): string {
  return value
    ?.replace(/[^\d\w]/gu, '-')
    .replace(/-{2,}/gu, '-')
    .replace(/^-|-$/gu, '');
}
