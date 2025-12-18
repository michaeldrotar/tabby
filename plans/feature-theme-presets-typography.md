# Theme Presets & Typography System

**Status**: Planning  
**Priority**: High  
**Estimated Effort**: 5 days  
**Created**: 2025-12-17

## Overview

Expand Tabby's theming system with a preset-first approach that makes it easy for users to apply curated themes, customize them, and save/share their own combinations. Add typography controls (font family and line height) to enhance personalization.

## Goals

1. **Presets-first UX**: Users start with curated themes and can customize from there
2. **Live updates**: All changes reflect immediately across the extension
3. **Shareable themes**: Users can export and import theme configurations
4. **Typography control**: Font family and line height options for personalization
5. **Simple but powerful**: High-impact features with low complexity

## Core Philosophy

- Start simple with presets dropdown
- Show "Custom" when user modifies any setting
- Save custom combinations as personal presets
- Share themes via URL or JSON export
- Keep the delightful "Randomize" button

---

## Data Structures

### Theme Preset Interface

```typescript
interface ThemePreset {
  id: string // UUID for custom, static for built-in
  name: string // Display name
  author?: string // 'built-in' | 'local' | user identifier
  lightMode: {
    background: ThemeNeutralPalette
    foreground: ThemeNeutralPalette
    accent: ThemeAccentPalette
    accentStrength: number
  }
  darkMode: {
    background: ThemeNeutralPalette
    foreground: ThemeNeutralPalette
    accent: ThemeAccentPalette
    accentStrength: number
  }
  typography: {
    fontFamily: FontFamily
    lineHeight: LineHeight
  }
}

type FontFamily = 'system' | 'rounded' | 'mono' | 'serif' | 'display' | 'custom'
type LineHeight = 'tight' | 'normal' | 'relaxed'
```

### Storage Schema Changes

Add to `PreferenceStateType`:

```typescript
interface PreferenceStateType {
  // ... existing fields

  // Preset management
  activePresetId?: string // null/undefined = custom/modified
  customPresets: ThemePreset[] // User-saved themes

  // Typography
  fontFamily: FontFamily // Default: 'system'
  lineHeight: LineHeight // Default: 'normal'
  customFontFamily?: string // Raw CSS font-family when fontFamily='custom'
  customFontUrl?: string // Optional Google Fonts URL for custom fonts

  // Optional: Custom accent color
  accentCustomColor?: string // Hex format like "#ff6b35"
}
```

### Default Values

```typescript
const PREFERENCE_DEFAULTS = {
  // ... existing defaults
  activePresetId: 'default',
  customPresets: [],
  fontFamily: 'system',
  lineHeight: 'normal',
}
```

---

## Built-in Presets

Create 8-10 curated theme presets that showcase different aesthetic directions:

### Preset Examples

1. **Tabby Classic** (default)
   - Light: stone bg, neutral fg, amber accent (15%)
   - Dark: neutral bg, zinc fg, blue accent (15%)
   - Typography: system, normal

2. **Ocean Breeze**
   - Light: slate bg, zinc fg, cyan accent (20%)
   - Dark: slate bg, zinc fg, sky accent (25%)
   - Typography: system, relaxed

3. **Forest**
   - Light: stone bg, neutral fg, green accent (20%)
   - Dark: zinc bg, neutral fg, emerald accent (20%)
   - Typography: system, normal

4. **Sunset**
   - Light: stone bg, neutral fg, orange accent (25%)
   - Dark: neutral bg, stone fg, rose accent (20%)
   - Typography: rounded, normal

5. **Midnight**
   - Light: slate bg, gray fg, indigo accent (20%)
   - Dark: slate bg, gray fg, violet accent (25%)
   - Typography: system, normal

6. **Monochrome**
   - Light: gray bg, zinc fg, neutral accent (30%)
   - Dark: zinc bg, gray fg, slate accent (30%)
   - Typography: mono, tight

7. **Warm**
   - Light: stone bg, neutral fg, amber accent (20%)
   - Dark: stone bg, neutral fg, orange accent (25%)
   - Typography: rounded, normal

8. **Cool**
   - Light: slate bg, zinc fg, blue accent (20%)
   - Dark: slate bg, zinc fg, cyan accent (25%)
   - Typography: system, normal

