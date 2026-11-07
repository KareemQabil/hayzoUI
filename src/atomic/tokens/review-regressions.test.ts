import { describe, expect, it } from "vitest";
import { generateCssVariables, resolveTokens, validateTokenLayers } from "./index";
import type { DimensionValue, LayerType, TokenDefinition, TokenLayer } from "./types";

function layer(id: string, type: LayerType, tokens: readonly TokenDefinition[]): TokenLayer {
  return { id, type, tokens };
}

function shadowLayer(...values: string[]): TokenLayer {
  return layer("shadows", "primitive", values.map((value, index) => ({
    path: `shadow.case.${index}`,
    type: "shadow",
    value,
    overridableBy: [],
  })));
}

describe("review follow-up: malformed top-level input", () => {
  const def = (extra: Record<string, unknown>) => [{ id: "base", type: "primitive", tokens: [{ path: "color.x", type: "color", value: "#000", overridableBy: [], ...extra }] }];
  const malformed: [string, unknown][] = [
    ["null", null],
    ["undefined", undefined],
    ["an object", {}],
    ["a string", "layers"],
    ["a number", 42],
    ["an array of null layers", [null]],
    ["a layer with null tokens", [{ id: "base", type: "primitive", tokens: null }]],
    ["a layer with object tokens", [{ id: "base", type: "primitive", tokens: {} }]],
    ["a null definition", [{ id: "base", type: "primitive", tokens: [null] }]],
    ["a string definition", [{ id: "base", type: "primitive", tokens: ["color.x"] }]],
    ["a definition without a value", def({ value: undefined })],
    ["null deprecated metadata", def({ deprecated: null })],
    ["a non-array overridableBy", def({ overridableBy: "theme" })],
    ["a null dimension value", [{ id: "base", type: "primitive", tokens: [{ path: "space.x", type: "dimension", value: null, overridableBy: [] }] }]],
    ["a reference with a numeric target", def({ value: { $ref: 7 } })],
    ["a non-string path", def({ path: 12 })],
  ];

  it.each(malformed)("validation returns diagnostics for %s instead of throwing", (_name, input) => {
    let issues: ReturnType<typeof validateTokenLayers> = [];
    expect(() => { issues = validateTokenLayers(input); }).not.toThrow();
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((entry) => typeof entry.code === "string" && entry.explanation.length > 0)).toBe(true);
  });

  it.each(malformed)("resolution returns an invalid result with no partial output for %s", (_name, input) => {
    const result = resolveTokens(input);
    expect(result.isValid).toBe(false);
    expect(result.tokens).toEqual({});
    expect(result.traces).toEqual({});
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("names the top-level problem for non-array input", () => {
    expect(validateTokenLayers(null)).toEqual([expect.objectContaining({ code: "INVALID_LAYER" })]);
    expect(resolveTokens({}).issues).toEqual([expect.objectContaining({ code: "INVALID_LAYER" })]);
  });

  it("an empty stack is valid and resolves nothing", () => {
    const result = resolveTokens([]);
    expect(result.isValid).toBe(true);
    expect(result.tokens).toEqual({});
  });
});

describe("review follow-up: detached snapshots", () => {
  it("editing a dimension after resolution does not change the returned value, trace, or CSS", () => {
    const value = { value: 16, unit: "px" as const };
    const definition: TokenDefinition = { path: "space.4", type: "dimension", value, overridableBy: [] };
    const result = resolveTokens([layer("base", "primitive", [definition])]);
    expect(result.isValid).toBe(true);

    value.value = 99;
    (definition as { description?: string }).description = "edited later";

    const token = result.tokens["space.4"];
    expect((token?.value as DimensionValue).value).toBe(16);
    expect((token?.definition.value as DimensionValue).value).toBe(16);
    expect((token?.originalDefinition.value as DimensionValue).value).toBe(16);
    expect(token?.definition.description).toBeUndefined();
    expect((result.traces["space.4"]?.finalValue as DimensionValue).value).toBe(16);
    expect(generateCssVariables(result).variables["--hz-space-4"]).toBe("16px");
  });

  it("detaches arrays, references, override lists, and deprecation metadata", () => {
    const families = ["Noto Sans Arabic", "sans-serif"];
    const reference = { $ref: "font.family.base" };
    const overridableBy: LayerType[] = ["theme"];
    const deprecated = { since: "0.1.0", message: "Use font.family.base" };
    const result = resolveTokens([
      layer("base", "primitive", [
        { path: "font.family.base", type: "font-family", value: families, overridableBy },
        { path: "font.family.body", type: "font-family", value: reference, overridableBy: [], deprecated },
      ]),
    ]);
    expect(result.isValid).toBe(true);

    families.push("serif");
    reference.$ref = "font.family.other";
    overridableBy.push("context");
    deprecated.message = "changed";

    expect(result.tokens["font.family.base"]?.value).toEqual(["Noto Sans Arabic", "sans-serif"]);
    expect(result.tokens["font.family.body"]?.value).toEqual(["Noto Sans Arabic", "sans-serif"]);
    expect(result.tokens["font.family.base"]?.definition.overridableBy).toEqual(["theme"]);
    expect(result.tokens["font.family.body"]?.definition.value).toEqual({ $ref: "font.family.base" });
    expect(result.tokens["font.family.body"]?.definition.deprecated?.message).toBe("Use font.family.base");
    expect(result.traces["font.family.body"]?.referenceChain).toEqual(["font.family.body", "font.family.base"]);
    expect(generateCssVariables(result).variables["--hz-font-family-body"]).toBe('"Noto Sans Arabic", sans-serif');
  });

  it("returns deeply frozen results and leaves caller-owned objects unfrozen", () => {
    const value = { value: 4, unit: "px" as const };
    const definition: TokenDefinition = { path: "space.1", type: "dimension", value, overridableBy: [] };
    const stack = [layer("base", "primitive", [definition])];
    const result = resolveTokens(stack);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.tokens)).toBe(true);
    expect(Object.isFrozen(result.tokens["space.1"]?.value)).toBe(true);
    expect(Object.isFrozen(result.traces["space.1"]?.overrideHistory)).toBe(true);
    expect(Object.isFrozen(stack[0])).toBe(false);
    expect(Object.isFrozen(definition)).toBe(false);
    expect(Object.isFrozen(value)).toBe(false);
    expect(() => { (result.tokens["space.1"]?.value as { value: number }).value = 5; }).toThrow(TypeError);
  });

  it("invalid results are frozen snapshots too", () => {
    const result = resolveTokens(null);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.issues)).toBe(true);
  });
});

