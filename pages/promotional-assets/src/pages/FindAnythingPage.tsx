import { PromoFrame } from '../components/PromoFrame'
import { PromoOmnibar } from '../components/PromoOmnibar'
import {
  PromoBody,
  PromoEyebrow,
  PromoFootnote,
  PromoHeadline,
} from '../components/PromoText'
import { findAnythingResults } from '../data/findAnythingResults'

export const FindAnythingPage = () => (
  <PromoFrame>
    <div className="promo-layout">
      <section className="promo-copy">
        <PromoEyebrow>No more hunting through tabs</PromoEyebrow>
        <PromoHeadline>
          Find anything,
          <br />
          from one place.
        </PromoHeadline>
        <PromoBody>
          Search windows, open tabs, bookmarks, recently closed pages, and
          history in seconds. Jump back to what you need, or open a fresh result
          just as easily.
        </PromoBody>
        <PromoFootnote>A few keystrokes get you there.</PromoFootnote>
      </section>

      <section className="search-stage" aria-label="Search across Chrome">
        <div className="search-card">
          <PromoOmnibar
            surfaceClassName="search-surface"
            query="inbox"
            results={findAnythingResults}
          />
        </div>
      </section>
    </div>
  </PromoFrame>
)
