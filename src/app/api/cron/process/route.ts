import { NextResponse } from 'next/server';
import {
  notifyAppointmentReminder,
  notifyApproachingDeadline,
  notifyLowInventory,
} from '@/lib/notification-service';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    const appointmentCount = await processAppointments(now);
    const deadlineCount = await processDeadlines(now);
    const inventoryCount = await processInventory(now);

    return NextResponse.json({
      success: true,
      processed: {
        appointments: appointmentCount,
        deadlines: deadlineCount,
        inventory: inventoryCount,
      },
    });
  } catch (error) {
    console.error('Automation process error:', error);
    return NextResponse.json({ success: false, error: 'Automation failed' }, { status: 500 });
  }
}

async function processAppointments(now: Date) {
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const startOfDay = new Date(new Date(now).setHours(0, 0, 0, 0));

  const upcoming = await prisma.appointment.findMany({
    where: {
      startTime: { gte: now, lte: twoHoursLater },
      status: 'SCHEDULED',
    },
    include: { client: true },
  });

  let count = 0;
  for (const appt of upcoming) {
    const alreadyNotified = await prisma.notification.findFirst({
      where: {
        userId: appt.tailorId,
        type: 'APPOINTMENT_REMINDER',
        createdAt: { gte: startOfDay },
        message: { contains: appt.id },
      },
    });

    if (!alreadyNotified) {
      await notifyAppointmentReminder(
        appt.tailorId,
        appt.clientId,
        appt.client.phone,
        appt.client.name,
        appt.type,
        appt.startTime
      );
      count++;
    }
  }
  return count;
}

async function processDeadlines(now: Date) {
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const upcoming = await prisma.order.findMany({
    where: {
      deadline: { gte: now, lte: threeDaysLater },
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
    },
    include: { client: true },
  });

  let count = 0;
  for (const order of upcoming) {
    const alreadyNotified = await prisma.notification.findFirst({
      where: {
        userId: order.tailorId,
        type: 'ORDER_UPDATE',
        title: 'Deadline Approaching',
        createdAt: { gte: twentyFourHoursAgo },
        message: { contains: order.orderNumber },
      },
    });

    if (!alreadyNotified && order.deadline) {
      await notifyApproachingDeadline(
        order.tailorId,
        order.orderNumber,
        order.client.name,
        order.deadline
      );
      count++;
    }
  }
  return count;
}

async function processInventory(now: Date) {
  const allItems = await prisma.inventoryItem.findMany();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let count = 0;
  for (const item of allItems) {
    const quantity = Number(item.quantity);
    const minStock = Number(item.minStock || 0);

    if (minStock > 0 && quantity <= minStock) {
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          userId: item.tailorId,
          type: 'SYSTEM',
          title: 'Low Stock Alert',
          createdAt: { gte: sevenDaysAgo },
          message: { contains: item.name },
        },
      });

      if (!alreadyNotified) {
        await notifyLowInventory(item.tailorId, item.name, quantity, minStock);
        count++;
      }
    }
  }
  return count;
}
