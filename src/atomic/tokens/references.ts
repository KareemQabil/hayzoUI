import { TOKEN_TYPES, type TokenReference, type TokenType } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isTokenType(value: unknown): value is TokenType {
  return typeof value === "string" && TOKEN_TYPES.some((type) => type === value);
}

export function isTokenReference(value: unknown): value is TokenReference {
  if (!isRecord(value) || typeof value.$ref !== "string") return false;

  const keys = Object.keys(value);
  if (!keys.every((key) => key === "$ref" || key === "expectedType")) return false;

  return value.expectedType === undefined || isTokenType(value.expectedType);
}

export function getTokenReference(value: unknown): TokenReference | undefined {
  return isTokenReference(value) ? value : undefined;
}
