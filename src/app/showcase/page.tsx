import { redirect } from 'next/navigation';

/**
 * Showcase index page - redirects to the Discover page
 * Individual tailor showcases are at /showcase/[username]
 * The discovery of all tailors happens at /discover
 */
export default function ShowcaseIndexPage() {
    redirect('/discover');
}
