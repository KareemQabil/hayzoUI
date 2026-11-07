/** Ordered, framework-agnostic collection model for flat and nested options. */

export interface CollectionItem<T> {
  key: string
  value: T
  textValue: string
  disabled?: boolean
  children?: CollectionItem<T>[]
}

export interface Collection<T> {
  readonly items: readonly CollectionItem<T>[]
  readonly size: number
  get(key: string): CollectionItem<T> | undefined
  keys(): readonly string[]
  next(key: string | null, opts?: { wrap?: boolean; skipDisabled?: boolean }): string | null
  prev(key: string | null, opts?: { wrap?: boolean; skipDisabled?: boolean }): string | null
  first(skipDisabled?: boolean): string | null
  last(skipDisabled?: boolean): string | null
  flatten(expanded: ReadonlySet<string>): readonly { key: string; depth: number; parent: string | null }[]
}

export type CollectionErrorCode = 'DUPLICATE_KEY' | 'INVALID_ITEM' | 'CYCLIC_ITEMS'

export class CollectionError extends Error {
  readonly name = 'CollectionError'
  readonly code: CollectionErrorCode
  readonly key: string
  constructor(code: CollectionErrorCode, key: string, message: string) {
    super(message)
    this.code = code
    this.key = key
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

interface Entry<T> {
  readonly item: CollectionItem<T>
  readonly key: string
  readonly depth: number
  readonly parent: string | null
}

/**
 * Snapshot the caller's tree to avoid changes in source arrays changing the model.
 * Navigation is in preorder (document order); expanded state¶»§q«^