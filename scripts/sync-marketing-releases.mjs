import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export const publishedReleaseNotes = (releases) =>
  releases
    .filter((release) => !release.draft && !release.prerelease)
    .map((release) => ({
      version: release.tag_name,
      title: release.name || release.tag_name,
      publishedAt: release.published_at,
      body: release.body ?? '',
    }))
    .sort((a, b) => b.version.localeCompare(a.version, 'en', { numeric: true }))

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const releases = []
  for (let page = 1; ; page++) {
    const response = await fetch(
      `https://api.github.com/repos/michaeldrotar/tabby/releases?per_page=100&page=${page}`,
      { headers: { Accept: 'application/vnd.github+json' } },
    )
    if (!response.ok) {
      throw new Error(`Could not read published releases: ${response.status}`)
    }
    const batch = await response.json()
    releases.push(...batch)
    if (batch.length < 100) break
  }
  const notes = publishedReleaseNotes(releases)
  if (!notes.length) throw new Error('No published releases found')
  await writeFile(
    new URL('../pages/marketing/src/releases.json', import.meta.url),
    `${JSON.stringify(notes, null, 2)}\n`,
  )
  console.log(`Saved ${notes.length} published releases for the marketing site`)
}
