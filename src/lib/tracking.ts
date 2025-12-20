export const getVisitorId = () => {
    if (typeof window === 'undefined') return undefined;
    let id = localStorage.getItem('sc_visitor_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('sc_visitor_id', id);
    }
    return id;
};

export const trackLead = async (data: {
    tailorId: string;
    channel: 'whatsapp' | 'phone' | 'inquiry_form';
    source: 'showcase' | 'gallery' | 'discover' | 'direct' | 'share';
    portfolioItemId?: string;
}) => {
    try {
        const visitorId = getVisitorId();
        await fetch('/api/leads/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...data,
                visitorId,
                referrer: typeof document !== 'undefined' ? document.referrer : undefined,
            }),
        });
    } catch (err) {
        console.error('Failed to track lead', err);
    }
};
