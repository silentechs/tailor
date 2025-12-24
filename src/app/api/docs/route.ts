import { ApiReference } from '@scalar/nextjs-api-reference';

const config = {
    spec: {
        url: '/api/openapi.json',
    },
    theme: 'purple' as any,
    layout: 'modern' as any,
    showSidebar: true,
    // Ensure credentials (cookies) are included with requests
    withDefaultFonts: false,
    // Use proxy to work around CORS/cookie issues
    proxyUrl: undefined, // Don't use external proxy
    authentication: {
        preferredSecurityScheme: 'bearerAuth', // Use Bearer by default since cookies are unreliable in iframes
        apiKey: {
            token: '', // User will need to paste their token
        },
    },
    // Custom fetch that includes credentials
    customCss: `
        /* Indicate to user they need to use Bearer auth */
        .auth-section::before {
            content: "💡 Use Bearer Auth with your session token from DevTools > Cookies > sc_session";
            display: block;
            padding: 8px;
            background: #fff3cd;
            border-radius: 4px;
            margin-bottom: 8px;
            font-size: 12px;
        }
    `,
};

export const GET = ApiReference(config);
