import {
    OpenAPIRegistry,
    OpenApiGeneratorV3,
    extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI capabilities
extendZodWithOpenApi(z);

/**
 * The OpenAPI registry stores all documentation components.
 * It's used to collect schemas, parameters, and routes.
 */
export const registry = new OpenAPIRegistry();

// Register the Session Cookie Authentication Scheme
registry.registerComponent('securitySchemes', 'cookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: 'sc_session', // The name of your session cookie
});

// Register Bearer Authentication Scheme
registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'UUID',
});

/**
 * Generates the full OpenAPI document.
 * This should be called in the API route that serves the openapi.json.
 */
export function generateOpenApi() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            version: '1.0.0',
            title: 'StitchCraft API',
            description: 'API documentation for the StitchCraft platform.',
        },
        servers: [{ url: '/api' }],
    });
}

// Export Zod so we can use the extended version
export { z };