Store these in a constant array that's easy to iterate over for the dropdown.

---

## Typography Implementation

### Font Family Options

1. **System** (default)
   - Use existing system font stack
   - `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`

2. **Rounded**
   - `ui-rounded, 'SF Pro Rounded', system-ui, sans-serif`
   - Friendly, modern feel

3. **Mono**
   - `'SF Mono', Monaco, 'Cascadia Code', 'Fira Code', Consolas, monospace`
   - Developer-focused

4. **Serif**
   - `'Charter', 'Iowan Old Style', Georgia, serif`
   - Elegant, readable

5. **Display**
   - `'SF Display', 'Segoe UI Variable', Roboto, sans-serif`
   - Clean, professional

6. **Custom**
   - User provides raw CSS font-family value
   - Optional Google Fonts URL to inject

### Font Family CSS Application

```css
body {
  font-family: var(--font-family);
}
```

When applying custom font:

- If `customFontUrl` provided, inject `<link>` tag in document head
- Set CSS variable to `customFontFamily` value
- Validate font loads (optional enhancement)

### Line Height Options

```css
/* CSS variables to define */
--line-height-tight: 1.4;
--line-height-normal: 1.5;
--line-height-relaxed: 1.6;

body {
  line-height: var(--line-height);
}
```

Impact: Everything inherits line-height from body, instant density change.

---

## Functional Requirements

### Preset Selection

1. **Dropdown/Select Control**
   - Show built-in presets at top
   - Separator line
   - Show user's custom presets below (if any)
   - Show "Custom" option when active settings don't match any preset

2. **Preset Application**
   - Selecting preset updates ALL theme settings immediately
   - Sets `activePresetId` in storage
   - Triggers live update across extension

3. **Custom State Detection**
   - When user modifies any theme/typography setting
   - Automatically switch dropdown to "Custom"
   - Clear `activePresetId` in storage

### Preset Management

1. **Save Current as Preset**
   - Button: "Save as preset" or "Save theme"
   - Prompt for name (text input)
   - Generate UUID for preset ID
   - Capture current light/dark colors + typography
   - Add to `customPresets` array
   - Set as `activePresetId`

2. **Delete Custom Preset**
   - Only allow deleting user-created presets
   - Confirmation prompt
   - Remove from `customPresets` array
   - If was active, switch to "Custom" or default

3. **Rename Custom Preset**
   - Optional enhancement
   - Edit preset name in-place

### Share/Export

1. **Share Theme**
   - Generate shareable URL with theme data in params
   - Copy to clipboard
   - Format: `chrome-extension://[id]/options.html?preset=[encoded-json]`

2. **Export Theme**
   - Generate JSON representation of current theme
   - Download as `.json` file or copy to clipboard
   - Include all theme + typography settings

3. **Import Theme**
   - Button: "Import theme"
   - Accept URL with preset params OR JSON paste
   - Parse and validate theme data
   - Apply as temporary preview
   - Prompt to save as custom preset

### Randomize Function

1. **Keep Existing Behavior**
   - Randomize colors across palettes
   - Add: Also randomize typography settings
   - Immediately switch dropdown to "Custom"
   - Add to undo history

2. **Enhancement Ideas**
   - Option to randomize colors only vs. everything
   - "Random preset" that picks a built-in preset

### Undo/Redo System

1. **Scope**: Appearance settings only
2. **Implementation**:
   - Track theme snapshots in component state
   - Max 20 history items (FIFO)
   - Each snapshot includes full theme state
   - Undo/redo buttons with keyboard shortcuts
   - Show current position in history (optional)

3. **Snapshot Triggers**:
   - Preset selection
   - Any manual color/typography change
   - Randomize action
   - Debounce: Don't create snapshot for every slider movement

4. **UI**:
   - Simple buttons: "← Undo" and "Redo →"
   - Disable when at history boundaries
   - Optional: Keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)

### Custom Accent Color

1. **Input Control**:
   - Option to override palette-based accent
   - Use native `<input type="color">` for color picker
   - Text input for hex value
   - Validate hex format

2. **Behavior**:
   - When set, overrides theme's accent palette
   - When cleared, revert to palette-based accent
   - Include in preset saves
   - Include in share/export

---

