
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const room = searchParams.get('room');

    if (!room) {
        return NextResponse.json({ error: 'Room number is required' }, { status: 400 });
    }

    try {
        const guest = await prisma.guest.findUnique({
            where: { roomNumber: room },
        });

        if (!guest) {
            return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
        }

        return NextResponse.json(guest);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
