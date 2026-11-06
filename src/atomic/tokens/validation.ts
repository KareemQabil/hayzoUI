import { composeTokenLayers, type ComposedToken } from "./layers";
import { validateCssVariableNames } from "./css-variables";
import { isValidLayerId, isValidTokenPath, compareTokenPaths } from "./paths";
import { getTokenReference, isTokenReference, isTokenType } from "./references";
import {
  TOKEN_LAYER_TYPES,
  type DimensionUnit,
  type LayerType,
  type TokenDefinition,
  type TokenIssue,
  type TokenLayer,
  type TokenType,
} from "./types";

const DIMENSION_UNITS: readonly DimensionUnit[] = [
  "px", "rem", "em", "%", "vh", "vw", "ch", "ex", "cm", "mm", "in", "pt", "pc",
];
const SAFE_COLOR = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;
const SAFE_COLOR_KEYWORDS = new Set(["transparent", "currentcolor", "black", "white"]);
const CSS_LENGTH = "-?(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:px|rem|em)";
const CSS_SHADOW_COLOR = "(?:#[\\da-f]{3}|#[\\da-f]{4}|#[\\da-f]{6}|#[\\da-f]{8}|transparent|currentColor|black|white)";
const CSS_SHADOW = new RegExp(
  `^(?:inset\\s+)?${CSS_LENGTH}\\s+${CSS_LENGTH}(?:\\s+${CSS_LENGTH})?(?:\\s+${CSS_LENGTH})?\\s+${CSS_SHADOW_COLOR}$`,
  "i",
);
const NUMBER = "-?(?:\\d+(?:\\.\\d+)?|\\.\\d+)";
const CUBIC_BEZIER = new RegExp(
  `^cubic-bezier\\(\\s*(${NUMBER})\\s*,\\s*(${NUMBER})\\s*,\\s*(${NUMBER})\\s*,\\s*(${NUMBER})\\s*\\)$`,
  "i",
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLayerType(value: unknown): value is LayerType {
  return typeof value === "string" && TOKEN_LAYER_TYPES.some((type) => type === value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasSafeText(value: string): boolean {
  return value.trim().length > 0 && !/[\u0000-\u001f\u007f]/.test(value);
}

function isSupportedColor(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return SAFE_COLOR.test(normalized) || SAFE_COLOR_KEYWORDS.has(normalized);
}

function isSupportedShadow(value: string): boolean {
  const normalized = value.trim();
  if (normalized === "none") return true;
  return normalized.length > 0 && normalized.split(/\s*,\s*/).every((shadow) => CSS_SHADOW.test(shadow));
}

function isSupportedEasing(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (["linear", "ease", "ease-in", "ease-out", "ease-in-out"].includes(normalized)) return true;

  const match = CUBIC_BEZIER.exec(normalized);
  if (!match) return false;
  const values = match.slice(1).map(Number);
  return values.every(Number.isFinite) && values[0] >= 0 && values[0] <= 1 && values[2] >= 0 && values[2] <= 1;
}

function hasValueShape(type: TokenType, value: unknown): boolean {
  if (isTokenReference(value)) return true;

  switch (type) {
    case "color":
    case "shadow":
    case "easing":
      return typeof value === "string";
    case "dimension":
    case "duration":
      return isRecord(value) &&
        Object.keys(value).every((key) => key === "value" || key === "unit") &&
        typeof value.value === "number" &&
        typeof value.unit === "string";
    case "font-family":
      return Array.isArray(value) && value.every((family: unknown) => typeof family === "string");
    case "font-weight":
    case "opacity":
    case "number":
    case "integer":
      return typeof value === "number";
  }

  return false;
}

function isTokenDefinitionShape(value: unknown): value is TokenDefinition {
  if (!isRecord(value) || typeof value.path !== "string" || !isTokenType(value.type)) return false;
  const allowedKeys = new Set(["path", "type", "value", "description", "overridableBy", "deprecated"]);
  if (!Object.keys(value).every((key) => allowedKeys.has(key))) return false;
  if (!Array.isArray(value.overridableBy) || !value.overridableBy.every(isLayerType)) return false;
  if (new Set(value.overridableBy).size !== value.overridableBy.length) return false;
  if (value.description !== undefined && typeof value.description !== "string") return false;

  if (value.deprecated !== undefined) {
    if (!isRecord(value.deprecated) || typeof value.deprecated.since !== "string" || !hasSafeText(value.deprecated.since)) return false;
    const allowedDeprecationKeys = new Set(["since", "message", "replacement"]);
    if (!Object.keys(value.deprecated).every((key) => allowedDeprecationKeys.has(key))) return false;
    if (value.deprecated.message !== undefined && typeof value.deprecated.message !== "string") return false;
    if (value.deprecated.replacement !== undefined && typeof value.deprecated.replacement !== "string") return false;
    if (typeof value.deprecated.replacement === "string" && !isValidTokenPath(value.deprecated.replacement)) return false;
  }

  return hasValueShape(value.type, value.value);
}

function issue(
  code: TokenIssue["code"],
  explanation: string,
  details: Omit<TokenIssue, "code" | "explanation"> = {},
): TokenIssue {
  return { code, explanation, ...details };
}

function validateDefinitionValue(definition: TokenDefinition, sourceLayer: string, sourceLayerType: LayerType): TokenIssue[] {
  const details = { affectedToken: definition.path, sourceLayer, sourceLayerType };
  const value: unknown = definition.value;

  if (isTokenReference(value)) {
    const referenceIssues: TokenIssue[] = [];
    if (!isValidTokenPath(value.$ref)) {
      referenceIssues.push(issue("INVALID_TOKEN_PATH", `Reference path "${value.$ref}" is not a valid token path.`, {
        ...details,
        referenceChain: [definition.path, value.$ref],
      }));
    }
    if (value.expectedType !== undefined && value.expectedType !== definition.type) {
      referenceIssues.push(issue("TOKEN_TYPE_MISMATCH", `Reference declares expected type "${value.expectedType}" but "${definition.path}" is "${definition.type}".`, {
        ...details,
        referenceChain: [definition.path, value.$ref],
      }));
    }
    return referenceIssues;
  }

  switch (definition.type) {
    case "color":
      return typeof value === "string" && isSupportedColor(value)
        ? []
        : [issue("INVALID_TOKEN_VALUE", `Color token "${definition.path}" must use a supported hex color or one of: transparent, currentColor, black, white.`, details)];

    case "dimension":
      if (
        !isRecord(value) ||
        !isFiniteNumber(value.value) ||
        typeof value.unit !== "string" ||
        !DIMENSION_UNITS.some((unit) => unit === value.unit)
      ) {
        return [issue("INVALID_DIMENSION", `Dimension token "${definition.path}" requires a finite number and a supported unit (${DIMENSION_UNITS.join(", ")}).`, details)];
      }
      return [];

    case "duration":
      if (!isRecord(value) || !isFiniteNumber(value.value) || (value.unit !== "ms" && value.unit !== "s") || value.value < 0) {
        return [issue("INVALID_DURATION", `Duration token "${definition.path}" must be non-negative and use ms or s.`, details)];
      }
      return [];

    case "font-family":
      if (!Array.isArray(value) || value.length === 0 || !value.every((family: unknown) => typeof family === "string" && hasSafeText(family))) {
        return [issue("INVALID_TOKEN_VALUE", `Font-family token "${definition.path}" must be a non-empty list of safe family names.`, details)];
      }
      return [];

    case "font-weight":
      return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 1000
        ? []
        : [issue("INVALID_FONT_WEIGHT", `Font weight "${definition.path}" must be an integer from 1 through 1000.`, details)];

    case "opacity":
      return isFiniteNumber(value) && value >= 0 && value <= 1
        ? []
        : [issue("INVALID_OPACITY", `Opacity token "${definition.path}" must be between 0 and 1 inclusive.`, details)];

    case "number":
      return isFiniteNumber(value)
        ? []
        : [issue("INVALID_TOKEN_VALUE", `Number token "${definition.path}" must be finite.`, details)];

    case "integer":
      return typeof value === "number" && Number.isSafeInteger(value)
        ? []
        : [issue("INVALID_INTEGER", `Integer token "${definition.path}" must be a safe integer.`, details)];

    case "shadow":
      return typeof value === "string" && isSupportedShadow(value)
        ? []
        : [issue("INVALID_TOKEN_VALUE", `Shadow token "${definition.path}" is outside the supported box-shadow subset.`, details)];

    case "easing":
      return typeof value === "string" && isSupportedEasing(value)
        ? []
        : [issue("INVALID_TOKEN_VALUE", `Easing token "${definition.path}" must be a supported keyword or cubic-bezier() value.`, details)];
  }

  return [issue("INVALID_TOKEN_VALUE", `Token "${definition.path}" has an unsupported value.`, details)];
}

function validateReferenceGraph(tokens: ReadonlyMap<string, ComposedToken>): TokenIssue[] {
  const issues: TokenIssue[] = [];
  const paths = [...tokens.keys()].sort(compareTokenPaths);

  for (const path of paths) {
    const token = tokens.get(path);
    if (!token) continue;
    const reference = getTokenReference(token.definition.value);
    if (!reference || !isValidTokenPath(reference.$ref)) continue;

    const target = tokens.get(reference.$ref);
    if (!target) {
      issues.push(issue("UNKNOWN_REFERENCE", `Token "${path}" references unknown token "${reference.$ref}".`, {
        affectedToken: path,
        sourceLayer: token.sourceLayer.id,
        sourceLayerType: token.sourceLayer.type,
        referenceChain: [path, reference.$ref],
      }));
    } else if (target.definition.type !== token.definition.type) {
      issues.push(issue("TOKEN_TYPE_MISMATCH", `Token "${path}" has type "${token.definition.type}" but its reference target "${reference.$ref}" has type "${target.definition.type}".`, {
        affectedToken: path,
        sourceLayer: token.sourceLayer.id,
        sourceLayerType: token.sourceLayer.type,
        referenceChain: [path, reference.$ref],
      }));
    }
  }

  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];

  const visit = (path: string): void => {
    const currentState = state.get(path) ?? 0;
    if (currentState === 2) return;
    if (currentState === 1) {
      const cycleStart = stack.indexOf(path);
      const cycle = [...stack.slice(cycleStart), path];
      const token = tokens.get(path);
      issues.push(issue("REFERENCE_CYCLE", `Token reference cycle detected: ${cycle.join(" -> ")}.`, {
        affectedToken: path,
        sourceLayer: token?.sourceLayer.id,
        sourceLayerType: token?.sourceLayer.type,
        referenceChain: cycle,
      }));
      return;
    }

    state.set(path, 1);
    stack.push(path);
    const token = tokens.get(path);
    if (token) {
      const reference = getTokenReference(token.definition.value);
      const target = reference ? tokens.get(reference.$ref) : undefined;
      // Traverse even mismatched edges so a cycle is reported alongside type errors.
      if (reference && target) visit(reference.$ref);
    }
    stack.pop();
    state.set(path, 2);
  };

  for (const path of paths) visit(path);
  return issues;
}

/**
 * Validates untrusted token-layer data without browser APIs or side effects.
 * The input accepts unknown so JSON-loaded token files can be checked safely.
 */
export function validateTokenLayers(layers: readonly unknown[]): TokenIssue[] {
  const issues: TokenIssue[] = [];
  const sanitizedLayers: TokenLayer[] = [];
  const seenLayerIds = new Set<string>();

  for (const rawLayer of layers) {
    if (!isRecord(rawLayer)) {
      issues.push(issue("INVALID_LAYER", "Each token layer must be an object."));
      continue;
    }

    const id = typeof rawLayer.id === "string" ? rawLayer.id : undefined;
    const type = isLayerType(rawLayer.type) ? rawLayer.type : undefined;

    if (id === undefined || !isValidLayerId(id)) {
      issues.push(issue("INVALID_LAYER", "Layer id must be a lowercase kebab-case identifier.", {
        sourceLayer: id,
      }));
    } else if (seenLayerIds.has(id)) {
      issues.push(issue("DUPLICATE_LAYER_ID", `Layer id "${id}" is duplicated.`, { sourceLayer: id }));
    }
    if (id !== undefined) seenLayerIds.add(id);

    if (type === undefined) {
      issues.push(issue(
        typeof rawLayer.type === "string" ? "UNSUPPORTED_LAYER_TYPE" : "INVALID_LAYER",
        `Layer "${id ?? "(unknown)"}" has an unsupported or missing layer type.`,
        { sourceLayer: id },
      ));
    }

    if (!Array.isArray(rawLayer.tokens)) {
      issues.push(issue("INVALID_LAYER", `Layer "${id ?? "(unknown)"}" must contain a tokens array.`, {
        sourceLayer: id,
        sourceLayerType: type,
      }));
      continue;
    }
    if (id === undefined || type === undefined) continue;

    const rawTokens: readonly unknown[] = rawLayer.tokens;
    const validDefinitions: TokenDefinition[] = [];
    const seenPaths = new Set<string>();

    for (const rawDefinition of rawTokens) {
      if (isRecord(rawDefinition) && typeof rawDefinition.type === "string" && !isTokenType(rawDefinition.type)) {
        issues.push(issue("UNSUPPORTED_TOKEN_TYPE", `Token "${String(rawDefinition.path ?? "(unknown)")}" uses unsupported type "${rawDefinition.type}".`, {
          affectedToken: typeof rawDefinition.path === "string" ? rawDefinition.path : undefined,
          sourceLayer: id,
          sourceLayerType: type,
        }));
        continue;
      }

      if (!isTokenDefinitionShape(rawDefinition)) {
        issues.push(issue("INVALID_TOKEN_DEFINITION", `Layer "${id}" contains a malformed token definition.`, {
          affectedToken: isRecord(rawDefinition) && typeof rawDefinition.path === "string" ? rawDefinition.path : undefined,
          sourceLayer: id,
          sourceLayerType: type,
        }));
        continue;
      }

      const definition = rawDefinition;
      if (!isValidTokenPath(definition.path)) {
        issues.push(issue("INVALID_TOKEN_PATH", `Token path "${definition.path}" is invalid.`, {
          affectedToken: definition.path,
          sourceLayer: id,
          sourceLayerType: type,
        }));
        continue;
      }

      issues.push(...validateDefinitionValue(definition, id, type));

      if (seenPaths.has(definition.path)) {
        issues.push(issue("DUPLICATE_TOKEN_DEFINITION", `Layer "${id}" defines "${definition.path}" more than once.`, {
          affectedToken: definition.path,
          sourceLayer: id,
          sourceLayerType: type,
        }));
        continue;
      }

      seenPaths.add(definition.path);
      validDefinitions.push(definition);
    }

    sanitizedLayers.push({ id, type, tokens: validDefinitions });
  }

  const composition = composeTokenLayers(sanitizedLayers);
  issues.push(...composition.issues);
  issues.push(...validateReferenceGraph(composition.tokens));
  for (const cssIssue of validateCssVariableNames([...composition.tokens.keys()])) {
    const source = cssIssue.affectedToken === undefined
      ? undefined
      : composition.tokens.get(cssIssue.affectedToken)?.sourceLayer;
    issues.push({ ...cssIssue, sourceLayer: source?.id, sourceLayerType: source?.type });
  }
  return issues;
}
