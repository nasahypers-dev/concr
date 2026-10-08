// Writes the OpenAPI document to docs/api/openapi.json.
// Runs against the compiled app (`nest build` first; `npm run openapi:export` does both).
// Plain CommonJS on purpose: Nest needs emitDecoratorMetadata, which esbuild-based TS
// runners (tsx) do not produce, so we execute the tsc output exactly like production does.
'use strict';

// Must be set before any require: picks the pino transport (no pretty worker) and silences logs.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.LOG_LEVEL = 'silent';

const { NestFactory } = require('@nestjs/core');
const { mkdir, writeFile } = require('node:fs/promises');
const { dirname, resolve } = require('node:path');
const { AppModule } = require('../dist/app.module');
const { API_PREFIX } = require('../dist/app.constants');
const { buildOpenApiDocument } = require('../dist/swagger');

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix(API_PREFIX);
  await app.init();

  const document = buildOpenApiDocument(app);
  const target = resolve(__dirname, '../../../docs/api/openapi.json');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  await app.close();
  console.log(`OpenAPI written to ${target}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