## UI Structure

### Appearance Section Reorganization

```
┌─ Appearance ────────────────────────────────────────┐
│                                                      │
│  Theme Preset                                        │
│  [Dropdown: Select theme ▾]                          │
│    ├─ Built-in Themes                                │
│    │   ├─ Tabby Classic                              │
│    │   ├─ Ocean Breeze                               │
│    │   ├─ Forest                                     │
│    │   └─ ...                                        │
│    ├─ ─────────────                                  │
│    ├─ My Themes (if any)                             │
│    │   ├─ Brand Theme                                │
│    │   └─ Winter Vibes                               │
│    └─ Custom (when modified)                         │
│                                                      │
│  [Randomize] [Save] [Share] [Import] [Undo] [Redo]   │
│                                                      │
│  ─────────────────────────────────────────────       │
│                                                      │
│  Colors                                              │
│  Theme Mode: ○ System  ○ Light  ○ Dark               │
│                                                      │
│  Background:  [Dropdown: stone ▾]                    │
│  Foreground:  [Dropdown: neutral ▾]                  │
│  Accent:      [Dropdown: amber ▾]                    │
│               or Custom: [#______] [color picker]    │
│  Strength:    [────●────] 25%                        │
│                                                      │
│  ─────────────────────────────────────────────       │
│                                                      │
│  Typography                                          │
│  Font Family: [Dropdown: System ▾]                   │
│               └─ or Custom: [_______] [URL]          │
│  Line Height: ○ Tight  ○ Normal  ○ Relaxed           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Button Behavior

- **Randomize**: Randomizes all settings, switches to "Custom"
- **Save**: Opens modal/prompt for preset name, saves current config
- **Share**: Copies shareable URL to clipboard, shows toast notification
- **Import**: Opens modal for URL/JSON paste, previews before applying
- **Undo/Redo**: Navigate theme history, disabled at boundaries

### Interaction Flow

1. **New user**: Sees "Tabby Classic" preset selected by default
2. **Exploring**: Can try different presets from dropdown
3. **Customizing**: Changes any setting → dropdown shows "Custom"
4. **Saving**: Clicks "Save" → names it → appears in "My Themes"
5. **Sharing**: Clicks "Share" → URL copied → sends to friend/team
6. **Importing**: Friend clicks "Import" → pastes URL → applies theme

---

## Technical Implementation Notes

### Storage Updates

1. Add new fields to `PreferenceStateType` interface
2. Provide default values for all new fields
3. Handle migration for existing users (defaults applied automatically)
4. Ensure `customPresets` array initialized as empty

### CSS Variables

Add to theme applicator:

```css
:root {
  /* Typography */
  --font-family: [based on fontFamily setting];
  --line-height: [1.4 | 1.5 | 1.6];

  /* Optional: Custom accent override */
  --accent-custom: [hex value or empty];
}

