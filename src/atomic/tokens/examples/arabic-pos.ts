import type { TokenLayer } from "../types";

/**
 * Fictional Arabic-first POS stack. The appearance theme, visual language, and
 * operational context are separate layers and can be composed independently.
 */

export const arabicPosPrimitiveLayer = {
  id: "arabic-pos-primitives",
  type: "primitive",
  tokens: [
    { path: "color.palette.neutral.0", type: "color", value: "#FFFFFF", overridableBy: [] },
    { path: "color.palette.neutral.50", type: "color", value: "#F7F8FA", overridableBy: [] },
    { path: "color.palette.neutral.100", type: "color", value: "#EEF1F5", overridableBy: [] },
    { path: "color.palette.neutral.200", type: "color", value: "#D8DEE8", overridableBy: [] },
    { path: "color.palette.neutral.600", type: "color", value: "#526174", overridableBy: [] },
    { path: "color.palette.neutral.900", type: "color", value: "#172033", overridableBy: [] },
    { path: "color.palette.blue.600", type: "color", value: "#2457A6", overridableBy: [] },
    { path: "color.palette.red.600", type: "color", value: "#B42332", overridableBy: [] },
    { path: "color.palette.green.600", type: "color", value: "#18794E", overridableBy: [] },

    { path: "space.1", type: "dimension", value: { value: 4, unit: "px" }, overridableBy: [] },
    { path: "space.2", type: "dimension", value: { value: 8, unit: "px" }, overridableBy: [] },
    { path: "space.3", type: "dimension", value: { value: 12, unit: "px" }, overridableBy: [] },
    { path: "space.4", type: "dimension", value: { value: 16, unit: "px" }, overridableBy: [] },
    { path: "dimension.control.height.md", type: "dimension", value: { value: 40, unit: "px" }, overridableBy: [] },
    { path: "dimension.control.target-min", type: "dimension", value: { value: 40, unit: "px" }, overridableBy: [] },
    { path: "radius.control", type: "dimension", value: { value: 8, unit: "px" }, overridableBy: [] },
    { path: "radius.surface", type: "dimension", value: { value: 12, unit: "px" }, overridableBy: [] },

    { path: "typography.font-family.arabic", type: "font-family", value: ["IBM Plex Sans Arabic", "IBM Plex Sans", "system-ui", "sans-serif"], overridableBy: [] },
    { path: "typography.font-family.mono", type: "font-family", value: ["IBM Plex Mono", "ui-monospace", "monospace"], overridableBy: [] },
    { path: "typography.font-weight.regular", type: "font-weight", value: 400, overridableBy: [] },
    { path: "typography.font-weight.semibold", type: "font-weight", value: 600, overridableBy: [] },
    { path: "typography.size.body", type: "dimension", value: { value: 14, unit: "px" }, overridableBy: [] },

    { path: "motion.duration.fast", type: "duration", value: { value: 120, unit: "ms" }, overridableBy: [] },
    { path: "motion.duration.base", type: "duration", value: { value: 180, unit: "ms" }, overridableBy: [] },
    { path: "motion.easing.standard", type: "easing", value: "cubic-bezier(0.2, 0, 0, 1)", overridableBy: [] },
    { path: "shadow.elevation.card", type: "shadow", value: "0px 1px 2px #0F172A14", overridableBy: [] },
    { path: "opacity.disabled", type: "opacity", value: 0.48, overridableBy: [] },
    { path: "z-index.overlay", type: "integer", value: 1000, overridableBy: [] },
  ],
} as const satisfies TokenLayer;

