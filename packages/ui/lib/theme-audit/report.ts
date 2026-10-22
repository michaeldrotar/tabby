import type { ThemeFinding } from './analyze'
import type { ThemeReport } from './measure'

const escapeHTML = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ]!,
  )
export const findingURL = (finding: ThemeFinding, origin: string) => {
  const url = new URL('/', origin)
  url.searchParams.set('theme-lab', '')
  for (const [key, value] of Object.entries(finding.selection))
    url.searchParams.set(key, value)
  url.searchParams.set('sample', finding.sample)
  if (finding.alternative) {
    url.searchParams.set('compare', '')
    for (const [key, value] of Object.entries(finding.alternative))
      url.searchParams.set(`compare-${key}`, value)
  }
  return url.href
}

export const renderThemeReport = (
  report: ThemeReport,
  origin: string,
) => `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tabby theme report</title>
<style>body{font:15px/1.5 system-ui;margin:32px auto;padding:0 20px;max-width:1000px;color:#202536;background:#f5f6f8}h1{font-size:28px}a{color:#5540a2}li{list-style:none;border-bottom:1px solid #d9dce4;padding:16px 0}ul{padding:0}small{display:block;color:#566075}.failure{color:#9a2336}.warning{color:#77540a}.info{color:#566075}code{font-size:13px}.swatches{display:inline-flex;margin-right:8px;vertical-align:middle;border:1px solid #c8cbd2}.swatches i{display:block;width:24px;height:24px}</style>
<h1>Tabby theme report</h1><p>${report.combinations.toLocaleString('en-US')} combinations checked. ${report.findings.filter((finding) => finding.severity === 'failure').length} contrast failures; ${report.findings.filter((finding) => finding.severity === 'warning').length} review suggestions; ${report.findings.filter((finding) => finding.severity === 'info').length} subtle palette pairs.</p>
<p>Contrast checks cover sample titles and details at 4.5:1 and focus rings and selection/active indicators at 3:1. Palette similarity compares the most distinct measured role at OKLab distance below 0.02; hover visibility uses 0.035. Pairs below 0.01 are review suggestions; pairs below 0.02 are informational. Similarity observations are design guidance. Hover changes do not have a blanket 3:1 requirement. Repeated findings are grouped by the colors that affect them; each link loads a representative combination.</p>
<ul>${report.findings.map((finding) => `<li><strong class="${finding.severity}">${finding.severity === 'failure' ? 'Low contrast' : finding.kind === 'similarity' ? (finding.severity === 'info' ? 'Subtle palettes' : 'Near duplicates') : 'Weak state change'}</strong><br><span class="swatches">${finding.colors.map((color) => `<i style="background:rgb(${color[0]} ${color[1]} ${color[2]} / ${color[3]})"></i>`).join('')}</span><a href="${escapeHTML(findingURL(finding, origin))}">${escapeHTML(finding.message)}</a><small>${finding.kind === 'contrast' ? `${finding.value.toFixed(2)}:1 / ${finding.threshold}:1 required` : `Color difference ${(finding.value * 100).toFixed(2)} / target ${(finding.threshold * 100).toFixed(1)}`}${finding.affectedCombinations ? ` · ${finding.affectedCombinations.toLocaleString('en-US')} combinations` : ''} · ${escapeHTML(`${finding.selection.mode}; ${finding.selection.background} background; ${finding.selection.foreground} foreground; ${finding.selection.accent} accent`)}</small></li>`).join('')}</ul></html>`
