import type {
  LayerType,
  TokenDefinition,
  TokenIssue,
  TokenLayer,
  TokenOverrideTrace,
  TokenSource,
} from "./types";

/**
 * Lower-to-higher precedence. Layer input order is preserved only among layers
 * of the same type; cross-type order is always canonical.
 */
export const LAYER_PRECEDENCE: Readonly<Record<LayerType, number>> = {
  primitive: 0,
  semantic: 1,
  theme: 2,
  "visual-system": 3,
  context: 4,
  component: 5,
  recipe: 6,
  instance: 7,
};

export interface ComposedToken {
  readonly originalDefinition: TokenDefinition;
  readonly originalSourceLayer: TokenSource;
  readonly definition: TokenDefinition;
  readonly sourceLayer: TokenSource;
  readonly overrideHistory: readonly TokenOverrideTrace[];
}

export interface LayerCompositionResult {
  readonly tokens: ReadonlyMap<string, ComposedToken>;
  readonly issues: readonly TokenIssue[];
}

export function orderTokenLayers(layers: readonly TokenLayer[]): TokenLayer[] {
  return layers
    .map((layer, index) => ({ layer, index }))
    .sort((left, right) => {
      const precedence = LAYER_PRECEDENCE[left.layer.type] - LAYER_PRECEDENCE[right.layer.type];
      return precedence === 0 ? left.index - right.index : precedence;
    })
    .map(({ layer }) => layer);
}

/**
 * Composes definitions without mutating source layers. Override permissions are
 * read from the original definition, so an override cannot grant new permissions.
 */
export function composeTokenLayers(layers: readonly TokenLayer[]): LayerCompositionResult {
  const composed = new Map<string, ComposedToken>();
  const issues: TokenIssue[] = [];

  for (const layer of orderTokenLayers(layers)) {
    const source: TokenSource = { id: layer.id, type: layer.type };

    for (const definition of layer.tokens) {
      const previous = composed.get(definition.path);

      if (!previous) {
        composed.set(definition.path, {
          originalDefinition: definition,
          originalSourceLayer: source,
          definition,
          sourceLayer: source,
          overrideHistory: [],
        });
        continue;
      }

      const attempted: TokenOverrideTrace = {
        tokenPath: definition.path,
        from: previous.sourceLayer,
        to: source,
      };
      const attemptedHistory = [...previous.overrideHistory, attempted];

      if (!previous.originalDefinition.overridableBy.includes(layer.type)) {
        issues.push({
          code: "UNAUTHORIZED_OVERRIDE",
          affectedToken: definition.path,
          sourceLayer: layer.id,
          sourceLayerType: layer.type,
          explanation: `Layer "${layer.id}" cannot override "${definition.path}": the original definition does not permit layer type "${layer.type}".`,
          overrideChain: attemptedHistory,
        });
        continue;
      }

      if (previous.definition.type !== definition.type) {
        issues.push({
          code: "TOKEN_TYPE_MISMATCH",
          affectedToken: definition.path,
          sourceLayer: layer.id,
          sourceLayerType: layer.type,
          explanation: `Override type "${definition.type}" does not match the original token type "${previous.definition.type}".`,
          overrideChain: attemptedHistory,
        });
        continue;
      }

      composed.set(definition.path, {
        originalDefinition: previous.originalDefinition,
        originalSourceLayer: previous.originalSourceLayer,
        definition,
        sourceLayer: source,
        overrideHistory: attemptedHistory,
      });
    }
  }

  return { tokens: composed, issues };
}
