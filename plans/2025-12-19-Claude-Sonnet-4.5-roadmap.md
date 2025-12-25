# Tabby Chrome Extension Product Roadmap

**Date:** December 19, 2025  
**Author:** Claude Sonnet 4.5 (Product Owner AI)  
**Current Version:** 1.3.0

## Checklist

### Phase 1: Power User Essentials (Q1 2026)

- [ ] Context Menus & Bulk Actions (P0)
- [ ] Tab Group Management (P0)
- [ ] Advanced Search & Filtering (P1)
- [ ] Tab Sorting & Organization (P1)

### Phase 2: Efficiency & Automation (Q2 2026)

- [ ] Keyboard Shortcut Customization (P0)
- [ ] Tab Hibernation / Auto-Discard (P1)
- [ ] Session Management (P1)
- [ ] Duplicate Tab Detection (P2)

### Phase 3: Premium Experience (Q3 2026)

- [ ] Tab Previews / Thumbnails (P2)
- [ ] Pin/Unpin Management (P2)
- [ ] Window Management (P2)
- [ ] Tab Muting Controls (P2)

### Phase 4: Advanced Features (Q4 2026)

- [ ] Tab Notes & Annotations (P3)
- [ ] Tab Analytics & Insights (P3)
- [ ] Reading List Integration (P3)

## Executive Summary

Tabby is a privacy-first Chrome extension that provides a superior vertical tab management experience and powerful universal search. Built with React 19, TypeScript, and modern web technologies, it offers keyboard-centric navigation and local-only processing that respects user privacy.

This roadmap identifies high-value missing features and prioritizes them based on user impact, competitive differentiation, and alignment with Tabby's core values: privacy, performance, and power-user productivity.

---

## Current State Analysis

### ✅ Implemented Features

**Omnibar (Universal Search)**

- Unified search across tabs, bookmarks, history, and recently closed items
- Web search integration (Google)
- Direct URL navigation
- Browser command shortcuts
- Smart query persistence
- Keyboard modifiers (Cmd/Ctrl for new tab, Shift for new window)
- Three access modes: overlay (Cmd+E), popup (Cmd+K), side panel integration

**Tab Manager**

- Vertical tab list in Chrome's native side panel (Cmd+Shift+E)
- Multi-window support with window rail navigation
- Tab group visualization (collapsed/expanded states with colors)
- Keyboard navigation (arrow keys, Enter to activate)
- Visual indicators for active, discarded, and highlighted tabs
- Compact icon mode and layout density options
- Target button (jump to current window/tab)
- Integrated search popup

**Theming & Personalization**

- System/Light/Dark mode support
- 15+ accent color palettes
- Customizable neutral color schemes
- Adjustable accent strength
- Per-mode theme preferences
- Consistent theming across all surfaces

**Architecture**

- Privacy-first: all processing local, no external servers
- Secure iframe injection with sandboxed UI
- Minimal permissions (activeTab only when invoked)
- Monorepo structure with shared packages
- Modern tech stack (React 19, TypeScript, Vite, TanStack Query, Tailwind CSS)

### ❌ Missing Features & Gaps

Based on competitive analysis, user needs assessment, and power-user workflows, the following features are notably absent:

---

## Missing Features Ranked by Value

### 🔴 Critical Priority (P0) - Core Functionality Gaps

#### 1. **Context Menus & Bulk Actions**

**Value Score: 10/10**

**Why Critical:**

- Power users with 50+ tabs need to manage multiple tabs at once
- Right-click is muscle memory for experienced users
- Without bulk actions, Tabby requires one-by-one operations that don't scale
- Competitive extensions (Tab Wrangler, One Tab) have this as baseline

**Required Features:**

- Right-click context menu on tabs (Close, Pin, Move to Group, Move to Window, Bookmark, Duplicate, Mute/Unmute)
- Right-click on tab groups (Close Group, Rename, Change Color, Ungroup)
- Right-click on windows (Close Window, Move All Tabs, Bookmark All)
- Multi-select with Cmd/Ctrl+Click and Shift+Click
- Bulk operations on selected items
- Context menu in both Tab Manager and Omnibar results

**Technical Notes:**

- ContextMenu components already exist in `@extension/ui`
- See `plans/tab-manager-functionality.md` for detailed interaction spec

