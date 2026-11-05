/** Framework-independent public contracts for the atomic token engine. */

export const TOKEN_TYPES = [
  "color",
  "dimension",
  "duration",
  "font-family",
  "font-weight",
  "opacity",
  "number",
  "integer",
  "shadow",
  "easing",
] as const;

export type TokenType = (typeof TOKEN_TYPES)[number];

export const TOKEN_LAYER_TYPES = [
  "primitive",
  "semantic",
  "theme",
  "visual-system",
  "context",
  "component",
  "recipe",
  "instance",
] as const;

export type LayerType = (typeof TOKEN_LAYER_TYPES)[number];
export type TokenPath = string;

export type DimensionUnit =
  | "px"
  | "rem"
  | "em"
  | "%"
  | "vh"
  | "vw"
  | "ch"
  | "ex"
  | "cm"
  | "mm"
  | "in"
  | "pt"
  | "pc";

export interface DimensionValue {
  readonly value: number;
  readonly unit: DimensionUnit;
}

export interface DurationValue {
  readonly value: number;
  readonly unit: "ms" | "s";
}

/** A reference is data, not string interpolation. Its target must resolve to the owning token type. */
export interface TokenReference<T extends TokenType = TokenType> {
  readonly $ref: TokenPath;
  readonly expectedType?: T;
}

export interface TokenValueMap {
  readonly color: string;
  readonly dimension: DimensionValue;
  readonly duration: DurationValue;
  readonly "font-family": readonly string[];
  readonly "font-weight": number;
  readonly opacity: number;
  readonly number: number;
  readonly integer: number;
  readonly shadow: string;
  readonly easing: string;
}

export type TokenValue<T extends TokenType> = TokenValueMap[T] | TokenReference<T>;

export interface DeprecationMetadata {
  readonly since: string;
  readonly message?: string;
  readonly replacement?: TokenPath;
}

export type TokenDefinition = {
  readonly [T in TokenType]: {
    readonly path: TokenPath;
    readonly type: T;
    readonly value: TokenValue<T>;
    readonly description?: string;
    /** Permissions are checked against the first/original definition, never widened by an override. */
    readonly overridableBy: readonly LayerType[];
    readonly deprecated?: DeprecationMetadata;
  };
}[TokenType];

export interface TokenLayer<T extends LayerType = LayerType> {
  readonly id: string;
  readonly type: T;
  readonly tokens: readonly TokenDefinition[];
}

export interface TokenSource {
  readonly id: string;
  readonly type: LayerType;
}

export interface TokenOverrideTrace {
  readonly tokenPath: TokenPath;
  readonly from: TokenSource;
  readonly to: TokenSource;
}

export interface ResolvedToken {
  readonly path: TokenPath;
  readonly type: TokenType;
  readonly value: TokenValueMap[TokenType];
  readonly originalDefinition: TokenDefinition;
  /** Winning definition after all authorized overrides. */
  readonly definition: TokenDefinition;
  /** Layer that supplied the winning definition. */
  readonly sourceLayer: TokenSource;
  /** Layer that supplied the terminal literal value after following aliases. */
  readonly valueSource: TokenSource;
  readonly overrideHistory: readonly TokenOverrideTrace[];
  /** Starts at this token and ends at the token containing the terminal literal. */
  readonly referenceChain: readonly TokenPath[];
}

export interface TokenTrace {
  readonly tokenPath: TokenPath;
  readonly originalDefinition: TokenDefinition;
  readonly definition: TokenDefinition;
  readonly sourceLayer: TokenSource;
  readonly sourceLayerType: LayerType;
  readonly valueSource: TokenSource;
  readonly overrideHistory: readonly TokenOverrideTrace[];
  readonly referenceChain: readonly TokenPath[];
  readonly finalValue: TokenValueMap[TokenType];
}

export type TokenIssueCode =
  | "INVALID_LAYER"
  | "DUPLICATE_LAYER_ID"
  | "UNSUPPORTED_LAYER_TYPE"
  | "INVALID_TOKEN_DEFINITION"
  | "UNSUPPORTED_TOKEN_TYPE"
  | "INVALID_TOKEN_PATH"
  | "DUPLICATE_TOKEN_DEFINITION"
  | "INVALID_TOKEN_VALUE"
  | "INVALID_DIMENSION"
  | "INVALID_DURATION"
  | "INVALID_OPACITY"
  | "INVALID_FONT_WEIGHT"
  | "INVALID_INTEGER"
  | "UNKNOWN_REFERENCE"
  | "REFERENCE_CYCLE"
  | "TOKEN_TYPE_MISMATCH"
  | "UNAUTHORIZED_OVERRIDE"
  | "CSS_VARIABLE_COLLISION"
  | "INVALID_CSS_NAMESPACE";

export interface TokenIssue {
  readonly code: TokenIssueCode;
  readonly affectedToken?: TokenPath;
  readonly sourceLayer?: string;
  readonly sourceLayerType?: LayerType;
  readonly explanation: string;
  readonly referenceChain?: readonly TokenPath[];
  readonly overrideChain?: readonly TokenOverrideTrace[];
}

export interface TokenResolutionResult {
  readonly isValid: boolean;
  readonly tokens: Readonly<Record<string, ResolvedToken>>;
  readonly traces: Readonly<Record<string, TokenTrace>>;
  readonly issues: readonly TokenIssue[];
}

export interface CssVariableResult {
  readonly isValid: boolean;
  readonly variables: Readonly<Record<string, string>>;
  readonly css: string;
  readonly issues: readonly TokenIssue[];
}
