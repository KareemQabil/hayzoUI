import { describe, expect, it } from "vitest";
import {
  createArabicPosStack,
  generateCssVariables,
  resolveTokens,
  validateTokenLayers,
} from "./index";
import type { LayerType, TokenDefinition, TokenLayer } from "./types";

function layer(id: string, type: LayerType, tokens: readonly TokenDefinition[]): TokenLayer {
  return { id, type, tokens };
}

describe("atomic token engine", () => {
  it("resolves a primitive token and exposes its source", () => {
    const stack = [
      layer("base-primitives", "primitive", [
        { path: "color.palette.blue.600", type: "color", value: "#2457A6", overridableBy: [] },
      ]),
    ];

    const result = resolveTokens(stack);
    expect(result.isValid).toBe(true);
    expect(result.tokens["color.palette.blue.600"]?.value).toBe("#2457A6");
    expect(result.tokens["color.palette.blue.600"]?.sourceLayer).toEqual({ id: "base-primitives", type: "primitive" });
  });

  it("applies the documented precedence independent of cross-type input order", () => {
    const primitive = layer("base", "semantic", [
      { path: "color.text.primary", type: "color", value: "#111111", overridableBy: ["theme", "visual-system", "context"] },
    ]);
    const theme = layer("theme", "theme", [
      { path: "color.text.primary", type: "color", value: "#222222", overridableBy: [] },
    ]);
    const visual = layer("quiet", "visual-system", [
      { path: "color.text.primary", type: "color", value: "#333333", overridableBy: [] },
    ]);
    const context = layer("pos", "context", [
      { path: "color.text.primary", type: "color", value: "#444444", overridableBy: [] },
    ]);

    const result = resolveTokens([context, visual, theme, primitive]);
    expect(result.isValid).toBe(true);
    expect(result.tokens["color.text.primary"]?.value).toBe("#444444");
    expect(result.tokens["color.text.primary"]?.overrideHistory.map((entry) => entry.to.type))
      .toEqual(["theme", "visual-system", "context"]);
  });

  it("accepts an override explicitly permitted by the original definition", () => {
    const result = resolveTokens([
      layer("semantic", "semantic", [
        { path: "color.action.primary", type: "color", value: "#123456", overridableBy: ["theme"] },
      ]),
      layer("brand-light", "theme", [
        { path: "color.action.primary", type: "color", value: "#654321", overridableBy: [] },
      ]),
    ]);

    expect(result.isValid).toBe(true);
    expect(result.tokens["color.action.primary"]?.value).toBe("#654321");
  });

  it("rejects an override that the original definition did not authorize", () => {
    const result = resolveTokens([
      layer("semantic", "semantic", [
        { path: "color.action.primary", type: "color", value: "#123456", overridableBy: [] },
      ]),
      layer("brand", "theme", [
        { path: "color.action.primary", type: "color", value: "#654321", overridableBy: [] },
      ]),
    ]);

    expect(result.isValid).toBe(false);
    expect(result.issues.map((entry) => entry.code)).toContain("UNAUTHORIZED_OVERRIDE");
    expect(result.tokens).toEqual({});
  });

  it("resolves direct and multi-level aliases", () => {
    const result = resolveTokens([
      layer("primitives", "primitive", [
        { path: "color.palette.blue.600", type: "color", value: "#2457A6", overridableBy: [] },
      ]),
      layer("semantics", "semantic", [
        { path: "color.action.primary", type: "color", value: { $ref: "color.palette.blue.600" }, overridableBy: [] },
      ]),
      layer("components", "component", [
        { path: "component.button.background", type: "color", value: { $ref: "color.action.primary" }, overridableBy: [] },
      ]),
    ]);

    expect(result.isValid).toBe(true);
    expect(result.tokens["component.button.background"]?.value).toBe("#2457A6");
    expect(result.tokens["component.button.background"]?.referenceChain)
      .toEqual(["component.button.background", "color.action.primary", "color.palette.blue.600"]);
  });

  it("reports unknown references", () => {
    const result = resolveTokens([
      layer("semantics", "semantic", [
        { path: "color.action.primary", type: "color", value: { $ref: "color.palette.missing.600" }, overridableBy: [] },
      ]),
    ]);

    expect(result.issues.some((entry) => entry.code === "UNKNOWN_REFERENCE")).toBe(true);
    expect(result.issues[0]?.referenceChain).toEqual(["color.action.primary", "color.palette.missing.600"]);
  });

  it("detects a direct reference cycle and reports the complete path", () => {
    const issues = validateTokenLayers([
      layer("semantics", "semantic", [
        { path: "color.text.primary", type: "color", value: { $ref: "color.text.primary" }, overridableBy: [] },
      ]),
    ]);

    const cycle = issues.find((entry) => entry.code === "REFERENCE_CYCLE");
    expect(cycle?.referenceChain).toEqual(["color.text.primary", "color.text.primary"]);
  });

  it("detects an indirect reference cycle and reports every node", () => {
    const issues = validateTokenLayers([
      layer("semantics", "semantic", [
        { path: "color.a", type: "color", value: { $ref: "color.b" }, overridableBy: [] },
        { path: "color.b", type: "color", value: { $ref: "color.c" }, overridableBy: [] },
        { path: "color.c", type: "color", value: { $ref: "color.a" }, overridableBy: [] },
      ]),
    ]);

    const cycle = issues.find((entry) => entry.code === "REFERENCE_CYCLE");
    expect(cycle?.referenceChain).toEqual(["color.a", "color.b", "color.c", "color.a"]);
  });

  it("rejects references whose target token has a different type", () => {
    const result = resolveTokens([
      layer("base", "primitive", [
        { path: "space.4", type: "dimension", value: { value: 16, unit: "px" }, overridableBy: [] },
      ]),
      layer("semantic", "semantic", [
        { path: "color.text.primary", type: "color", value: { $ref: "space.4" }, overridableBy: [] },
      ]),
    ]);

    expect(result.issues.some((entry) => entry.code === "TOKEN_TYPE_MISMATCH")).toBe(true);
  });

  it("rejects an override that changes the original token type", () => {
    const result = resolveTokens([
      layer("semantic", "semantic", [
        { path: "control.height.md", type: "dimension", value: { value: 40, unit: "px" }, overridableBy: ["context"] },
      ]),
      layer("pos", "context", [
        { path: "control.height.md", type: "color", value: "#123456", overridableBy: [] },
      ]),
    ]);

    expect(result.issues.some((entry) => entry.code === "TOKEN_TYPE_MISMATCH")).toBe(true);
  });

  it("validates unsupported types, dimensions, durations, opacity, font weights, and integers", () => {
    const issues = validateTokenLayers([
      {
        id: "invalid-values",
        type: "primitive",
        tokens: [
          { path: "space.invalid", type: "dimension", value: { value: 4, unit: "furlong" }, overridableBy: [] },
          { path: "motion.invalid", type: "duration", value: { value: -1, unit: "ms" }, overridableBy: [] },
          { path: "opacity.invalid", type: "opacity", value: 1.01, overridableBy: [] },
          { path: "font.weight.invalid", type: "font-weight", value: 1001, overridableBy: [] },
          { path: "count.invalid", type: "integer", value: 1.5, overridableBy: [] },
          { path: "color.invalid", type: "gradient", value: "linear-gradient(red, blue)", overridableBy: [] },
        ],
      },
    ]);

    const codes = issues.map((entry) => entry.code);
    expect(codes).toContain("INVALID_DIMENSION");
    expect(codes).toContain("INVALID_DURATION");
    expect(codes).toContain("INVALID_OPACITY");
    expect(codes).toContain("INVALID_FONT_WEIGHT");
    expect(codes).toContain("INVALID_INTEGER");
    expect(codes).toContain("UNSUPPORTED_TOKEN_TYPE");
  });

  it("rejects values outside the documented CSS subset", () => {
    const issues = validateTokenLayers([
      {
        id: "unsupported-values",
        type: "primitive",
        tokens: [
          { path: "color.bad", type: "color", value: "rgb(0 0 0)", overridableBy: [] },
          { path: "shadow.bad", type: "shadow", value: "var(--shadow)", overridableBy: [] },
          { path: "easing.bad", type: "easing", value: "steps(3)", overridableBy: [] },
          { path: "number.bad", type: "number", value: Number.NaN, overridableBy: [] },
          { path: "font.family.bad", type: "font-family", value: [], overridableBy: [] },
        ],
      },
    ]);

    expect(issues.filter((entry) => entry.code === "INVALID_TOKEN_VALUE")).toHaveLength(5);
  });

  it("validates every supported token value family", () => {
    const issues = validateTokenLayers([
      layer("all-value-types", "primitive", [
        { path: "color.primary", type: "color", value: "#abc", overridableBy: [] },
        { path: "dimension.offset", type: "dimension", value: { value: -2, unit: "rem" }, overridableBy: [] },
        { path: "duration.short", type: "duration", value: { value: 0.25, unit: "s" }, overridableBy: [] },
        { path: "font.family.sans", type: "font-family", value: ["IBM Plex Sans", "sans-serif"], overridableBy: [] },
        { path: "font.weight.regular", type: "font-weight", value: 400, overridableBy: [] },
        { path: "opacity.muted", type: "opacity", value: 0.5, overridableBy: [] },
        { path: "scale.ratio", type: "number", value: -1.25, overridableBy: [] },
        { path: "count.rows", type: "integer", value: -2, overridableBy: [] },
        { path: "shadow.card", type: "shadow", value: "0px 2px 6px #00000014", overridableBy: [] },
        { path: "motion.ease", type: "easing", value: "cubic-bezier(0.2, 0, 0, 1)", overridableBy: [] },
      ]),
    ]);

    expect(issues).toEqual([]);
  });

  it("accepts inclusive numeric boundaries", () => {
    const issues = validateTokenLayers([
      layer("valid-boundaries", "primitive", [
        { path: "opacity.zero", type: "opacity", value: 0, overridableBy: [] },
        { path: "opacity.one", type: "opacity", value: 1, overridableBy: [] },
        { path: "font.weight.min", type: "font-weight", value: 1, overridableBy: [] },
        { path: "font.weight.max", type: "font-weight", value: 1000, overridableBy: [] },
        { path: "count.zero", type: "integer", value: 0, overridableBy: [] },
        { path: "count.negative", type: "integer", value: -1, overridableBy: [] },
        { path: "motion.zero", type: "duration", value: { value: 0, unit: "ms" }, overridableBy: [] },
      ]),
    ]);

    expect(issues).toEqual([]);
  });

  it("rejects duplicate layer identifiers", () => {
    const result = resolveTokens([
      layer("shared-id", "primitive", [
        { path: "color.a", type: "color", value: "#111111", overridableBy: [] },
      ]),
      layer("shared-id", "semantic", [
        { path: "color.b", type: "color", value: "#222222", overridableBy: [] },
      ]),
    ]);

    expect(result.issues.map((entry) => entry.code)).toContain("DUPLICATE_LAYER_ID");
  });

  it("rejects unsupported layer types", () => {
    const issues = validateTokenLayers([
      { id: "unknown-layer", type: "brand", tokens: [] },
    ]);

    expect(issues.map((entry) => entry.code)).toContain("UNSUPPORTED_LAYER_TYPE");
  });

  it("rejects duplicate token paths within one layer", () => {
    const issues = validateTokenLayers([
      layer("duplicate-paths", "primitive", [
        { path: "color.a", type: "color", value: "#111111", overridableBy: [] },
        { path: "color.a", type: "color", value: "#222222", overridableBy: [] },
      ]),
    ]);

    expect(issues.map((entry) => entry.code)).toContain("DUPLICATE_TOKEN_DEFINITION");
  });

  it("generates stable CSS custom properties for resolved values", () => {
    const result = resolveTokens([
      layer("primitives", "primitive", [
        { path: "color.palette.blue.600", type: "color", value: "#2457A6", overridableBy: [] },
        { path: "space.4", type: "dimension", value: { value: 16, unit: "px" }, overridableBy: [] },
        { path: "typography.font-family.arabic", type: "font-family", value: ["IBM Plex Sans Arabic", "sans-serif"], overridableBy: [] },
      ]),
    ]);

    const css = generateCssVariables(result);
    expect(css.isValid).toBe(true);
    expect(css.variables["--hz-color-palette-blue-600"]).toBe("#2457A6");
    expect(css.variables["--hz-space-4"]).toBe("16px");
    expect(css.variables["--hz-typography-font-family-arabic"]).toBe('"IBM Plex Sans Arabic", "sans-serif"');
    expect(css.css).toContain("--hz-color-palette-blue-600: #2457A6;");
  });

  it("detects CSS variable naming collisions instead of overwriting", () => {
    const result = resolveTokens([
      layer("primitives", "primitive", [
        { path: "a.b-c", type: "color", value: "#111111", overridableBy: [] },
        { path: "a-b.c", type: "color", value: "#222222", overridableBy: [] },
      ]),
    ]);

    expect(result.issues.some((entry) => entry.code === "CSS_VARIABLE_COLLISION")).toBe(true);
    const css = generateCssVariables(result);
    expect(css.isValid).toBe(false);
    expect(css.variables).toEqual({});
    expect(css.issues[0]?.code).toBe("CSS_VARIABLE_COLLISION");
  });

  it("exposes definition source, value source, alias chain, and override history", () => {
    const result = resolveTokens([
      layer("primitives", "primitive", [
        { path: "color.palette.neutral.800", type: "color", value: "#222222", overridableBy: [] },
      ]),
      layer("semantics", "semantic", [
        { path: "color.text.primary", type: "color", value: "#111111", overridableBy: ["theme"] },
      ]),
      layer("brand-dark", "theme", [
        { path: "color.text.primary", type: "color", value: { $ref: "color.palette.neutral.800" }, overridableBy: [] },
      ]),
    ]);

    const token = result.tokens["color.text.primary"];
    expect(token?.originalDefinition.value).toBe("#111111");
    expect(token?.sourceLayer).toEqual({ id: "brand-dark", type: "theme" });
    expect(token?.valueSource).toEqual({ id: "primitives", type: "primitive" });
    expect(token?.overrideHistory).toHaveLength(1);
    expect(token?.referenceChain).toEqual(["color.text.primary", "color.palette.neutral.800"]);
    expect(result.traces["color.text.primary"]?.finalValue).toBe("#222222");
  });

  it("produces deterministic output for identical input", () => {
    const stack = createArabicPosStack("light");
    const first = resolveTokens(stack);
    const second = resolveTokens(stack);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(generateCssVariables(first).css).toBe(generateCssVariables(second).css);
  });

  it("does not mutate source layers or token definitions", () => {
    const stack = createArabicPosStack("light");
    const before = JSON.stringify(stack);

    resolveTokens(stack);
    generateCssVariables(resolveTokens(stack));

    expect(JSON.stringify(stack)).toBe(before);
  });

  it("composes light and dark themes over the same semantic foundation", () => {
    const light = resolveTokens(createArabicPosStack("light"));
    const dark = resolveTokens(createArabicPosStack("dark"));

    expect(light.isValid).toBe(true);
    expect(dark.isValid).toBe(true);
    expect(light.tokens["color.surface.canvas"]?.value).toBe("#F7F8FA");
    expect(dark.tokens["color.surface.canvas"]?.value).toBe("#111827");
    expect(light.tokens["component.button.background"]?.value).toBe("#2457A6");
    expect(dark.tokens["component.button.background"]?.value).toBe("#8AB4F8");
  });

  it("applies POS touch context overrides to shared component aliases", () => {
    const desktop = resolveTokens(createArabicPosStack("light", { context: false }));
    const pos = resolveTokens(createArabicPosStack("light", { context: true }));

    expect(desktop.tokens["component.button.height.md"]?.value).toEqual({ value: 40, unit: "px" });
    expect(pos.tokens["component.button.height.md"]?.value).toEqual({ value: 48, unit: "px" });
    expect(pos.tokens["component.input.height.md"]?.value).toEqual({ value: 48, unit: "px" });
  });

  it("composes visual-system and context layers independently", () => {
    const baseline = resolveTokens(createArabicPosStack("light", { visualSystem: false, context: false }));
    const visualOnly = resolveTokens(createArabicPosStack("light", { visualSystem: true, context: false }));
    const contextOnly = resolveTokens(createArabicPosStack("light", { visualSystem: false, context: true }));
    const combined = resolveTokens(createArabicPosStack("light", { visualSystem: true, context: true }));

    expect(baseline.tokens["shape.control.radius"]?.value).toEqual({ value: 8, unit: "px" });
    expect(visualOnly.tokens["shape.control.radius"]?.value).toEqual({ value: 6, unit: "px" });
    expect(contextOnly.tokens["shape.control.radius"]?.value).toEqual({ value: 8, unit: "px" });
    expect(contextOnly.tokens["control.height.md"]?.value).toEqual({ value: 48, unit: "px" });
    expect(combined.tokens["shape.control.radius"]?.value).toEqual({ value: 6, unit: "px" });
    expect(combined.tokens["control.height.md"]?.value).toEqual({ value: 48, unit: "px" });
  });

  it("rejects CSS namespace values outside lowercase kebab-case", () => {
    const result = resolveTokens([
      layer("primitives", "primitive", [
        { path: "color.primary", type: "color", value: "#123456", overridableBy: [] },
      ]),
    ]);

    const css = generateCssVariables(result, "Hayzo UI");
    expect(css.isValid).toBe(false);
    expect(css.issues[0]?.code).toBe("INVALID_CSS_NAMESPACE");
  });

  it("rejects invalid token path segments", () => {
    const issues = validateTokenLayers([
      {
        id: "bad-paths",
        type: "primitive",
        tokens: [
          { path: "Color..primary", type: "color", value: "#123456", overridableBy: [] },
        ],
      },
    ]);

    expect(issues.map((entry) => entry.code)).toContain("INVALID_TOKEN_PATH");
  });
});
