import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ShowcasePageClient from './showcase-client';

interface ShowcasePageProps {
  params: Promise<{ username: string }>;
}

/**
 * Generate dynamic metadata for SEO and social sharing
 * This enables rich previews on WhatsApp, Instagram, Twitter, etc.
 */
export async function generateMetadata({ params }: ShowcasePageProps): Promise<Metadata> {
  const { username } = await params;

  // Fetch tailor data for metadata
  const tailor = await prisma.user.findFirst({
    where: {
      showcaseUsername: username,
      showcaseEnabled: true,
      status: 'APPROVED',
    },
    select: {
      name: true,
      businessName: true,
      bio: true,
      profileImage: true,
      city: true,
      region: true,
    },
  });

  if (!tailor) {
    return {
      title: 'Showcase - StitchCraft Ghana',
      description: 'Discover talented Ghanaian tailors on StitchCraft.',
    };
  }

  const displayName = tailor.businessName || tailor.name;
  const location =
    tailor.city && tailor.region ? `${tailor.city}, ${tailor.region.replace(/_/g, ' ')}` : 'Ghana';
  const description =
    tailor.bio ||
    `Bespoke Ghanaian tailoring by ${displayName}. Based in ${location}. View portfolio and connect.`;

  const title = `${displayName} - StitchCraft Ghana`;

  return {
    title,
    description,
    keywords: [
      displayName,
      'Ghana tailor',
      'African fashion',
      'Kente',
      'bespoke clothing',
      location,
      'StitchCraft',
    ],
    openGraph: {
      title,
      description,
      type: 'profile',
      images: tailor.profileImage
        ? [
            {
              url: tailor.profileImage,
              width: 400,
              height: 400,
              alt: `${displayName} - Ghanaian Tailor`,
            },
          ]
        : [],
      siteName: 'StitchCraft Ghana',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: tailor.profileImage ? [tailor.profileImage] : [],
    },
    alternates: {
      canonical: `/showcase/${username}`,
    },
  };
}

export default function ShowcasePage() {
  return <ShowcasePageClient />;
}
