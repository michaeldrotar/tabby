# Tabby Chrome Extension Product Roadmap

**Date:** December 19, 2025  
**Author:** Claude Opus 4.5 (Product Owner AI)

---

## Executive Summary

Tabby is a Chrome extension delivering a keyboard-centric vertical tab experience with unified search across tabs, bookmarks, history, and recently closed sessions. After analyzing the codebase, I've identified significant gaps between the current implementation and what power users expect from a premium tab manager. This roadmap prioritizes features that maximize user value while respecting Tabby's core principles: privacy-first architecture, minimal permissions, and keyboard-driven workflows.

---

## Current State Analysis

### Implemented ✅

| Feature                    | Implementation Quality                                                  |
| -------------------------- | ----------------------------------------------------------------------- |
| **Omnibar Search**         | Solid — searches tabs, bookmarks, history, recently closed              |
| **Tab Manager Side Panel** | Basic — displays windows and tabs with group support                    |
| **Keyboard Shortcuts**     | Good — Cmd+E (overlay), Cmd+K (popup), Cmd+Shift+E (side panel)         |
| **Theming**                | Excellent — light/dark modes, 15+ accent colors, per-mode customization |
| **Privacy Architecture**   | Excellent — activeTab permission, sandboxed iframe injection            |
| **Tab Actions**            | Minimal — activate tab, close tab (single tab only)                     |
| **Options Page**           | Good — clean UI for preferences                                         |

### Missing or Incomplete ❌

| Gap                                       | Impact                                 | Competitive Disadvantage     |
| ----------------------------------------- | -------------------------------------- | ---------------------------- |
| **No multi-selection**                    | Cannot perform bulk operations         | Every competitor has this    |
| **No context menus**                      | Hidden actions, undiscoverable         | Standard UX expectation      |
| **No tab group management**               | Can view groups but not create/edit    | Chrome native does this      |
| **No drag-and-drop**                      | Can't reorder or move tabs             | Arc, Sidekick, native Chrome |
| **No pin/mute/discard actions**           | Missing common tab operations          | Basic tab management         |
| **No session save/restore**               | Power users want workspace persistence | Session Buddy, OneTab        |
| **No keyboard navigation in Tab Manager** | Arrow keys don't navigate tabs         | Keyboard-centric claim unmet |
| **Limited Omnibar actions**               | Few browser commands available         | Alfred/Raycast have many     |

---

## Missing Features Ranked by Value

### Tier 1: High Value, High Impact (Must Have)

| Rank | Feature                            | Value      | Effort | Rationale                                                                                                                     |
| ---- | ---------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Multi-Selection & Bulk Actions** | ⭐⭐⭐⭐⭐ | Medium | Unlocks bulk close, move, bookmark. Foundation for many other features. Without this, Tab Manager is just a read-only viewer. |
| 2    | **Context Menus**                  | ⭐⭐⭐⭐⭐ | Medium | Exposes actions discoverably. Right-click is expected. UI already exists in `@extension/ui` (Radix).                          |
| 3    | **Full Keyboard Navigation**       | ⭐⭐⭐⭐⭐ | Low    | Arrow keys, Enter to activate, Space to select. Tabby claims keyboard-centric but Tab Manager lacks this.                     |
| 4    | **Tab Group CRUD**                 | ⭐⭐⭐⭐   | Medium | Create, rename, recolor, ungroup tabs. Chrome's API supports this. Currently display-only.                                    |
| 5    | **Pin/Mute/Discard Actions**       | ⭐⭐⭐⭐   | Low    | Basic tab operations missing. Quick wins via context menu or keyboard shortcuts.                                              |

### Tier 2: Medium Value, Differentiating

| Rank | Feature                      | Value    | Effort | Rationale                                                                               |
| ---- | ---------------------------- | -------- | ------ | --------------------------------------------------------------------------------------- |
| 6    | **Drag-and-Drop Reordering** | ⭐⭐⭐⭐ | High   | Reorder tabs within window, move between windows/groups. Complex but expected.          |
| 7    | **Tab Status Indicators**    | ⭐⭐⭐   | Low    | Show audio playing, muted, discarded, loading states. Visual clarity.                   |
| 8    | **Advanced Omnibar Filters** | ⭐⭐⭐   | Medium | Filter by window, domain, tab state. Prefix syntax like `w:` or `d:github.com`.         |
| 9    | **Session Save/Restore**     | ⭐⭐⭐   | High   | Save current window as named session, restore later. Power user essential.              |
| 10   | **Tab Previews/Thumbnails**  | ⭐⭐⭐   | High   | Visual preview on hover. Uses `chrome.tabs.captureVisibleTab`. Memory overhead concern. |

