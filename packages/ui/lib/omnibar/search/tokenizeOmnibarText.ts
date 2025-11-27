export const tokenizeOmnibarText = (text: string): string[] => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .split(/[\s\-/ _]+|(?<!\d)\.|\.(?!\d)/)
    .filter((t) => t.length > 0)
}
