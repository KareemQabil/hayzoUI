import { composeTokenLayers } from "./layers";
import { compareTokenPaths } from "./paths";
import { isTokenReference } from "./references";
import { createTokenTrace } from "./provenance";
import { validateTokenLayers } from "./validation";
import type {
  ResolvedToken,
  TokenIssue,
  TokenLayer,
  TokenResolutionResult,
  TokenSource,
  TokenTrace,
  TokenValueMap,
} from "./types";

interface ValueResolution {
  readonly value: TokenValueMap[keyof TokenValueMap];
  readonly referenceChain: readonly string[];
  readonly valueSource: TokenSource;
}

function emptyResult(issues: readonly TokenIssue[]): TokenResolutionResult {
  return {
    isValid: false,
    tokens: {},
    traces: {},
    issues,
  };
}

/**
 * Resolves a complete stack atomically. Invalid stacks produce no resolved
 * values; the engine never substitutes a fallback for an invalid definition.
 */
export function resolveTokens(layers: readonly TokenLayer[]): TokenResolutionResult {
  const validationIssues = validateTokenLayers(layers);
  if (validationIssues.length > 0) return emptyResult(validationIssues);

  const composition = composeTokenLayers(layers);
  if (composition.issues.length > 0) return emptyResult(composition.issues);

  const memo = new Map<string, ValueResolution>();
  const defensiveIssues: TokenIssue[] = [];

  const resolveValue = (path: string, stack: readonly string[] = []): ValueResolution | undefined => {
    const cached = memo.get(path);
    if (cached) return cached;

    if (stack.includes(path)) {
      const cycle = [...stack, path];
      defensiveIssues.push({
        code: "REFERENCE_CYCLE",
        affectedToken: path,
        explanation: `Token reference cycle detected: ${cycle.join(" -> ")}.`,
        referenceChain: cycle,
      });
      return undefined;
    }

    const composed = composition.tokens.get(path);
    if (!composed) return undefined;

    const rawValue = composed.definition.value;
    if (isTokenReference(rawValue)) {
      const target = resolveValue(rawValue.$ref, [...stack, path]);
      if (!target) {
        defensiveIssues.push({
          code: "UNKNOWN_REFERENCE",
          affectedToken: path,
          sourceLayer: composed.sourceLayer.id,
          sourceLayerType: composed.sourceLayer.type,
          explanation: `Token "${path}" could not resolve reference "${rawValue.$ref}".`,
          referenceChain: [...stack, path, rawValue.$ref],
        });
        return undefined;
      }

      const resolved: ValueResolution = {
        value: target.value,
        referenceChain: [path, ...target.referenceChain],
        valueSource: target.valueSource,
      };
      memo.set(path, resolved);
      return resolved;
    }

    const resolved: ValueResolution = {
      value: rawValue,
      referenceChain: [path],
      valueSource: composed.sourceLayer,
    };
    memo.set(path, resolved);
    return resolved;
  };

  const tokens: Record<string, ResolvedToken> = {};
  const traces: Record<string, TokenTrace> = {};
  const paths = [...composition.tokens.keys()].sort(compareTokenPaths);

  for (const path of paths) {
    const composed = composition.tokens.get(path);
    const resolvedValue = resolveValue(path);
    if (!composed || !resolvedValue) continue;

    const token: ResolvedToken = {
      path,
      type: composed.definition.type,
      value: resolvedValue.value,
      originalDefinition: composed.originalDefinition,
      originalSourceLayer: composed.originalSourceLayer,
      definition: composed.definition,
      sourceLayer: composed.sourceLayer,
      valueSource: resolvedValue.valueSource,
      overrideHistory: composed.overrideHistory,
      referenceChain: resolvedValue.referenceChain,
    };

    tokens[path] = token;
    traces[path] = createTokenTrace(token);
  }

  if (defensiveIssues.length > 0) return emptyResult(defensiveIssues);

  return {
    isValid: true,
    tokens,
    traces,
    issues: [],
  };
}
