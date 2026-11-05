import type { ResolvedToken, TokenTrace } from "./types";

/** Produces a serializable explanation for one resolved token. */
export function createTokenTrace(token: ResolvedToken): TokenTrace {
  return {
    tokenPath: token.path,
    originalDefinition: token.originalDefinition,
    definition: token.definition,
    sourceLayer: token.sourceLayer,
    sourceLayerType: token.sourceLayer.type,
    valueSource: token.valueSource,
    overrideHistory: token.overrideHistory,
    referenceChain: token.referenceChain,
    finalValue: token.value,
  };
}