describe("review follow-up: generic font fallbacks", () => {
  it("keeps a named font quoted and a generic fallback unquoted", () => {
    const result = resolveTokens([
      layer("base", "primitive", [
        { path: "font.family.arabic", type: "font-family", value: ["Noto Sans Arabic", "sans-serif"], overridableBy: [] },
        { path: "font.family.ui", type: "font-family", value: ["IBM Plex Sans Arabic", "system-ui", "ui-sans-serif", "Sans-Serif"], overridableBy: [] },
        { path: "font.family.mono", type: "font-family", value: ["IBM Plex Mono", "ui-monospace", "monospace"], overridableBy: [] },
      ]),
    ]);
    const css = generateCssVariables(result);
    expect(css.isValid).toBe(true);
    expect(css.variables["--hz-font-family-arabic"]).toBe('"Noto Sans Arabic", sans-serif');
    expect(css.variables["--hz-font-family-ui"]).toBe('"IBM Plex Sans Arabic", system-ui, ui-sans-serif, sans-serif');
    expect(css.variables["--hz-font-family-mono"]).toBe('"IBM Plex Mono", ui-monospace, monospace');
  });

  it("still escapes quotes and backslashes in real family names", () => {
    const result = resolveTokens([
      layer("base", "primitive", [
        { path: "font.family.odd", type: "font-family", value: ['My "Quoted" Font', "Back\\slash", "serif"], overridableBy: [] },
      ]),
    ]);
    expect(generateCssVariables(result).variables["--hz-font-family-odd"]).toBe('"My \\"Quoted\\" Font", "Back\\\\slash", serif');
  });

  it("does not treat a family name that merely contains a generic keyword as generic", () => {
    const result = resolveTokens([
      layer("base", "primitive", [
        { path: "font.family.x", type: "font-family", value: ["Open Sans-Serif Display", "serif"], overridableBy: [] },
      ]),
    ]);
    expect(generateCssVariables(result).variables["--hz-font-family-x"]).toBe('"Open Sans-Serif Display", serif');
  });

  it("rejects unsafe family strings", () => {
    for (const family of ["", "   ", "Bad\nFont", "Bad\u0000Font"]) {
      const issues = validateTokenLayers([
        layer("base", "primitive", [{ path: "font.family.bad", type: "font-family", value: ["Noto Sans Arabic", family], overridableBy: [] }]),
      ]);
      expect(issues.map((entry) => entry.code)).toContain("INVALID_TOKEN_VALUE");
    }
  });
});

describe("review follow-up: box-shadow subset", () => {
  it("rejects a negative blur radius", () => {
    const issues = validateTokenLayers([shadowLayer("0px 0px -2px #000")]);
    expect(issues).toEqual([expect.objectContaining({ code: "INVALID_TOKEN_VALUE", affectedToken: "shadow.case.0" })]);
    expect(resolveTokens([shadowLayer("0px 0px -2px #000")]).isValid).toBe(false);
  });

  it("rejects a negative blur inside a multi-shadow list", () => {
    expect(validateTokenLayers([shadowLayer("0px 1px 2px #000, inset 0 0 -1px #fff")])).toHaveLength(1);
  });

  it("accepts negative offsets, negative spread, inset, unitless zero, and multi-shadow lists", () => {
    const valid = [
      "none",
      "-2px -4px 6px #00000033",
      "0px 4px 8px -2px #0F172A1F",
      "inset 0px 1px 0px #FFFFFF26",
      "0 0 0 1px currentColor",
      "0px 1px 2px #0000001A, 0px 8px 24px -4px #0000002E",
      "inset 0 0 0 2px #2457A6, 0 1px 2px transparent",
      "0.5rem 0.25em 1rem black",
    ];
    expect(validateTokenLayers([shadowLayer(...valid)])).toEqual([]);
    const css = generateCssVariables(resolveTokens([shadowLayer(...valid)]));
    expect(css.variables["--hz-shadow-case-2"]).toBe("0px 4px 8px -2px #0F172A1F");
  });

  it("rejects shapes outside the documented grammar", () => {
    const invalid = [
      "",
      "2px #000",
      "1px 2px 3px 4px 5px #000",
      "1px 2px 3px",
      "1px 2px 3px rgb(0 0 0)",
      "1px 2px 3pt #000",
      "1 2 3 #000",
      "none, 0 0 1px #000",
      "0px 1px 2px #000,",
      "inset inset 0 0 1px #000",
      "var(--shadow)",
    ];
    const issues = validateTokenLayers([shadowLayer(...invalid)]);
    expect(issues).toHaveLength(invalid.length);
    expect(issues.every((entry) => entry.code === "INVALID_TOKEN_VALUE")).toBe(true);
  });
});
