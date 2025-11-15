/**
 * @fileoverview Startup environment checks and endpoint stability utilities
 * @module lib/startup-checks
 * 
 * Validates environment variables, wraps external calls with error handling,
 * implements graceful degradation, and provides request/response validation.
 */

// ========================================
// TYPES
// ========================================

export interface EnvironmentCheckResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
  recommendations: string[];
}

export interface ApiCallResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  duration: number;
  service: string;
}

// ========================================
// ENVIRONMENT VARIABLE CHECKS
// ========================================

/**
 * Critical environment variables required for core functionality
 */
const CRITICAL_ENV_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
] as const;

/**
 * Optional environment variables for external API connectors
 */
const OPTIONAL_ENV_VARS = [
  'YOUTUBE_API_KEY',
  'UNSPLASH_ACCESS_KEY',
  'GOOGLE_SEARCH_API_KEY',
  'GOOGLE_SEARCH_ENGINE_ID',
  'NEWSAPI_KEY',
  'NEXT_PUBLIC_GEMINI_API_KEY',
] as const;

/**
 * Checks all required and optional environment variables on startup
 * @returns Environment check result with status and recommendations
 */
export function checkEnvironmentVariables(): EnvironmentCheckResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  console.log('[Startup] Checking environment variables...');

  // Check critical variables
  for (const varName of CRITICAL_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
      console.error(`[Startup] ❌ CRITICAL: ${varName} is not set`);
    } else {
      console.log(`[Startup] ✓ ${varName} is configured`);
    }
  }

  // Check optional variables
  let configuredConnectors = 0;
  for (const varName of OPTIONAL_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(`${varName} not configured`);
      console.warn(`[Startup] ⚠️  ${varName} not set - connector will use fallback data`);
    } else {
      configuredConnectors++;
      console.log(`[Startup] ✓ ${varName} is configured`);
    }
  }

  // Generate recommendations
  if (missing.length > 0) {
    recommendations.push('Configure critical Firebase environment variables immediately');
    recommendations.push('Application may not function correctly without Firebase config');
  }

  if (configuredConnectors === 0) {
    recommendations.push('No API connectors configured - application will use fallback data only');
    recommendations.push('For production use, configure at least one external API connector');
  } else if (configuredConnectors < OPTIONAL_ENV_VARS.length) {
    recommendations.push(`Only ${configuredConnectors}/${OPTIONAL_ENV_VARS.length} connectors configured`);
    recommendations.push('Consider configuring additional connectors for better data coverage');
  }

  // Check if fallback mode is explicitly enabled
  if (process.env.NEXT_PUBLIC_USE_FALLBACKS === 'true') {
    console.log('[Startup] ℹ️  Fallback mode explicitly enabled');
    recommendations.push('Fallback mode is enabled - using sample data instead of live APIs');
  }

  const valid = missing.length === 0;
  
  if (valid) {
    console.log('[Startup] ✅ Environment validation passed');
  } else {
    console.error(`[Startup] ❌ Environment validation failed: ${missing.length} critical variables missing`);
  }

  return {
    valid,
    missing,
    warnings,
    recommendations,
  };
}

// ========================================
// SAFE API CALL WRAPPER
// ========================================

/**
 * Wraps external API calls with comprehensive error handling and logging
 * @param serviceName - Name of the service being called
 * @param apiCall - Async function that makes the API call
 * @param fallbackValue - Value to return if the call fails
 * @returns Promise with result containing success status, data, and metadata
 */
export async function safeApiCall<T>(
  serviceName: string,
  apiCall: () => Promise<T>,
  fallbackValue: T
): Promise<ApiCallResult<T>> {
  const startTime = Date.now();
  
  try {
    console.log(`[SafeAPI][${serviceName}] Starting request...`);
    
    const data = await apiCall();
    const duration = Date.now() - startTime;
    
    console.log(`[SafeAPI][${serviceName}] ✓ Success (${duration}ms)`);
    
    return {
      success: true,
      data,
      duration,
      service: serviceName,
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    
    console.error(
      `[SafeAPI][${serviceName}] ✗ Failed after ${duration}ms:`,
      err.message
    );
    
    // Log stack trace in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[SafeAPI][${serviceName}] Stack:`, err.stack);
    }
    
    return {
      success: false,
      data: fallbackValue,
      error: err,
      duration,
      service: serviceName,
    };
  }
}

// ========================================
// GRACEFUL DEGRADATION
// ========================================

/**
 * Tracks connector health and determines if degradation is needed
 */
class ConnectorHealthTracker {
  private failures: Map<string, number> = new Map();
  private readonly MAX_FAILURES = 3;
  private readonly RESET_INTERVAL = 300000; // 5 minutes