---

#### 2. **Tab Group Management**

**Value Score: 9/10**

**Why Critical:**

- Chrome's native tab groups are popular but awkward to manage
- Users need to create, edit, and reorganize groups without leaving Tabby
- Currently read-only, which limits Tabby's utility vs built-in Chrome UI

**Required Features:**

- Create new tab group from selected tabs
- Rename tab group inline or via context menu
- Change tab group color picker
- Move tabs between groups (drag-drop and context menu)
- Ungroup tabs (remove from group)
- Move entire groups between windows
- Collapse/expand groups (currently works, but needs better visual affordance)

**Technical Notes:**

- `chrome.tabGroups` API already available
- Components exist: `TabListGroup` in `@extension/ui`
- Needs mutation hooks in `@extension/chrome` package

---

#### 3. **Keyboard Shortcut Customization**

**Value Score: 8/10**

**Why Critical:**

- Default shortcuts conflict with other apps (especially Cmd+E)
- Power users want personalized keybindings
- Essential for accessibility and international keyboards

**Required Features:**

- Customizable keyboard shortcuts in Options page
- Conflict detection with Chrome and other extensions
- Reset to defaults option
- Visual keyboard shortcut picker UI
- Support for sequences (e.g., Ctrl+K, Ctrl+S)
- Export/import shortcut profiles

**Technical Notes:**

- Chrome limits command shortcut customization via `chrome.commands` API
- May need to implement custom key handler for in-app shortcuts
- Consider preset profiles (Vim-style, Emacs-style, VSCode-style)

---

### 🟠 High Priority (P1) - Productivity Enhancers

#### 4. **Advanced Search & Filtering**

**Value Score: 8/10**

**Why Important:**

- Users with many tabs/bookmarks struggle to find specific items
- Domain-based search (e.g., "github.com tabs") is common workflow
- Filtering by state (pinned, muted, discarded) helps triage

**Required Features:**

- Search syntax: `domain:github.com`, `type:tab`, `type:bookmark`, `state:pinned`
- Filter dropdown in Omnibar (checkboxes for Tabs, Bookmarks, History, Closed)
- Quick filter buttons in Tab Manager sidebar
- Save recent searches
- Search within specific window
- Exclude patterns (e.g., `-domain:youtube.com`)

**Technical Notes:**

- Extend `useOmnibarFiltering` hook
- Add filter UI to `OmnibarInput` component
- Consider fuzzy matching library for typo tolerance

---

#### 5. **Tab Sorting & Organization**

**Value Score: 7/10**

**Why Important:**

- Automatic organization reduces cognitive load
- Grouping by domain reveals duplicate tabs
- Time-based sorting helps prioritize work

**Required Features:**

