# Design & UX Instructions

## Design Philosophy

Tabby's design should be **delightful, bold, and polished** while remaining accessible to a general audience. The app targets anyone who regularly has too many tabs open, with top personas being researchers and developers.

## Core Principles

### Delightful Experiences

- **Surprise and delight:** Add thoughtful micro-interactions, smooth animations, and moments of polish that make users smile
- **Personality:** The interface should feel warm and approachable, not sterile or overly technical
- **Flow state:** Design to minimize friction and keep users in their workflow
- **Celebration:** Success states, completions, and achievements should feel rewarding

### Bold Design

- **Strong visual hierarchy:** Make important actions and information immediately obvious
- **Confident use of color:** Don't shy away from vibrant accents and rich theming
- **Clear typography:** Use size, weight, and spacing decisively
- **Whitespace:** Give elements room to breathe, don't cram the interface

### Polished Execution

- **Attention to detail:** Pixel-perfect alignment, consistent spacing, refined transitions
- **Smooth animations:** Use spring physics, not linear easing; all movements should feel natural
- **Loading states:** Never leave users wondering - show progress, skeletons, or graceful degradation
- **Error handling:** Make errors helpful, not frustrating; suggest solutions when possible

### Accessibility First

- **Keyboard navigation:** Every feature must be fully keyboard accessible
- **Screen readers:** Proper ARIA labels, semantic HTML, clear focus indicators
- **Color contrast:** Meet WCAG AA standards minimum, AAA preferred
- **Responsive:** Adapt gracefully to different viewport sizes and side panel widths
- **Reduce motion:** Respect `prefers-reduced-motion` for animations

## Component Guidelines

### Use shadcn Components

- **Prefer shadcn/ui:** When building new UI, check if shadcn has a component for it first
- **Customize thoughtfully:** Shadcn components are designed to be modified - adapt them to Tabby's design system
- **Consistency:** Use the same shadcn patterns across all pages for familiarity
- **Composition:** Build complex interfaces by composing simple shadcn primitives

### Visual Component Architecture

- **Dumb components:** Visual components should receive all data via props, no API calls or business logic
- **Props over configuration:** Make behavior explicit through props rather than hidden magic
- **Composable:** Break large components into smaller, reusable pieces
- **Theme-aware:** All components must respect theme variables and dark/light modes

## Target Audience Considerations

### Researchers

- **Information density:** Allow power users to see more data when needed (compact modes, table views)
- **Search and filter:** Make finding specific tabs/bookmarks effortless
- **Organization:** Support grouping, tagging, and bulk operations
- **Context preservation:** Help users maintain mental models of their work across many tabs

### Developers

- **Keyboard-first:** Assume users prefer keyboard over mouse
- **Shortcuts:** Make all actions accessible via shortcuts, display them prominently
- **Speed:** Optimize for fast navigation and instant feedback
- **Customization:** Expose settings and preferences for power users

### General Audience

- **Intuitive:** First-time users should understand the interface without documentation
- **Forgiving:** Make it hard to make mistakes, easy to undo
- **Progressive disclosure:** Show simple interface by default, reveal advanced features on demand
- **Onboarding:** Guide new users with helpful tooltips, welcome screens, and contextual hints

## Interaction Patterns

### Feedback

- **Immediate response:** User actions should trigger instant visual feedback (hover states, active states)
- **Optimistic updates:** Show changes immediately, roll back if they fail
- **Clear outcomes:** After completing an action, make it obvious what happened
- **Error recovery:** If something fails, explain why and offer a path forward

### Animation

- **Spring physics:** Use natural easing (cubic-bezier or spring animations) over linear
- **Duration:** Keep animations snappy (100-300ms for most transitions)
- **Purpose:** Animate to guide attention, show relationships, or provide feedback - not decoration
- **Reduce motion:** Provide instant transitions for users who prefer reduced motion

### Navigation

- **Clear hierarchy:** Users should always know where they are and how to get back
- **Consistent patterns:** Use the same navigation metaphors across all surfaces
- **Breadcrumbs:** Show context in multi-level interfaces
- **Exit paths:** Always provide a clear way to close, go back, or escape

## Visual Design

### Typography

- **Hierarchy:** Use clear size and weight distinctions (headings should be obvious)
- **Line height:** Give text room to breathe (1.5-1.6 for body, tighter for headings)
- **Font families:** Use system fonts by default, provide custom options for personalization
- **Readability:** Prioritize legibility over novelty

### Color

- **Accent colors:** Use vibrant, customizable accent colors that users can personalize
- **Positive reinforcement:** Use accent colors to highlight important information, guide attention, and celebrate actions
- **Avoid negative colors:** Don't use warning (yellow) or error (red) colors as they create negative reinforcement and anxiety
- **Helpful messaging:** When something goes wrong, use neutral or accent colors with clear, actionable guidance rather than alarming red
- **Theming:** Support light, dark, and custom themes throughout
- **Contrast:** Ensure text is readable in all theme combinations

### Spacing

- **Consistent scale:** Use a spacing system (4px, 8px, 12px, 16px, 24px, 32px, 48px)
- **Generous padding:** Give interactive elements breathing room (minimum 44x44px touch targets)
- **Rhythm:** Maintain consistent spacing patterns within related groups

### Imagery

- **Favicons:** Show site favicons prominently for quick recognition
- **Icons:** Use clear, consistent icon style (preferably from a single icon set)
- **Illustrations:** Use sparingly for empty states, onboarding, or celebration moments
- **Screenshots/media:** In release notes and documentation, use high-quality visuals

## Examples & Anti-Patterns

### ✅ Do

- Use spring animations for drawer opening/closing
- Show skeleton loaders while fetching tab data
- Provide keyboard shortcuts with visual hints (⌘K overlays)
- Celebrate bulk operations completion with success animations
- Use tabs or pills for mode switching (overlay vs popup vs side panel)
- Progressive disclosure: show basic options, hide advanced behind "Advanced" section

### ❌ Don't

- Linear slide-in animations (use springs or cubic-bezier)
- Leave users staring at blank screens while loading
- Hide keyboard shortcuts in obscure documentation
- Make destructive actions (close all tabs) too easy without confirmation
- Cram every setting onto one screen
- Use vague labels like "Options" or "Settings" without context

## Design Deliverables

When designing new features:

1. **User flow diagrams:** Map out how users will accomplish their goals
2. **Wireframes:** Sketch layout and hierarchy before diving into details
3. **Interactive prototypes:** Use real components with mock data to demonstrate behavior
4. **Accessibility checklist:** Verify keyboard nav, screen reader support, contrast
5. **Animation specs:** Document timing, easing, and trigger conditions
6. **Responsive behavior:** Define how layouts adapt to different sizes

## Tools & Resources

- **Component library:** shadcn/ui documentation for available components
- **Design tokens:** Reference Tabby's theme system (CSS variables, Tailwind config)
- **Animation:** Framer Motion or CSS transitions with spring easing
- **Icons:** Lucide icons (used by shadcn) or custom SVG icons
- **Accessibility:** WAVE browser extension, axe DevTools, keyboard-only testing
