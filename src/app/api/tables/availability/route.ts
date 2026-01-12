
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const time = searchParams.get('time'); // e.g., "2024-01-07T18:00:00.000Z"

    // In a real app, we would query reservations overlapping with this time.
    // For this prototype, we'll just check if the status is "AVAILABLE" in the Table table,
    // or if there are reservations impacting it.

    // Improvement: Check reservations for the requested time slot.
    // For now, let's just return all tables and their current status, plus logic to check reservations.

    try {
        const tables = await prisma.table.findMany();
        const reservations = time ? await prisma.reservation.findMany({
            where: {
                time: {
                    gte: new Date(time),
                    lt: new Date(new Date(time).getTime() + 60 * 60 * 1000) // 1 hour slot
                },
                status: {
                    not: 'CANCELLED'
                }
            }
        }) : [];

        // Map availability
        const tablesWithStatus = tables.map(table => {
            const isReserved = reservations.some(model => model.tableId === table.id);
            return {
                ...table,
                status: isReserved ? 'RESERVED' : table.status
            };
        });

        return NextResponse.json(tablesWithStatus);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