### Tier 3: Nice to Have, Polish

| Rank | Feature                             | Value | Effort | Rationale                                                                          |
| ---- | ----------------------------------- | ----- | ------ | ---------------------------------------------------------------------------------- |
| 11   | **Customizable Keyboard Shortcuts** | ⭐⭐  | Medium | Options page to remap keys. Chrome's shortcuts page exists but is buried.          |
| 12   | **Duplicate Tab Detection**         | ⭐⭐  | Low    | Highlight or offer to close duplicates. Low effort, nice UX.                       |
| 13   | **Tab Search within Tab Manager**   | ⭐⭐  | Low    | Filter visible tabs in real-time. Already have `SearchPopup` but it opens Omnibar. |
| 14   | **More Omnibar Browser Actions**    | ⭐⭐  | Low    | Clear history, open downloads, incognito window, etc.                              |
| 15   | **Export/Import Tab Lists**         | ⭐⭐  | Medium | Markdown or JSON export. Share tab collections.                                    |
| 16   | **Tab Analytics**                   | ⭐    | High   | Usage stats, time spent per tab. Privacy implications, opt-in only.                |
| 17   | **Extension API**                   | ⭐    | High   | Let other extensions integrate. Future ecosystem play.                             |

---

## Recommended Roadmap

### Phase 1: Foundation for Power Users (v1.4.0)

**Timeline:** 4-6 weeks  
**Theme:** "Make the Tab Manager Actually Useful"

**Features:**

1. **Full Keyboard Navigation**
   - Arrow keys navigate window rail and tab list
   - Enter activates focused item
   - Space toggles selection
   - Tab switches between panes
   - Home/End jump to first/last

2. **Multi-Selection System**
   - Cmd/Ctrl+Click to toggle selection
   - Shift+Click for range select
   - Shift+Arrow for keyboard range select
   - Cmd/Ctrl+A to select all in current list
   - Escape to clear selection
   - Visual selection state (checkboxes or highlight)

3. **Context Menus (Phase 1)**
   - Tab context menu: Close, Close Others, Close to Right, Pin/Unpin, Mute/Unmute
   - Window context menu: Close Window, Close All Tabs
   - Tab Group context menu: Ungroup, Close Group
   - Show keyboard shortcuts in menu items

4. **Tab Status Indicators**
   - Audio playing icon
   - Muted icon
   - Discarded (💤) indicator
   - Loading spinner

**Success Metrics:**

- Tab Manager becomes a functional management tool, not just a viewer
- Keyboard users can accomplish all basic tasks without mouse

---

### Phase 2: Tab Organization (v1.5.0)

**Timeline:** 4-6 weeks  
**Theme:** "Organize Your Chaos"

**Features:**

1. **Tab Group Management**
   - Create new group from selection
   - Add tabs to existing group
   - Remove tabs from group (ungroup)
   - Rename group (inline editing)
   - Change group color (color picker submenu)
   - Collapse/expand group toggle

2. **Bulk Actions**
   - Close selected tabs
   - Move selected tabs to window (submenu with window list)
   - Move selected tabs to new window
   - Pin/Unpin selected tabs
   - Bookmark selected tabs (create folder)

3. **Drag-and-Drop (Basic)**
   - Reorder tabs within a window
   - Move tabs between groups
   - Visual drop indicators

**Success Metrics:**

- Users can reorganize tabs without switching to Chrome's tab strip
- Tab group workflows are fully supported

---

### Phase 3: Search & Discovery (v1.6.0)

**Timeline:** 3-4 weeks  
**Theme:** "Find Anything Faster"

**Features:**

1. **Advanced Omnibar Filters**
   - `w:` prefix to search current window only
   - `d:github.com` to filter by domain
   - `t:` for tabs only, `b:` for bookmarks, `h:` for history
   - `pinned:` to show pinned tabs
   - `audible:` for tabs playing audio

2. **Inline Tab Manager Search**
   - `/` or Cmd+F to filter visible tabs
   - Real-time filtering as you type
   - Highlight matching text

3. **Duplicate Detection**
   - Visual indicator for duplicate URLs
   - "Close Duplicates" action in window context menu

**Success Metrics:**

- Omnibar becomes a true power tool with expert shortcuts
- Finding specific tabs is instant

---

### Phase 4: Persistence & Memory (v1.7.0)

