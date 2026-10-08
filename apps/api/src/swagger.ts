import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { APP_VERSION, SWAGGER_PATH } from './app.constants';

/** Builds the OpenAPI document; shared by the running app and scripts/export-openapi.ts. */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('CONCR API')
    .setDescription(
      'Concrete ordering & delivery platform. All routes are under /api/v1. ' +
        'Errors use { statusCode, code, message, details?, requestId }.',
    )
    .setVersion(APP_VERSION)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // nestjs-zod: turns zod DTOs into proper JSON schema components.
  return cleanupOpenApiDoc(document);
}

export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup(SWAGGER_PATH, app, buildOpenApiDocument(app), {
    jsonDocumentUrl: `${SWAGGER_PATH}-json`,
    swaggerOptions: { persistAuthorization: true },
  });
}
