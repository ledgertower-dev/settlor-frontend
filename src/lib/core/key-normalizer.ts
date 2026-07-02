/**
 * Utility functions for normalizing object keys to snake_case
 */

/**
 * Converts a string from camelCase/PascalCase to snake_case
 * @example toSnakeCase('capacityNetGross') => 'capacity_net_gross'
 * @example toSnakeCase('XMLParser') => 'xml_parser'
 * @example toSnakeCase('already_snake_case') => 'already_snake_case'
 */
export function toSnakeCase(str: string): string {
  if (!str) return str

  return (
    str
      // Insert underscore before uppercase letters that follow lowercase letters
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      // Insert underscore before uppercase letters that are followed by lowercase (for XMLParser => xml_parser)
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      // Convert all to lowercase
      .toLowerCase()
      // Replace multiple underscores with single underscore
      .replace(/_+/g, '_')
      // Remove leading/trailing underscores
      .replace(/^_|_$/g, '')
  )
}

/**
 * Converts a snake_case string to a display-friendly format
 * @example toDisplayName('capacity_net_gross') => 'Capacity Net Gross'
 */
export function toDisplayName(str: string): string {
  if (!str) return str

  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Recursively normalizes all keys in an object to snake_case
 * @param obj The object to normalize
 * @returns A new object with all keys converted to snake_case
 */
export function normalizeObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item =>
      typeof item === 'object' && item !== null
        ? normalizeObjectKeys(item as Record<string, unknown>)
        : item,
    ) as unknown as Record<string, unknown>
  }

  if (typeof obj !== 'object') {
    return obj
  }

  const normalized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = toSnakeCase(key)

    // Recursively normalize nested objects
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      normalized[normalizedKey] = normalizeObjectKeys(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      normalized[normalizedKey] = value.map(item =>
        typeof item === 'object' && item !== null
          ? normalizeObjectKeys(item as Record<string, unknown>)
          : item,
      )
    } else {
      normalized[normalizedKey] = value
    }
  }

  return normalized
}
