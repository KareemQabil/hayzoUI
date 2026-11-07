import type {
  CssVariableResult,
  DimensionValue,
  DurationValue,
  ResolvedToken,
  TokenIssue,
  TokenResolutionResult,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDimensionValue(value: unknown): value is DimensionValue {
  return isRecord(value) && typeof value.value === "number" && typeof value.unit === "string";
}

function isDurationValue(value: unknown): value is DurationValue {
  return isRecord(value) && typeof value.value === "number" && typeof value.unit === "string";
}

function isFontFamilyList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((family: unknown) => typeof family === "string");
}

function formatNumber(value: number): string {
  return Object.is(value, -0) ? "0" : String(value);
}

function quoteCssString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * CSS generic font families (CSS Fonts 4). A list entry that equals one of these
 * keywords, ignoring ASCII case, is emitted unquoted so it keeps its generic meaning;
 * every other entry is a family name and is quoted and escaped.
 */
export const GENERIC_FONT_FAMILIES = [
  "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "math", "emoji", "fangsong",
  "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded",
] as const;

export function isGenericFontFamily(family: string): boolean {
  const normalized = family.trim().toLowerCase();
  return GENERIC_FONT_FAMILIES.some((generic) => generic === normalized);
}

function serializeFontFamily(family: string): string {
  return isGenericFontFamily(family) ? family.trim().toLowerCase() : quoteCssString(family);
}

function serializeToken(token: ResolvedToken): string | undefined {
  switch (token.type) {
    case "dimension":
      return isDimensionValue(token.value) ? `${formatNumber(token.value.value)}${token.value.unit}` : undefined;
    case "duration":
      return isDurationValue(token.value) ? `${formatNumber(token.value.value)}${token.value.unit}` : undefined;
    case "font-family":
      return isFontFamilyList(token.value) ? token.value.map(serializeFontFamily).join(", ") : undefined;
    case "font-weight":
    case "opacity":
    case "number":
    case "integer":
      return typeof token.value === "number" ? formatNumber(token.value) : undefined;
    case "color":
    case "shadow":
    case "easing":
      return typeof token.value === "string" ? token.value : undefined;
  }

  return undefined;
}

/** Converts a stable token path to a CSS custom-property name. */
export function toCssVariableName(path: string, namespace = "hz"): string {
  return `--${namespace}-${path.replace(/\./g, "-")}`;
}

/**
 * Validates path-to-custom-property names independently of CSS emission.
 * The same namespace is applied to every path, so collision identity is stable.
 */
export function validateCssVariableNames(paths: readonly string[], namespace = "hz"): TokenIssue[] {
  if (!/^[a-z][a-z0-9-]*$/.test(namespace)) {
    return [{
      code: "INVALID_CSS_NAMESPACE",
      explanation: `CSS namespace "${namespace}" must be lowercase kebab-case.`,
    }];
  }

  const pathByVariable = new Map<string, string>();
  const issues: TokenIssue[] = [];

  for (const path of [...new Set(paths)].sort()) {
    const variableName = toCssVariableName(path, namespace);
    const previousPath = pathByVariable.get(variableName);
    if (previousPath !== undefined && previousPath !== path) {
      issues.push({
        code: "CSS_VARIABLE_COLLISION",
        affectedToken: path,
        explanation: `Token paths "${previousPath}" and "${path}" both map to "${variableName}".`,
      });
      continue;
    }
    pathByVariable.set(variableName, path);
  }

  return issues;
}

/**
 * Emits a deterministic :root block. Path-to-name collisions are errors and
 * never result in last-write-wins behavior.
 */
export function generateCssVariables(
  resolution: TokenResolutionResult,
  namespace = "hz",
): CssVariableResult {
  if (!resolution.isValid) {
    return { isValid: false, variables: {}, css: "", issues: resolution.issues };
  }

  const paths = Object.keys(resolution.tokens).sort();
  const namingIssues = validateCssVariableNames(paths, namespace);
  if (namingIssues.length > 0) {
    return { isValid: false, variables: {}, css: "", issues: namingIssues };
  }

  const variables: Record<string, string> = {};
  const issues: TokenIssue[] = [];

  for (const path of paths) {
    const token = resolution.tokens[path];
    if (!token) continue;

    const variableName = toCssVariableName(path, namespace);
    const cssValue = serializeToken(token);
    if (cssValue === undefined) {
      issues.push({
        code: "INVALID_TOKEN_VALUE",
        affectedToken: path,
        sourceLayer: token.sourceLayer.id,
        sourceLayerType: token.sourceLayer.type,
        explanation: `Resolved value for "${path}" cannot be serialized to CSS.`,
      });
      continue;
    }

    variables[variableName] = cssValue;
  }

  if (issues.length > 0) {
    return { isValid: false, variables: {}, css: "", issues };
  }

  const declarations = Object.keys(variables)
    .sort()
    .map((name) => `  ${name}: ${variables[name]};`);
  const css = declarations.length === 0
    ? ":root {}"
    : `:root {\n${declarations.join("\n")}\n}`;

  return { isValid: true, variables, css, issues: [] };
}
