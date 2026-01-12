
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// List reservations (e.g. for Kitchen view, filtered by status/date)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    // By default, get today's reservations or active ones

    try {
        const reservations = await prisma.reservation.findMany({
            where: {
                status: status ? status : {
                    in: ['PENDING', 'CONFIRMED', 'SEATED', 'COOKING', 'SERVED'] // Exclude Completed/Cancelled by default if not specified
                },
                time: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)) // From today start
                }
            },
            orderBy: {
                time: 'asc'
            },
            include: {
                guest: true,
                table: true
            }
        });
        return NextResponse.json(reservations);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Create new reservation
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            guestId, guestName, roomNumber,
            tableId,
            time,
            partySize, adults, children,
            orderDetails, specialRequests
        } = body;

        // Validate table availability if needed, but we assume Front Desk selected a valid one.
        // In a robust system, we double check here.

        const reservation = await prisma.reservation.create({
            data: {
                guestId: guestId || null, // Can be null if manual entry
                guestName,
                tableId: tableId || null, // Can be null if "Seat only" without specific table or auto-assign later
                time: new Date(time),
                partySize: Number(partySize),
                adults: Number(adults),
                children: Number(children),
                orderDetails: typeof orderDetails === 'object' ? JSON.stringify(orderDetails) : orderDetails,
                specialRequests,
                status: 'CONFIRMED' // Auto-confirm for Front Desk? Or PENDING? User says "Pizza shop receives notification", implies Confirmed or Pending. Let's say CONFIRMED as Front Desk made it.
            }
        });

        // We might also update the Table status to 'RESERVED' if the time is imminent, 
        // but usually status is derived from reservations. 
        // For simplicity, let's update table status only when checked in (SEATED).

        return NextResponse.json(reservation);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
