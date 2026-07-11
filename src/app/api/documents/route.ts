import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title } = await req.json();
    const cleanTitle = title?.trim() || "Untitled Document";

    const doc = await prisma.document.create({
      data: { title: cleanTitle }
    });

    await prisma.documentRole.create({
      data: {
        documentId: doc.id,
        userId: session.user.id,
        role: "OWNER"
      }
    });

    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error creating document:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
