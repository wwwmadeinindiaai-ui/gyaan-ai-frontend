/**
 * @fileoverview Zod validation schemas for connector responses
 * @module lib/connector-schemas
 * 
 * Provides runtime validation for all external connector responses
 * to ensure data integrity and type safety across the application.
 */
import { z } from "zod";

// ========================================
// BASE SCHEMAS
// ========================================

/**
 * Schema for the standard connector output format
 * All connectors must return data matching this schema
 */
export const ConnectorOutputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Invalid URL format"),
  snippet: z.string().optional(),
  thumbnail: z.string().url("Invalid thumbnail URL").optional().or(z.literal('')),
  source: z.string().min(1, "Source is required"),
  publishedAt: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Invalid date format").optional()),
});

/**
 * Type inference from the schema
 */
export type ValidatedConnectorOutput = z.infer<typeof ConnectorOutputSchema>;

/**
 * Schema for an array of connector outputs
 */
export const ConnectorResultsSchema = z.array(ConnectorOutputSchema);

// ========================================
// VALIDATION FUNCTIONS
// ========================================

/**
 * Validates a single connector output
 * @param data - Raw connector output data
 * @param connectorName - Name of the connector for logging
 * @returns Validated data or null if validation fails
 */
export function validateConnectorOutput(
  data: unknown,
  connectorName: string
): ValidatedConnectorOutput | null {
  try {
    return ConnectorOutputSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[${connectorName}] Validation error:`, error.errors);
    } else {
      console.error(`[${connectorName}] Unexpected validation error:`, error);
    }
    return null;
  }
}

/**
 * Validates an array of connector outputs
 * Filters out invalid items and returns only valid ones
 * @param data - Raw connector results array
 * @param connectorName - Name of the connector for logging
 * @returns Array of validated outputs
 */
export function validateConnectorResults(
  data: unknown[],
  connectorName: string
): ValidatedConnectorOutput[] {
  const validated: ValidatedConnectorOutput[] = [];
  
  data.forEach((item, index) => {
    try {
      const validItem = ConnectorOutputSchema.parse(item);
      validated.push(validItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn(
          `[${connectorName}] Item ${index} validation failed:`,
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
      }
    }
  });
  
  console.log(`[${connectorName}] Validated ${validated.length}/${data.length} items`);
  return validated;
}

/**
 * Safe validator that never throws, always returns an array
 * @param data - Raw connector results array
 * @param connectorName - Name of the connector for logging
 * @returns Array of validated outputs (empty array if all fail)
 */
export function safeValidateConnectorResults(
  data: unknown,
  connectorName: string
): ValidatedConnectorOutput[] {
  if (!Array.isArray(data)) {
    console.error(`[${connectorName}] Invalid data: expected array, got ${typeof data}`);
    return [];
  }
  
  return validateConnectorResults(data, connectorName);
}
