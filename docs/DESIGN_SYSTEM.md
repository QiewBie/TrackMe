# Design System 2.0

## 1. Philosophy
The "Deep Flow" design system is built on **Semantic Tokens**. We do not use raw hex codes or utility colors (like `bg-blue-500`) directly in components. Instead, we use functional names (`bg-brand-DEFAULT`) to ensure:
1.  **Themability**: Changing the brand color is a single config change.
2.  **Dark Mode Safety**: Tokens automatically adjust for dark mode.
3.  **Consistency**: Layouts and interactions feel uniform across the app.

---

## 2. Color System

### 2.1. Brand & Functional Tokens
Defined in `tailwind.config.js`. Use these for all UI elements.

| Role | Token Class | Description |
| :--- | :--- | :--- |
| **Primary Action** | `bg-brand-DEFAULT` | Main buttons, active toggles, highlighted links. |
| **Hover State** | `bg-brand-hover` | Interaction feedback for primary elements. |
| **Active/Pressed** | `bg-brand-active` | Deep press state (often paired with scale). |
| **Subtle/Background** | `bg-brand-subtle` | Light tints for active backgrounds (e.g., selected menu item). |
| **Success** | `text-status-success` | Completion checks, valid states. |
| **Error** | `text-status-error` | Validation errors, destructive actions. |

### 2.2. Content Tags (Theme Utility)
For user-generated content (Categories, Tags) where specific colors are needed (e.g., "Work" is Blue, "Health" is Pink), we use the `src/utils/theme.ts` utility.
**DO NOT hardcode** `text-pink-500`.

**Usage:**
```typescript
import { TAG_COLORS } from '../utils/theme';

// Correct
<span className={TAG_COLORS.pink.text}>Health</span>

// Incorrect
<span className="text-pink-500">Health</span>
```

---

## 3. UI Primitives (`src/components/ui`)

### 3.1. Button
Our core interactive element. Supports `scale` animations on press.
*   **Variants**: `primary`, `secondary`, `danger`, `ghost`, `icon`.
*   **Interaction**: `active:scale-[0.98]` is standard for tactile feel.

### 3.2. Input
Standardized form field.
*   **Focus**: Uses `ring-2 ring-brand-DEFAULT/20` for accessibility.
*   **States**: Includes `disabled`, `error` styles out of the box.

### 3.3. Typography
We use **Manrope**.
*   **Headings**: `font-bold text-text-primary`.
*   **Body**: `text-text-secondary` for descriptions.

---

## 4. Animation & Motion
We combine **Tailwind Transitions** (micro-interactions) and **Framer Motion** (layout).

### Micro-interactions (CSS/Tailwind)
*   **Hover**: `transition-colors duration-200`
*   **Active**: `transition-transform duration-100`

### Layout Transitions (Framer Motion)
Defined in `src/utils/animations.ts` (if applicable) or inline.
*   **Page Transition**: Fade in + Slide Up.
*   **Modals**: Scale In (95% -> 100%) + Opacity.

---

## 5. Z-Index Strategy ("Layer Cake")
To manage the complex mobile layout, we enforce strict Z-Indices:
*   `z-[200]`: **Modals**. (Must overlay Sidebar).
*   `z-[105]`: **Bottom Navigation** (Mobile only). Highest interaction layer.
*   `z-[100]`: **Sidebar** (Mobile drawer).
*   `z-[90]`: **Backdrop** (Overlay for sidebar).
*   `z-[40]`: **Sticky Headers**.
*   `z-[0-30]`: Page Content.
---

## 6. Content & Localization
All user-facing text must be internationalized.

*   **Keys**: defined in `src/locales/{lang}/translation.json`.
*   **Usage**: `const { t } = useTranslation()`.
*   **Pattern**: Use descriptive nested keys (e.g., `nav.dashboard` not just `dashboard`).
*   **Dates**: Never hardcode formats. Use `date-fns` with the active locale.

---

*2025 Deep Flow Design System*
