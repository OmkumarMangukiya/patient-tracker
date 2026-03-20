# Design System Specification: Editorial Clinical Excellence

## 1. Overview & Creative North Star: "The Clinical Curator"
This design system rejects the sterile, boxed-in aesthetics of traditional healthcare software. Our Creative North Star is **The Clinical Curator**—a philosophy that treats medical data with the prestige of a high-end editorial publication. We move beyond "blue boxes" to create an environment of calm authority through intentional asymmetry, exaggerated white space, and sophisticated tonal layering.

By prioritizing a "content-first" hierarchy, we break the "template" look. We use massive typographic contrasts and overlapping surfaces to guide the eye, ensuring that while the interface feels premium and "lifestyle," its primary function remains unwavering medical reliability.

---

## 2. Colors & Surface Architecture
Our palette is rooted in the depth of `primary_container` (#131B2E) and the breathability of `surface` (#F4FAFF). We do not use color to decorate; we use it to architect information.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Traditional dividers create visual "noise" that increases cognitive load for patients and practitioners.
- **Boundaries:** Define edges solely through background shifts. A `surface_container_low` section sitting on a `surface` background creates a clear, sophisticated transition without a single line.
- **Nesting:** Use the tier system to define importance. A `surface_container_lowest` (#FFFFFF) card should live inside a `surface_container` (#DEF0FC) wrapper to provide a soft, natural "lift."

### The Glass & Gradient Rule
To prevent a "flat" or "generic" appearance:
- **Glassmorphism:** For floating navigation or modal overlays, use semi-transparent `surface` colors with a `backdrop-blur` of 20px–40px. This allows the medical context to remain visible but blurred, maintaining a sense of place.
- **Signature Gradients:** For primary CTAs and Hero backgrounds, apply a subtle linear gradient from `primary` (#000000) to `primary_container` (#131B2E) at a 135-degree angle. This adds "visual soul" and a tactile, premium depth.

---

## 3. Typography: Authoritative Clarity
We utilize **Inter** as our typographic backbone. Its tall x-height and neutral character provide the legibility required for complex medical data, while our scale provides the "Editorial" drama.

* **Display (Scale: 3.5rem - 2.25rem):** Reserved for high-level data summaries or welcome headers. Use `on_primary_fixed` (#131B2E) with a `-0.02em` letter-spacing to feel tight and custom.
* **Headline (Scale: 2rem - 1.5rem):** Bold weight. These act as the primary anchors for the page. Use generous `1.5` line-height to ensure headers never feel cramped.
* **Body (Scale: 1rem - 0.75rem):** Medium to Regular weights. For medical descriptions, always default to `body-lg` (1rem) to prioritize accessibility for all age groups.
* **Label (Scale: 0.75rem - 0.6875rem):** Used for micro-copy and metadata. Always in `on_surface_variant` (#45464D) to keep the secondary info truly secondary.

---

## 4. Elevation & Depth: Tonal Layering
In this system, depth is a product of light and material, not "shadow effects."

* **The Layering Principle:** Stacking is our primary tool.
* *Base:* `surface` (#F4FAFF)
* *Sub-section:* `surface_container_low` (#E8F6FF)
* *Interactive Element:* `surface_container_lowest` (#FFFFFF)
* **Ambient Shadows:** When an element must "float" (e.g., a critical diagnostic popover), use an ultra-diffused shadow: `box-shadow: 0 10px 40px rgba(12, 30, 38, 0.05)`. The color is a tinted version of `on_surface` rather than a generic grey.
* **The "Ghost Border" Fallback:** If a container sits on a background of the same color, use a `1px` stroke of `outline_variant` at **20% opacity**. Never 100%.
* **Roundedness:** Adhere to the `md` (0.75rem / 12px) scale for most cards and containers. Use `full` (9999px) strictly for interactive chips and buttons to signify "touchability."

---

## 5. Components

### Buttons & CTAs
* **Primary:** A gradient of `primary` to `primary_container`. High-contrast `on_primary` (#FFFFFF) text. Use `Roundedness: full` for a modern, approachable feel.
* **Secondary:** `surface_container_high` (#D9EBF7) background with `on_secondary_container` (#57657B) text. No border.
* **Tertiary:** Text-only with `primary_fixed_variant` (#3F465C). Reserved for low-emphasis actions like "Cancel."

### Input Fields
* **Structure:** No bottom line or full-box border. Use a subtle `surface_variant` (#D3E5F1) background fill with `Roundedness: DEFAULT` (8px).
* **States:** On focus, transition the background to `surface_container_lowest` (#FFFFFF) and apply a subtle "Ghost Border" of `primary` at 20% opacity.

### Cards & Lists
* **The Divider Forbiddance:** Never use a horizontal line to separate list items. Use `Spacing: 3` (1rem) of vertical white space or a subtle alternating `surface_container_low` fill to differentiate rows.
* **Medical Data Cards:** Use `surface_container_highest` (#D3E5F1) for the card header and `surface_container_lowest` (#FFFFFF) for the body to create a clear "File Folder" visual metaphor.

### Specialized Component: The "Vitality Badge"
Used for patient vitals. A combination of a `secondary_container` (#D5E3FD) pill with a small `tertiary` (#000000) pulse icon. This utilizes our tertiary amber/gold tones to highlight "Active" data without using alarming red/error colors.

---

## 6. Do’s and Don’ts

### Do
* **DO** use asymmetric layouts (e.g., a wide 8-column content area paired with a 4-column "editorial" sidebar).
* **DO** lean into `surface_container_low` for large background areas to reduce eye strain compared to pure white.
* **DO** use `display-lg` typography for single, impactful data points (e.g., a heart rate or a date).

### Don’t
* **DON'T** use 1px solid borders. It shatters the "editorial" feel and makes the UI look like a legacy database.
* **DON'T** use pure black (#000000) for body text. Use `on_surface` (#0C1E26) to maintain a soft, premium legibility.
* **DON'T** crowd the edges. If a container feels full, increase the padding using the `Spacing: 6` (2rem) token.