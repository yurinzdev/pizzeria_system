
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    try {
        const items = await prisma.menuItem.findMany({
            where: q ? {
                name: {
                    contains: q,
                    // mode: 'insensitive' // SQLite default is usually case-insensitive for ASCII, but Prisma might need explicit config or raw query for others.
                    // Note: Prisma client with SQLite doesn't support mode: 'insensitive' until newer versions or strict collation. 
                    // We will assume case match or handled by frontend lowercasing for now in prototype.
                }
            } : undefined
        });

        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
