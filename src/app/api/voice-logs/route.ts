import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveTailor } from '@/lib/direct-current-user';
import prisma from '@/lib/prisma';

const voiceLogSchema = z.object({
  audioUrl: z.string().url(),
  transcript: z.string().optional(),
  intent: z.string().optional(),
});

// POST /api/voice-logs - Save a voice note metadata
export async function POST(request: Request) {
  try {
    const user = await requireActiveTailor();
    const body = await request.json();
    const { audioUrl, transcript, intent } = voiceLogSchema.parse(body);

    const voiceLog = await prisma.voiceLog.create({
      data: {
        tailorId: user.id,
        audioUrl,
        transcript,
        intent,
        status: 'COMPLETED', // Assuming it's already uploaded and processed
      },
    });

    return NextResponse.json({ success: true, data: voiceLog });
  } catch (error) {
    console.error('Create voice log error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create voice log' },
      { status: 500 }
    );
  }
}

// GET /api/voice-logs - Get tailor's voice logs
export async function GET() {
  try {
    const user = await requireActiveTailor();
    const logs = await prisma.voiceLog.findMany({
      where: { tailorId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get voice logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voice logs' },
      { status: 500 }
    );
  }
}