body {
  font-family: var(--font-family);
  line-height: var(--line-height);
}
```

### Font Loading

When custom font URL provided:

1. Create `<link>` element
2. Set `href` to custom font URL
3. Append to document `<head>`
4. Remove previous custom font link if exists
5. Set `--font-family` CSS variable

### Preset Validation

When importing theme:

1. Validate JSON structure matches `ThemePreset` interface
2. Validate palette names exist in available palettes
3. Validate accent strength is 0-100
4. Validate line height and font family are valid options
5. Show error message if validation fails

### Performance Considerations

- Debounce slider/range inputs to avoid excessive storage writes
- Batch CSS variable updates when applying preset
- Lazy-load custom fonts only when needed
- Limit history to 20 items to avoid memory issues

---

## What NOT to Implement

These were considered but explicitly cut from scope:

❌ **Font scale slider** - Browser already provides zoom  
❌ **UI density/spacing controls** - Too complex, line-height covers this  
❌ **Corner radius customization** - Low value for complexity  
❌ **Animation speed controls** - Use browser's reduced-motion preference  
❌ **Backdrop blur toggle** - Single component, not worth generalizing  
❌ **Shadow intensity controls** - Few shadows currently used  
❌ **Live preview panel** - App itself updates live  
❌ **Compare/split-screen mode** - Easy to switch back and forth  
❌ **Color temperature slider** - Too complex  
❌ **"Theme of the day" feature** - Nice-to-have, future enhancement  
❌ **Additional neutral palettes** - Current 5 are sufficient  
❌ **Non-neutral colors for bg/fg** - Keep it simple

---

## Implementation Phases

### Phase 1: Data & Storage (Day 1)

1. Define `ThemePreset` interface and related types
2. Add new fields to `PreferenceStateType`
3. Create built-in presets constant array
4. Update storage defaults
5. Test storage migration for existing users

### Phase 2: Core Functionality (Day 2)

1. Create preset application logic
2. Implement preset selection (dropdown)
3. Implement custom state detection
4. Add CSS variable application for typography
5. Test preset switching works end-to-end

### Phase 3: Preset Management (Day 3)

1. Implement "Save as preset" functionality
2. Add custom preset deletion
3. Implement share/export (URL generation)
4. Implement import (URL/JSON parsing)
5. Add validation for imported themes

### Phase 4: UI & Polish (Day 4)

1. Restructure Appearance section in Options page
2. Add typography controls (font family, line height)
3. Add custom accent color input
4. Style all new controls consistently
5. Add action buttons (save, share, import, randomize)

### Phase 5: History & Testing (Day 5)

1. Implement simple undo/redo system
2. Add keyboard shortcuts for undo/redo
3. Test all functionality across pages
4. Test import/export roundtrip
5. Test with existing user data
6. Add user documentation/tooltips

---

## Success Criteria

- [ ] User can select from 8+ built-in theme presets
- [ ] Selecting preset updates all appearance settings instantly
- [ ] User can modify any setting and see "Custom" in dropdown
- [ ] User can save custom theme with a name
- [ ] User can share theme via URL that copies to clipboard
- [ ] User can import theme from URL or JSON
- [ ] User can choose from 6 font families (including custom)
- [ ] User can choose from 3 line height options
- [ ] User can add custom accent color via hex input
- [ ] Undo/redo works for appearance changes
- [ ] Randomize button still works and is delightful
- [ ] All changes persist across browser restart
- [ ] All pages reflect theme changes immediately
- [ ] No performance degradation

---

## Future Enhancements (Out of Scope)

- Community preset gallery
- Preset tags/categories
- Preset search
- Automatic theme switching by time of day
- Theme scheduling
- Per-window theme overrides
- Theme marketplace
- AI-generated theme suggestions
- Accessibility score for themes
- Color contrast validation

---

## Testing Checklist

- [ ] Apply each built-in preset, verify all settings update
- [ ] Modify settings, verify "Custom" appears
- [ ] Save custom preset, verify it appears in dropdown
- [ ] Delete custom preset, verify it's removed
- [ ] Share theme, verify URL copies and works
- [ ] Import theme from URL, verify it applies correctly
- [ ] Import theme from JSON, verify it applies correctly
- [ ] Change font family, verify font changes everywhere
- [ ] Change line height, verify spacing changes
- [ ] Add custom accent color, verify it overrides palette
- [ ] Randomize, verify settings change and "Custom" shows
- [ ] Undo change, verify previous state restored
- [ ] Redo change, verify state moves forward
- [ ] Test with fresh install (no existing preferences)
- [ ] Test with existing preferences (migration)
- [ ] Test all changes persist after browser restart
- [ ] Test across all pages (options, tab manager, omnibar)

---

## Notes for Implementer

1. **Creativity Welcome**: This document specifies functionality, not exact UI design. Feel free to improve the interface while meeting requirements.

2. **Component Reuse**: Look for existing UI components (Select, buttons, inputs) before creating new ones.

3. **Validation**: Always validate user input, especially for custom fonts and imported themes.

4. **Error Handling**: Handle failures gracefully (font loading, URL parsing, storage errors).

5. **Accessibility**: Ensure all controls are keyboard-navigable and have proper ARIA labels.

6. **Performance**: Debounce frequent updates, batch CSS changes, lazy-load custom fonts.

7. **Backwards Compatibility**: Existing users should see defaults for new settings.

8. **Documentation**: Add inline comments for complex logic, especially preset management.

9. **Keep It Simple**: If something feels overly complex, there's probably a simpler way. Ask questions.

10. **Test Everything**: This touches a lot of the app. Test thoroughly before marking complete.