**Timeline:** 6-8 weeks  
**Theme:** "Your Tabs, Your Way"

**Features:**

1. **Session Management**
   - Save current window as named session
   - Save all windows as session
   - Session browser in Tab Manager
   - Restore session (new window or replace current)
   - Auto-save option for crash recovery

2. **Tab Hibernation (Auto-Discard)**
   - Configurable inactivity threshold
   - Whitelist domains to never discard
   - Manual discard via context menu
   - Memory usage estimates (if available)

3. **Drag-and-Drop (Advanced)**
   - Move tabs between windows
   - Create new window by dragging out
   - Merge windows by dragging

**Success Metrics:**

- Power users can save/restore complex workspace configurations
- Memory usage reduced for users with many tabs

---

### Phase 5: Polish & Ecosystem (v2.0.0)

**Timeline:** Ongoing  
**Theme:** "Professional Grade"

**Features:**

1. **Customizable Shortcuts**
   - In-app shortcut configuration
   - Conflict detection
   - Import/export shortcut profiles

2. **Tab Previews**
   - Thumbnail on hover (optional)
   - Cached for performance
   - Privacy-respecting (local only)

3. **Export/Import**
   - Export tabs as Markdown list
   - Export as JSON
   - Import from OneTab format

4. **More Omnibar Actions**
   - Clear browsing data
   - Open Chrome pages (downloads, extensions, history)
   - New incognito window
   - Reopen last closed tab

5. **Visual Refresh**
   - Consider "Gallery" or "Command Center" designs from existing plans
   - Animation polish
   - Accessibility audit

---

## Technical Considerations

### Architecture Decisions

1. **Selection State Management**
   - Add selection state to Zustand store (`@extension/chrome`)
   - Track `Set<tabId>` for selected tabs
   - Clear on window change (default) or persist across windows (configurable)

2. **Context Menu Implementation**
   - Use existing `ContextMenu` from `@extension/ui` (Radix-based)
   - Create `TabContextMenu`, `WindowContextMenu`, `GroupContextMenu` components
   - Wire to Chrome APIs for actions

3. **Drag-and-Drop**
   - Consider `@dnd-kit/core` for React DnD
   - Chrome API: `chrome.tabs.move()`, `chrome.tabs.group()`

4. **Session Storage**
   - Use `chrome.storage.local` for session data
   - Schema: `{ sessions: [{ id, name, windows: [...], createdAt }] }`
   - Consider IndexedDB for large session libraries

### Performance Guardrails

- Virtualize tab lists for windows with 100+ tabs
- Debounce search input (already done)
- Lazy load thumbnails if implemented
- Cache favicon URLs (already done)

### Privacy Principles (Maintain)

- All data stays local
- No external API calls
- No analytics without explicit opt-in
- Session data never leaves device

---

## Risk Assessment

| Risk                            | Likelihood | Impact | Mitigation                                        |
| ------------------------------- | ---------- | ------ | ------------------------------------------------- |
| Drag-and-drop complexity        | High       | Medium | Start with reorder only, defer cross-window later |
| Session storage size limits     | Medium     | Medium | Implement cleanup/archival, warn at threshold     |
| Performance with many tabs      | Medium     | High   | Virtualization from day one for Phase 1           |
| Feature creep                   | High       | Medium | Strict phase boundaries, MVP mentality            |
| Breaking changes to Chrome APIs | Low        | High   | Abstract Chrome calls, test on beta channel       |

---

## Success Metrics

### Quantitative (if measurable)

- Time to find a tab (target: <3 seconds for 50+ tabs)
- Actions per session (indicates engagement)
- Keyboard vs mouse action ratio (target: >60% keyboard for power users)

### Qualitative

- Chrome Web Store rating (target: 4.8+)
- User feedback sentiment
- Feature request volume and themes

---

## Conclusion

Tabby has a strong foundation with excellent privacy architecture and a clean UI, but the Tab Manager is currently a _viewer_ rather than a _manager_. The most impactful work is enabling users to **act** on their tabs—select multiple, close in bulk, reorganize into groups, and do it all from the keyboard.

Phase 1 (keyboard navigation + multi-select + context menus) transforms Tabby from "nice to have" to "can't live without" for power users. Subsequent phases build on this foundation to deliver organization, advanced search, and persistence features that differentiate Tabby from both Chrome's native tools and competing extensions.

The roadmap respects Tabby's core values: privacy-first (all local), keyboard-centric (every action has a shortcut), and clean design (no clutter, progressive disclosure via context menus).
