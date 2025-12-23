import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/direct-current-user';
import { requireAdmin } from '@/lib/require-permission';
import { sendFeedbackNotificationEmail } from '@/lib/email-service';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for feedback submission
const feedbackSchema = z.object({
  category: z.enum([
    'BUG_REPORT',
    'FEATURE_REQUEST',
    'GENERAL_FEEDBACK',
    'SUPPORT_REQUEST',
    'COMPLAINT',
    'PRAISE',
  ]),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  message: z.string().min(20, 'Message must be at least 20 characters').max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  email: z.string().email().optional().nullable(),
  name: z.string().min(2).max(100).optional().nullable(),
  pageUrl: z.string().url().optional().nullable(),
  screenshots: z.array(z.string().url()).optional(),
});

// POST /api/feedback - Submit new feedback (public + authenticated)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const userAgent = request.headers.get('user-agent');

    // Validate input
    const validation = feedbackSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { category, subject, message, priority, email, name, pageUrl, screenshots } =
      validation.data;

    // For anonymous submissions, require email and name
    if (!user && (!email || !name)) {
      return NextResponse.json(
        { success: false, error: 'Email and name are required for anonymous feedback' },
        { status: 400 }
      );
    }

    // Create feedback entry
    const feedback = await prisma.feedback.create({
      data: {
        userId: user?.id || null,
        category,
        subject,
        message,
        priority: priority || 'MEDIUM',
        email: user?.email || email || null,
        name: user?.name || name || null,
        pageUrl: pageUrl || null,
        userAgent: userAgent || null,
        screenshots: screenshots || [],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            businessName: true,
          },
        },
      },
    });

    // Send email notification to admins
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@stitchcraft.gh';
    await sendFeedbackNotificationEmail(
      adminEmail,
      {
        id: feedback.id,
        category: feedback.category,
        subject: feedback.subject,
        message: feedback.message,
        priority: feedback.priority,
        userName: user?.name || name || 'Anonymous',
        userEmail: user?.email || email || 'Not provided',
        userRole: user?.role || 'VISITOR',
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        id: feedback.id,
        message: 'Thank you for your feedback! We appreciate you taking the time to help us improve.',
      },
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit feedback',
      },
      { status: 500 }
    );
  }
}

// GET /api/feedback - List all feedback (admin only)
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [feedbacks, total, statusCounts] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              businessName: true,
              profileImage: true,
            },
          },
        },
      }),
      prisma.feedback.count({ where }),
      prisma.feedback.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    // Format status counts
    const statusCountMap = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      data: feedbacks,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        statusCounts: statusCountMap,
      },
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch feedback',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