export const arabicPosSemanticLayer = {
  id: "arabic-pos-semantics",
  type: "semantic",
  tokens: [
    { path: "color.text.primary", type: "color", value: { $ref: "color.palette.neutral.900" }, overridableBy: ["theme", "visual-system", "context"] },
    { path: "color.text.secondary", type: "color", value: { $ref: "color.palette.neutral.600" }, overridableBy: ["theme", "visual-system", "context"] },
    { path: "color.surface.canvas", type: "color", value: { $ref: "color.palette.neutral.50" }, overridableBy: ["theme", "visual-system", "context"] },
    { path: "color.surface.raised", type: "color", value: { $ref: "color.palette.neutral.0" }, overridableBy: ["theme", "visual-system", "context"] },
    { path: "color.action.primary", type: "color", value: { $ref: "color.palette.blue.600" }, overridableBy: ["theme", "visual-system", "context"] },
    { path: "color.action.on-primary", type: "color", value: { $ref: "color.palette.neutral.0" }, overridableBy: ["theme", "visual-system", "context"] },
    { path: "color.status.danger", type: "color", value: { $ref: "color.palette.red.600" }, overridableBy: ["theme", "visual-system", "context"] },
    { path: "color.status.success", type: "color", value: { $ref: "color.palette.green.600" }, overridableBy: ["theme", "visual-system", "context"] },
    { path: "color.border.default", type: "color", value: { $ref: "color.palette.neutral.200" }, overridableBy: ["theme", "visual-system", "context"] },
    { path: "color.focus.ring", type: "color", value: { $ref: "color.palette.blue.600" }, overridableBy: ["theme", "visual-system", "context"] },

    { path: "control.height.md", type: "dimension", value: { $ref: "dimension.control.height.md" }, overridableBy: ["context"] },
    { path: "control.target.min", type: "dimension", value: { $ref: "dimension.control.target-min" }, overridableBy: ["context"] },
    { path: "control.padding.inline", type: "dimension", value: { $ref: "space.4" }, overridableBy: ["context"] },
    { path: "shape.control.radius", type: "dimension", value: { $ref: "radius.control" }, overridableBy: ["visual-system", "context"] },
    { path: "shape.surface.radius", type: "dimension", value: { $ref: "radius.surface" }, overridableBy: ["visual-system", "context"] },
    { path: "elevation.card.shadow", type: "shadow", value: { $ref: "shadow.elevation.card" }, overridableBy: ["visual-system", "context"] },
    { path: "typography.body.family", type: "font-family", value: { $ref: "typography.font-family.arabic" }, overridableBy: ["theme", "visual-system"] },
    { path: "typography.body.weight", type: "font-weight", value: { $ref: "typography.font-weight.regular" }, overridableBy: ["visual-system"] },
    { path: "typography.body.size", type: "dimension", value: { $ref: "typography.size.body" }, overridableBy: ["visual-system"] },
    { path: "motion.fast", type: "duration", value: { $ref: "motion.duration.fast" }, overridableBy: ["visual-system", "context"] },
    { path: "motion.standard", type: "easing", value: { $ref: "motion.easing.standard" }, overridableBy: ["visual-system", "context"] },
  ],
} as const satisfies TokenLayer;

/** Brand appearance only: it maps semantic roles without defining the visual grammar. */
export const arabicPosLightThemeLayer = {
  id: "arabic-pos-theme-light",
  type: "theme",
  tokens: [
    { path: "color.text.primary", type: "color", value: "#172033", overridableBy: [] },
    { path: "color.text.secondary", type: "color", value: "#526174", overridableBy: [] },
    { path: "color.surface.canvas", type: "color", value: "#F7F8FA", overridableBy: [] },
    { path: "color.surface.raised", type: "color", value: "#FFFFFF", overridableBy: [] },
    { path: "color.action.primary", type: "color", value: "#2457A6", overridableBy: [] },
    { path: "color.action.on-primary", type: "color", value: "#FFFFFF", overridableBy: [] },
    { path: "color.status.danger", type: "color", value: "#B42332", overridableBy: [] },
    { path: "color.status.success", type: "color", value: "#18794E", overridableBy: [] },
    { path: "color.border.default", type: "color", value: "#D8DEE8", overridableBy: [] },
    { path: "color.focus.ring", type: "color", value: "#2457A6", overridableBy: [] },
  ],
} as const satisfies TokenLayer;

export const arabicPosDarkThemeLayer = {
  id: "arabic-pos-theme-dark",
  type: "theme",
  tokens: [
    { path: "color.text.primary", type: "color", value: "#F3F6FA", overridableBy: [] },
    { path: "color.text.secondary", type: "color", value: "#B7C2D0", overridableBy: [] },
    { path: "color.surface.canvas", type: "color", value: "#111827", overridableBy: [] },
    { path: "color.surface.raised", type: "color", value: "#1F2937", overridableBy: [] },
    { path: "color.action.primary", type: "color", value: "#8AB4F8", overridableBy: [] },
    { path: "color.action.on-primary", type: "color", value: "#10213B", overridableBy: [] },
    { path: "color.status.danger", type: "color", value: "#F28B94", overridableBy: [] },
    { path: "color.status.success", type: "color", value: "#73D6A4", overridableBy: [] },
    { path: "color.border.default", type: "color", value: "#3A475A", overridableBy: [] },
    { path: "color.focus.ring", type: "color", value: "#A7C8FF", overridableBy: [] },
  ],
} as const satisfies TokenLayer;

