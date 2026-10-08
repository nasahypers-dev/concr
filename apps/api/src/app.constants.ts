/** Global route prefix: every REST endpoint lives under /api/v1 (spec §11). */
export const API_PREFIX = 'api/v1';

/** Swagger UI path (not under the versioned prefix). */
export const SWAGGER_PATH = 'api/docs';

/** Reported by /health and Swagger. npm sets npm_package_version when started via scripts. */
export const APP_VERSION = process.env.npm_package_version ?? '0.1.0';
