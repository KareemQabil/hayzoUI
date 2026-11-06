type JsonValue = null | boolean | number | string | readonly JsonValue[] | { [key: string]: JsonValue }

export class SnapshotError extends Error {
  constructor(readonly path: string, message: string) {
    super(message)
  }
}

/** Clone JSON data without invoking getters/toJSON, then freeze only the new graph. */
export function jsonSnapshot(value: unknown, path: string): JsonValue {
  const ancestors = new Set<object>()
  function visit(input: unknown, location: string, depth: number): JsonValue {
    if (depth > 100) throw new SnapshotError(location, 'Payload nesting exceeds 100 levels.')
    if (input === null || typeof input === 'string' || typeof input === 'boolean') return input
    if (typeof input === 'number' && Number.isFinite(input)) return input
    if (typeof input !== 'object' || input === null) throw new SnapshotError(location, 'Expected finite, JSON-compatible data.')
    if (ancestors.has(input)) throw new SnapshotError(location, 'Cyclic payloads are not supported.')
    const prototype = Object.getPrototypeOf(input)
    if (!Array.isArray(input) && prototype !== Object.prototype && prototype !== null) {
      throw new SnapshotError(location, 'Expected a plain JSON object.')
    }
    ancestors.add(input)
    let output: JsonValue
    if (Array.isArray(input)) {
      const result: JsonValue[] = []
      for (let index = 0; index < input.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(input, String(index))
        if (!descriptor || !('value' in descriptor)) throw new SnapshotError(`${location}[${index}]`, 'Sparse arrays and accessors are not supported.')
        result.push(visit(descriptor.value, `${location}[${index}]`, depth + 1))
      }
      output = result
    } else {
      const result: { [key: string]: JsonValue } = Object.create(null)
      for (const key of Reflect.ownKeys(input)) {
        if (typeof key !== 'string') throw new SnapshotError(location, 'Symbol properties are not JSON data.')
        const descriptor = Object.getOwnPropertyDescriptor(input, key)!
        if (!('value' in descriptor)) throw new SnapshotError(`${location}.${key}`, 'Accessors are not supported.')
        // Match JSON object semantics for optional properties; array holes are rejected above.
        if (descriptor.value !== undefined) result[key] = visit(descriptor.value, `${location}.${key}`, depth + 1)
      }
      output = result
    }
    ancestors.delete(input)
    return Object.freeze(output)
  }
  return visit(value, path, 0)
}
