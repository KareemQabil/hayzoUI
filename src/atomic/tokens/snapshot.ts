import type { TokenDefinition, TokenLayer } from "./types";

/**
 * Detached snapshots. The resolver copies validated input before composing it,
 * so later edits to caller-owned objects never reach a returned result, and it
 * freezes only its own copies — never the caller's objects.
 */

/** Copies JSON-shaped data (plain objects, arrays, primitives). Only called on validated, finite structures. */
export function cloneData<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item: unknown) => cloneData(item)) as T;
  if (typeof value === "object" && value !== null) {
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(value)) copy[key] = cloneData((value as Record<string, unknown>)[key]);
    return copy as T;
  }
  return value;
}

/** Copies an already-validated layer stack into engine-owned objects. */
export function snapshotLayers(layers: readonly TokenLayer[]): TokenLayer[] {
  return layers.map((layer) => ({
    id: layer.id,
    type: layer.type,
    tokens: layer.tokens.map((definition) => cloneData<TokenDefinition>(definition)),
  }));
}

/** Freezes an engine-owned object graph. Shared nodes are visited once. */
export function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key]);
  return value;
}