/** Visual language: quiet surfaces, restrained elevation, and compact geometry. */
export const quietEnterpriseVisualSystemLayer = {
  id: "visual-quiet-enterprise",
  type: "visual-system",
  tokens: [
    { path: "shape.control.radius", type: "dimension", value: { value: 6, unit: "px" }, overridableBy: [] },
    { path: "shape.surface.radius", type: "dimension", value: { value: 10, unit: "px" }, overridableBy: [] },
    { path: "elevation.card.shadow", type: "shadow", value: "0px 2px 6px #0F172A12", overridableBy: [] },
    { path: "typography.body.weight", type: "font-weight", value: 400, overridableBy: [] },
  ],
} as const satisfies TokenLayer;

/** Operational context: touch-first sizing and spacing, with no brand or visual-style decisions. */
export const posTouchContextLayer = {
  id: "context-pos-touch",
  type: "context",
  tokens: [
    { path: "control.height.md", type: "dimension", value: { value: 48, unit: "px" }, overridableBy: [] },
    { path: "control.target.min", type: "dimension", value: { value: 48, unit: "px" }, overridableBy: [] },
    { path: "control.padding.inline", type: "dimension", value: { value: 16, unit: "px" }, overridableBy: [] },
  ],
} as const satisfies TokenLayer;

/** Component contracts expose anatomy-oriented tokens; they do not implement components. */
export const arabicPosComponentLayer = {
  id: "arabic-pos-components",
  type: "component",
  tokens: [
    { path: "component.button.height.md", type: "dimension", value: { $ref: "control.height.md" }, overridableBy: ["recipe", "instance"] },
    { path: "component.button.padding.inline", type: "dimension", value: { $ref: "control.padding.inline" }, overridableBy: ["recipe", "instance"] },
    { path: "component.button.radius", type: "dimension", value: { $ref: "shape.control.radius" }, overridableBy: ["recipe", "instance"] },
    { path: "component.button.background", type: "color", value: { $ref: "color.action.primary" }, overridableBy: ["recipe", "instance"] },
    { path: "component.button.foreground", type: "color", value: { $ref: "color.action.on-primary" }, overridableBy: ["recipe", "instance"] },
    { path: "component.input.height.md", type: "dimension", value: { $ref: "control.height.md" }, overridableBy: ["recipe", "instance"] },
    { path: "component.input.padding.inline", type: "dimension", value: { $ref: "control.padding.inline" }, overridableBy: ["recipe", "instance"] },
    { path: "component.input.radius", type: "dimension", value: { $ref: "shape.control.radius" }, overridableBy: ["recipe", "instance"] },
    { path: "component.input.border.color", type: "color", value: { $ref: "color.border.default" }, overridableBy: ["recipe", "instance"] },
  ],
} as const satisfies TokenLayer;

/** Recipes map variants to component tokens; they contain no behavior. */
export const arabicPosRecipeLayer = {
  id: "arabic-pos-recipes",
  type: "recipe",
  tokens: [
    { path: "recipe.button.size.md.height", type: "dimension", value: { $ref: "component.button.height.md" }, overridableBy: ["instance"] },
    { path: "recipe.button.size.md.padding-inline", type: "dimension", value: { $ref: "component.button.padding.inline" }, overridableBy: ["instance"] },
    { path: "recipe.button.emphasis.solid.background", type: "color", value: { $ref: "component.button.background" }, overridableBy: ["instance"] },
    { path: "recipe.button.emphasis.solid.foreground", type: "color", value: { $ref: "component.button.foreground" }, overridableBy: ["instance"] },
    { path: "recipe.button.emphasis.solid.radius", type: "dimension", value: { $ref: "component.button.radius" }, overridableBy: ["instance"] },
  ],
} as const satisfies TokenLayer;

export type ArabicPosAppearance = "light" | "dark";

export interface ArabicPosStackOptions {
  readonly visualSystem?: boolean;
  readonly context?: boolean;
}

/**
 * Builds a reproducible stack. Visual system and context can be toggled
 * independently; the semantic foundation and component contracts stay shared.
 */
export function createArabicPosStack(
  appearance: ArabicPosAppearance,
  options: ArabicPosStackOptions = {},
): readonly TokenLayer[] {
  const layers: TokenLayer[] = [
    arabicPosPrimitiveLayer,
    arabicPosSemanticLayer,
    appearance === "light" ? arabicPosLightThemeLayer : arabicPosDarkThemeLayer,
  ];

  if (options.visualSystem !== false) layers.push(quietEnterpriseVisualSystemLayer);
  if (options.context !== false) layers.push(posTouchContextLayer);

  layers.push(arabicPosComponentLayer, arabicPosRecipeLayer);
  return layers;
}
