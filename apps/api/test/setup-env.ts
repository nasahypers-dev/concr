// Runs before every e2e file: keep logs quiet and never pick up a developer .env by accident.
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
