
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { status } = body;

        const reservation = await prisma.reservation.update({
            where: { id },
            data: { status }
        });

        // If status becomes SEATED, update Table status to OCCUPIED
        if (status === 'SEATED' && reservation.tableId) {
            await prisma.table.update({
                where: { id: reservation.tableId },
                data: { status: 'OCCUPIED' }
            });
        }

        // If status becomes COMPLETED or CANCELLED, free the table
        if ((status === 'COMPLETED' || status === 'CANCELLED') && reservation.tableId) {
            await prisma.table.update({
                where: { id: reservation.tableId },
                data: { status: 'AVAILABLE' }
            });
        }

        return NextResponse.json(reservation);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
