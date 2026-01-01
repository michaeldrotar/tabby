import type { ManifestType } from '@extension/shared/utils/types'

export interface IManifestParser {
  convertManifestToString: (
    manifest: ManifestType,
    isFirefox: boolean,
  ) => string
}
