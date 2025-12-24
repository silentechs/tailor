'use client';

import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

export default function DocsPage() {
    return (
        <div className="h-screen w-full">
            <ApiReferenceReact
                configuration={{
                    spec: {
                        url: '/api/openapi.json',
                    },
                    theme: 'purple',
                    layout: 'modern',
                    showSidebar: true,
                    authentication: {
                        preferredSecurityScheme: 'cookieAuth',
                    },
                } as any}
            />
        </div>
    );
}
