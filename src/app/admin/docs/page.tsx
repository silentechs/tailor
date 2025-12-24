'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Key } from 'lucide-react';

export default function DocsPage() {
    const [token, setToken] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Get sc_session cookie value
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(c => c.trim().startsWith('sc_session='));
        if (sessionCookie) {
            setToken(sessionCookie.split('=')[1]);
        }
    }, []);

    const copyToken = async () => {
        if (token) {
            await navigator.clipboard.writeText(token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="h-[calc(100vh-5rem)] w-full overflow-hidden flex flex-col">
            {/* Token Helper Banner */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-3 text-sm">
                <Key className="h-4 w-4 text-amber-600" />
                <span className="text-amber-800 dark:text-amber-200">
                    <strong>Bearer Token:</strong> Use this in the Authentication section to test APIs
                </span>
                {token ? (
                    <button
                        onClick={copyToken}
                        className="ml-auto flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-800 hover:bg-amber-200 dark:hover:bg-amber-700 rounded text-amber-800 dark:text-amber-100 font-mono text-xs transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3 w-3" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3" />
                                {token.substring(0, 8)}...{token.substring(token.length - 4)}
                            </>
                        )}
                    </button>
                ) : (
                    <span className="ml-auto text-amber-600 text-xs">No session found - please log in</span>
                )}
            </div>

            {/* API Docs iframe */}
            <iframe
                src="/api/docs"
                className="w-full flex-1 border-none"
                title="API Documentation"
            />
        </div>
    );
}
