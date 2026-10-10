import type { ManifestType } from '@extension/chrome/manifest'

export interface IManifestParser {
  convertManifestToString: (
    manifest: ManifestType,
    isFirefox: boolean,
  ) => string
}
