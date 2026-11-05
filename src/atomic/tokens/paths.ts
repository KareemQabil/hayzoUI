import type { TokenPath } from "./types";

/**
 * Token paths are dot-separated lowercase identifiers. Segments may be words,
 * hyphenated words, or numeric scale values (for example: color.palette.blue.600).
 */
const TOKEN_SEGMENT = /^(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)*|[0-9]+(?:-[0-9]+)?)$/;
const LAYER_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export function isValidTokenPath(path: string): path is TokenPath {
  if (path.length === 0 || path.length > 240) return false;
  return path.split(".").every((segment) => TOKEN_SEGMENT.test(segment));
}

export function isValidLayerId(id: string): boolean {
  return id.length <= 80 && LAYER_ID.test(id);
}

export function compareTokenPaths(left: TokenPath, right: TokenPath): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