  recordFailure(connector: string): void {
    const current = this.failures.get(connector) || 0;
    this.failures.set(connector, current + 1);
    
    if (current + 1 >= this.MAX_FAILURES) {
      console.warn(
        `[Health] ${connector} has failed ${current + 1} times - consider using fallback`
      );
    }
    
    // Auto-reset after interval
    setTimeout(() => {
      this.failures.delete(connector);
    }, this.RESET_INTERVAL);
  }

  recordSuccess(connector: string): void {
    this.failures.delete(connector);
  }

  shouldUseFallback(connector: string): boolean {
    const failures = this.failures.get(connector) || 0;
    return failures >= this.MAX_FAILURES;
  }

  getHealth(connector: string): { healthy: boolean; failures: number } {
    const failures = this.failures.get(connector) || 0;
    return {
      healthy: failures < this.MAX_FAILURES,
      failures,
    };
  }

  getAllHealth(): Record<string, { healthy: boolean; failures: number }> {
    const health: Record<string, { healthy: boolean; failures: number }> = {};
    
    for (const [connector, failures] of this.failures.entries()) {
      health[connector] = {
        healthy: failures < this.MAX_FAILURES,
        failures,
      };
    }
    
    return health;
  }
}

// Singleton health tracker
export const connectorHealth = new ConnectorHealthTracker();

// ========================================
// REQUEST/RESPONSE VALIDATION
// ========================================

/**
 * Validates that a request has required parameters
 * @param params - Request parameters to validate
 * @param required - Array of required parameter names
 * @returns Validation result with missing parameters
 */
export function validateRequest(
  params: Record<string, any>,
  required: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  for (const param of required) {
    if (params[param] === undefined || params[param] === null || params[param] === '') {
      missing.push(param);
    }
  }
  
  if (missing.length > 0) {
    console.warn('[Validation] Request missing required parameters:', missing);
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validates API response has expected structure
 * @param response - API response to validate
 * @param expectedFields - Array of expected field names
 * @returns Validation result
 */
export function validateResponse(
  response: any,
  expectedFields: string[]
): { valid: boolean; missing: string[] } {
  if (!response || typeof response !== 'object') {
    console.warn('[Validation] Response is not an object');
    return { valid: false, missing: expectedFields };
  }
  
  const missing: string[] = [];
  
  for (const field of expectedFields) {
    if (!(field in response)) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    console.warn('[Validation] Response missing expected fields:', missing);
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Sanitizes query parameters to prevent injection attacks
 * @param query - Query string to sanitize
 * @returns Sanitized query string
 */
export function sanitizeQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }
  
  // Remove potential SQL injection patterns
  let sanitized = query.replace(/[;\-\-\/\*]/g, '');
  
  // Limit length
  sanitized = sanitized.slice(0, 500);
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

// ========================================
// STARTUP INITIALIZATION
// ========================================

/**
 * Run all startup checks and log results
 * Call this at application startup
 */
export function runStartupChecks(): void {
  console.log('═══════════════════════════════════════════');
  console.log('🚀 Gyaan AI - Startup Checks');
  console.log('═══════════════════════════════════════════');
  
  const envCheck = checkEnvironmentVariables();
  
  console.log('\n📋 Summary:');
  console.log(`  Environment: ${envCheck.valid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`  Critical vars: ${CRITICAL_ENV_VARS.length - envCheck.missing.length}/${CRITICAL_ENV_VARS.length} configured`);
  console.log(`  Optional vars: ${OPTIONAL_ENV_VARS.length - envCheck.warnings.length}/${OPTIONAL_ENV_VARS.length} configured`);
  
  if (envCheck.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    envCheck.recommendations.forEach(rec => console.log(`  • ${rec}`));
  }
  
  console.log('═══════════════════════════════════════════');
  console.log('✓ Startup checks complete\n');
}

// ========================================
// ERROR LOGGING UTILITIES
// ========================================

/**
 * Logs errors with appropriate severity and context
 * @param context - Where the error occurred
 * @param error - The error object or message
 * @param metadata - Additional context data
 */
export function logError(
  context: string,
  error: Error | string,
  metadata?: Record<string, any>
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const timestamp = new Date().toISOString();
  
  console.error(`[Error][${timestamp}][${context}] ${errorMessage}`);
  
  if (metadata) {
    console.error(`[Error][${context}] Metadata:`, JSON.stringify(metadata, null, 2));
  }
  
  if (error instanceof Error && error.stack) {
    console.error(`[Error][${context}] Stack:`, error.stack);
  }
  
  // In production, send to error tracking service (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error tracking service
    // Sentry.captureException(error, { tags: { context }, extra: metadata });
  }
}

/**
 * Logs warnings for non-critical issues
 * @param context - Where the warning occurred
 * @param message - Warning message
 * @param metadata - Additional context data
 */
export function logWarning(
  context: string,
  message: string,
  metadata?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  console.warn(`[Warning][${timestamp}][${context}] ${message}`);
  
  if (metadata) {
    console.warn(`[Warning][${context}] Metadata:`, metadata);
  }
}