- Sort tabs by: Title (A-Z), Domain, Last Accessed, Creation Time
- Auto-group by domain (move all github.com tabs together)
- Smart sorting: keep pinned tabs first, preserve groups
- Undo sort action
- Per-window sorting (don't affect other windows)
- Option to sort on window open

**Technical Notes:**

- Implement via `chrome.tabs.move()` API
- Needs undo/redo stack for multi-tab operations
- Consider debouncing auto-sort to avoid performance issues

---

#### 6. **Tab Hibernation / Auto-Discard**

**Value Score: 7/10**

**Why Important:**

- Memory usage is top complaint for tab hoarders
- Chrome has native discard but no UI control
- Intelligent auto-discard saves resources without losing tabs

**Required Features:**

- Auto-discard tabs after X minutes of inactivity (user configurable)
- Whitelist specific domains (never discard)
- Manual discard button (context menu + keyboard shortcut)
- Visual indicator for discarded tabs (already shows in Tab Manager)
- Restore with single click
- Memory usage dashboard

**Technical Notes:**

- Use `chrome.tabs.discard()` API
- Track tab activity via `chrome.tabs.onActivated` and `chrome.tabs.onUpdated`
- Store preferences in `@extension/storage`
- Consider using `chrome.idle` API for system idle detection

---

#### 7. **Session Management**

**Value Score: 7/10**

**Why Important:**

- Users need to switch contexts (work, personal, research)
- Accidental window closes are catastrophic without session save
- Competitive extensions (Session Buddy, OneTab) are popular for this

**Required Features:**

- Save current session (all windows + tabs)
- Name and tag sessions
- Restore session (as new window or replace current)
- Auto-save on window close
- Session templates (e.g., "Morning Routine", "Research Mode")
- Browse saved sessions in Omnibar
- Export sessions to JSON/Markdown

**Technical Notes:**

- Store in `chrome.storage.local` (5MB limit, may need compression)
- Use `chrome.sessions` API for recently closed items
- Consider cloud sync via `chrome.storage.sync` (opt-in, requires new permission)
- Privacy: ensure no sensitive data leakage in exports

---

### 🟡 Medium Priority (P2) - Quality of Life

#### 8. **Tab Previews / Thumbnails**

**Value Score: 6/10**

**Why Useful:**

- Visual recognition faster than reading titles
- Helps distinguish similar tabs (e.g., multiple GitHub PRs)
- Adds "premium" feel to Tab Manager

**Required Features:**

- Thumbnail preview on hover in Tab Manager
- Cached screenshots (auto-refresh on focus)
- Preview in Omnibar search results (optional, toggle in settings)
- Lazy loading for performance
- Privacy mode: disable thumbnails for incognito or specific domains

**Technical Notes:**

- Use `chrome.tabs.captureVisibleTab()` API
- Store in IndexedDB (larger than chrome.storage)
- Implement LRU cache with size limits
- Consider WebP compression for storage efficiency
- See `plans/design-tab-manager-improvements.md` Plan A for visual mockup

---

#### 9. **Duplicate Tab Detection**

**Value Score: 6/10**

**Why Useful:**

- Users frequently open same page multiple times
- Reduces clutter and memory usage
- Low-friction quality-of-life improvement

**Required Features:**

- Automatic detection of exact URL duplicates
- Visual indicator (icon badge) on duplicate tabs
- Quick action to close all duplicates except one
- Option to auto-close duplicates on open
- Whitelist domains (some apps need multiple tabs)
- Fuzzy duplicate detection (same page, different query params)

**Technical Notes:**

- Hook into `chrome.tabs.onCreated` and `chrome.tabs.onUpdated`
- Compare normalized URLs (strip tracking params)
- Consider maintaining in-memory tab registry for fast lookup

---

#### 10. **Pin/Unpin Management**

**Value Score: 5/10**

**Why Useful:**

- Pinned tabs are important for workflow but awkward to manage
- Power users want bulk pin/unpin
- Visual grouping of pinned tabs

**Required Features:**

- Pin/unpin via context menu
- Keyboard shortcut for pin toggle (e.g., Cmd+Shift+P)
- Bulk pin selected tabs
- Separate pinned tabs section in Tab Manager
- Quick filter for "show only pinned"
- Auto-pin specific domains (optional)

**Technical Notes:**

- Use `chrome.tabs.update(tabId, { pinned: true/false })`
- Pinned tabs always first in tab order (Chrome enforces)
- Consider visual separator in `TabList` component

---

#### 11. **Window Management**

**Value Score: 5/10**

**Why Useful:**

- Users juggle multiple projects across windows
- Moving tabs between windows is tedious in Chrome
- Naming windows helps context switching

**Required Features:**

- Move selected tabs to another window (context menu)
- Merge windows (move all tabs from one window to another)
- Split window (create new window with selected tabs)
- Name windows (store in extension, not Chrome - Chrome doesn't support)
- Window presets (e.g., "Work Setup": 2 windows with specific tabs)
- Minimize/maximize window from Tab Manager

**Technical Notes:**

- Use `chrome.tabs.move()` for cross-window moves
- Window names stored in `chrome.storage` keyed by window ID
- Need to handle window ID reuse (closed windows)
- Consider icons or emojis for window labels

---

#### 12. **Tab Muting Controls**

**Value Score: 4/10**

**Why Useful:**

- Audio tabs are distracting
- Quick mute all or mute by domain
- Currently requires finding tab in Chrome's native UI

**Required Features:**

- Mute/unmute via context menu
- Keyboard shortcut for mute toggle
- Bulk mute selected tabs
- Audio indicator icon in Tab Manager (🔊)
- Quick action: "Mute all tabs except this"
- Auto-mute specific domains

**Technical Notes:**

- Use `chrome.tabs.update(tabId, { muted: true/false })`
- Hook `chrome.tabs.onUpdated` to reflect mute state changes
- Audio state available in `tab.audible` and `tab.mutedInfo`

---

### 🟢 Low Priority (P3) - Nice to Have

#### 13. **Tab Notes & Annotations**

**Value Score: 4/10**

**Why Nice:**

- Research workflows benefit from note-taking
- Differentiates Tabby from minimalist competitors

**Required Features:**

- Add text note to any tab (right-click → Add Note)
- Notes visible in Tab Manager (tooltip or inline)
- Search notes in Omnibar
- Export notes with session

**Technical Notes:**

- Store in `chrome.storage.local` keyed by tab ID or URL
- Need to handle tab ID reuse (closed/reopened tabs)
- Consider rich text editor (Markdown support)

---

#### 14. **Tab Analytics & Insights**

**Value Score: 3/10**

**Why Nice:**

- Quantified self users want usage data
- Helps identify time sinks
- Privacy-respecting implementation possible

**Required Features:**

- Dashboard in Options: total tabs, most visited domains, time spent per site
- Tab heatmap (which hours have most tabs open)
- Recommendations: "You have 20 GitHub tabs, consider closing some"
- Export stats as JSON/CSV
- Opt-in only (disabled by default)

**Technical Notes:**

- Track via `chrome.tabs.onActivated` and `chrome.tabs.onUpdated`
- Store aggregated data only (no individual URLs for privacy)
- Consider privacy-preserving analytics (differential privacy)

---

#### 15. **Reading List Integration**

**Value Score: 3/10**

**Why Nice:**

- Offload "read later" tabs to reduce clutter
- Chrome has native Reading List but no extension API

**Required Features:**

- Mark tab as "Read Later" (context menu)
- Dedicated Reading List view in Tab Manager
- Integration with Chrome's native Reading List (if API available)
- Fallback: custom bookmarks folder

**Technical Notes:**

- Chrome Reading List has no extension API currently
- Implement as custom bookmark folder tagged "reading-list"
- Use `chrome.bookmarks` API

---

#### 16. **Workspace Sync**

**Value Score: 2/10**

**Why Low Priority:**

- Conflicts with privacy-first philosophy
- Requires backend infrastructure or cloud permission
- Chrome Sync already handles some of this

**Required Features:**

- Opt-in sync of sessions, preferences, window names across devices
- End-to-end encryption (user provides passphrase)
- Sync via Chrome Sync API (no external server)

**Technical Notes:**

- Use `chrome.storage.sync` API (100KB limit)
- Requires `storage` permission (already have)
- Consider compression for session data
- **Privacy Risk:** Must be fully transparent and opt-in

---

#### 17. **Extension API for Integrations**

**Value Score: 2/10**

**Why Low Priority:**

- Small potential user base (developers)
- Maintenance burden for API stability

**Required Features:**

- Expose public API for other extensions
- Open tab in group, search tabs, trigger session restore
- Event hooks (onTabOpened, onSessionSaved)

**Technical Notes:**

- Use `chrome.runtime.sendMessage()` for cross-extension communication
- Document API on GitHub wiki
- Version API to avoid breaking changes

---

## Roadmap Timeline & Phases

### **Phase 1: Power User Essentials** (Q1 2026)

**Theme:** Make Tabby indispensable for heavy tab users

**Deliverables:**

- [ ] Context Menus & Bulk Actions (P0)
- [ ] Tab Group Management (P0)
- [ ] Advanced Search & Filtering (P1)
- [ ] Tab Sorting & Organization (P1)

**Success Metrics:**

- 50% of users with 100+ tabs use bulk actions weekly
- Tab group operations account for 20% of all tab actions
- Advanced search adoption rate >40%
- Chrome Web Store rating >4.5★

**Risk Mitigation:**

- Extensive user testing for context menu discoverability
- Performance testing with 500+ tabs
- Keyboard shortcut conflicts testing across popular extensions

---

### **Phase 2: Efficiency & Control** (Q2 2026)

**Theme:** Save time and memory

**Deliverables:**

- [ ] Keyboard Shortcut Customization (P0)
- [ ] Tab Hibernation / Auto-Discard (P1)
- [ ] Session Management (P1)
- [ ] Duplicate Tab Detection (P2)

**Success Metrics:**

- 30% of users customize at least one shortcut
- Average memory usage reduced by 25% with hibernation
- 60% of users save at least one session
- Duplicate detection closes 5+ tabs per user per week

**Risk Mitigation:**

- Session data compression to stay under storage limits
- Clear UI for hibernation settings (avoid confusion)
- Graceful degradation if storage quota exceeded

---

### **Phase 3: Premium Experience** (Q3 2026)

**Theme:** Polish and differentiation

**Deliverables:**

- [ ] Tab Previews / Thumbnails (P2)
- [ ] Pin/Unpin Management (P2)
- [ ] Window Management (P2)
- [ ] Tab Muting Controls (P2)

**Success Metrics:**

- Tab preview usage >50% of users
- Window naming adopted by 40% of multi-window users
- Pin management via keyboard shortcuts >20% adoption
- Zero performance regressions with thumbnails

**Risk Mitigation:**

- Thumbnail privacy controls (disable for incognito/sensitive sites)
- Cache size limits to avoid bloat
- Lazy loading for preview generation

---

### **Phase 4: Advanced Features** (Q4 2026)

**Theme:** Niche but powerful capabilities

**Deliverables:**

- [ ] Tab Notes & Annotations (P3)
- [ ] Tab Analytics & Insights (P3)
- [ ] Reading List Integration (P3)

**Success Metrics:**

- Note-taking adopted by 10% of users (acceptable for niche feature)
- Analytics dashboard viewed by 25% of users
- Reading List moves 50+ tabs per user out of active tabs

**Risk Mitigation:**

- Clear privacy policy for analytics
- Opt-in by default for all tracking features
- Storage limit warnings for notes

---

## Competitive Positioning

### Key Differentiators After Roadmap

1. **Privacy**: Only tab manager with zero data collection
2. **Performance**: Sub-100ms search, virtualized lists for 1000+ tabs
3. **Integration**: Native Chrome side panel, sandboxed security
4. **Power User Focus**: Advanced bulk actions, session management, customization
5. **Modern UX**: Themeable, keyboard-first, beautiful design

### Competitive Analysis

| Feature                | Tabby (Post-Roadmap) | Tab Wrangler | OneTab | Native Chrome |
| ---------------------- | -------------------- | ------------ | ------ | ------------- |
| Vertical Tab List      | ✅                   | ❌           | ❌     | ✅            |
| Universal Search       | ✅                   | ❌           | ❌     | ❌            |
| Bulk Actions           | ✅ (Phase 1)         | ✅           | ✅     | ❌            |
| Session Management     | ✅ (Phase 2)         | ❌           | ✅     | ❌            |
| Tab Hibernation        | ✅ (Phase 2)         | ✅           | ❌     | ✅            |
| Privacy (Local Only)   | ✅                   | ✅           | ✅     | ✅            |
| Custom Themes          | ✅                   | ❌           | ❌     | ❌            |
| Tab Previews           | ✅ (Phase 3)         | ❌           | ❌     | ❌            |
| Tab Group Management   | ✅ (Phase 1)         | ❌           | ❌     | ✅            |
| Keyboard Customization | ✅ (Phase 2)         | ❌           | ❌     | ❌            |

---

## Technical Considerations

### Architecture Priorities

1. **Performance**: Maintain <100ms search latency even with 1000+ tabs
2. **Bundle Size**: Keep total extension under 2MB (currently ~500KB)
3. **Memory**: Efficient rendering with virtualized lists (react-window)
4. **Offline-First**: All features work without network
5. **Privacy**: No external API calls except user-initiated web search

### Technology Decisions

- **State Management**: Continue using Zustand for browser store
- **Querying**: TanStack Query for async Chrome API calls
- **Virtualization**: Implement react-window for Tab Manager (Phase 1)
- **Storage**: IndexedDB for thumbnails, chrome.storage.local for settings
- **Testing**: Vitest + Testing Library, aim for >80% coverage on new features

### Performance Benchmarks

- Tab Manager render: <50ms for 100 tabs, <200ms for 1000 tabs
- Omnibar search: <100ms for 10,000 items (tabs + bookmarks + history)
- Context menu open: <16ms (1 frame at 60fps)
- Memory usage: <50MB idle, <100MB with thumbnails

---

## Success Metrics & KPIs

### User Engagement

- **Daily Active Users (DAU)**: Target 10K by end of Phase 2
- **Weekly Active Users (WAU)**: Target 25K by end of Phase 3
- **Session Duration**: >5 minutes per session (indicates deep usage)
- **Tab Manager Opens**: 5+ per day per power user

### Product Quality

- **Chrome Web Store Rating**: Maintain >4.5★
- **Crash-Free Sessions**: >99.5%
- **Performance Score**: >95 on Chrome DevTools Performance panel
- **Memory Efficiency**: <100MB for 1000 tabs (excluding page content)

### Feature Adoption

- **Bulk Actions**: 60% of users (Phase 1)
- **Tab Groups**: 40% of users (Phase 1)
- **Sessions**: 50% of users (Phase 2)
- **Hibernation**: 70% of users with 50+ tabs (Phase 2)
- **Thumbnails**: 50% of users (Phase 3)

### Business Impact

- **7-Day Retention**: >60%
- **30-Day Retention**: >40%
- **90-Day Retention**: >30%
- **User Referrals**: 10% of new users from referrals

---

## User Personas & Use Cases

### Persona 1: "The Researcher" (Primary Target)

**Profile:** Academic, journalist, or curious generalist with 100+ tabs open. Tabs span days of research, multiple topics, often forgotten.

**Pain Points:**

- Can't find that tab from yesterday
- Tabs use too much memory, browser slows down
- Afraid to close tabs (might need them later)

**Key Features:**

- Universal search (find tabs by vague memory)
- Session management (save research project, resume later)
- Tab hibernation (keep tabs but save memory)
- Tab notes (remember why this tab is important)

---

### Persona 2: "The Developer" (Secondary Target)

**Profile:** Software engineer with 50+ tabs: documentation, GitHub PRs, Stack Overflow, localhost servers.

**Pain Points:**

- Need to switch between work contexts (different projects)
- Many duplicate docs tabs (React docs open 5 times)
- Want keyboard shortcuts for everything

**Key Features:**

- Keyboard shortcut customization
- Bulk actions (close all StackOverflow tabs at once)
- Tab groups by project
- Domain-based search and sorting

---

### Persona 3: "The Multitasker" (Secondary Target)

**Profile:** Project manager, consultant, or freelancer juggling multiple clients/projects across different windows.

**Pain Points:**

- Hard to visualize which window has which project
- Accidentally close wrong window
- Need to quickly switch between client contexts

**Key Features:**

- Window naming
- Multi-window overview in Tab Manager
- Session templates (e.g., "Client A Meeting" preset)
- Move tabs between windows easily

---

## Open Questions & Future Exploration

1. **Tab Collaboration:** Could users share sessions/tab lists with team members? (Requires cloud sync, conflicts with privacy)
2. **AI Integration:** Smart tab suggestions ("You might want to close these 10 old tabs")? (Requires local ML model or external API)
3. **Cross-Browser Support:** Firefox/Edge/Safari ports? (Different APIs, significant effort)
4. **Mobile Companion:** Android/iOS app to sync tabs? (Outside extension scope)
5. **Monetization:** Premium features (cloud sync, advanced analytics) behind paid tier? (Conflicts with open-source spirit)
6. **Accessibility:** Screen reader support, high-contrast mode improvements? (Should be baseline, not optional)

---

## Conclusion

This roadmap transforms Tabby from a solid tab manager into the **definitive power-user tool for Chrome tab management**. By focusing on context menus, bulk actions, and session management in Phase 1-2, we address the most critical gaps that prevent users from abandoning native Chrome or competitors.

The phased approach ensures steady progress with measurable outcomes, while maintaining Tabby's core values:

- **Privacy-First:** All processing local, zero data collection
- **Performance:** Fast, efficient, scales to 1000+ tabs
- **Keyboard-Centric:** Power users never need to touch mouse
- **Beautiful:** Modern, themeable, delightful to use

By the end of 2026, Tabby will be the must-have extension for anyone who takes tab management seriously.

---

**Next Steps:**

1. Review roadmap with maintainers/community
2. Create GitHub issues for Phase 1 features
3. Prioritize Phase 1 items by technical complexity
4. Begin user research interviews with "Researcher" and "Developer" personas
5. Update `RELEASE.md` with roadmap integration into release process
