import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user is OWNER or EDITOR
    const userRole = await prisma.documentRole.findUnique({
      where: { documentId_userId: { documentId: id, userId: session.user.id } }
    });
    if (!userRole || userRole.role === 'VIEWER') {
      return new NextResponse("Forbidden - Editors or Owners only", { status: 403 });
    }

    const { title } = await req.json();
    if (!title || !title.trim()) {
      return new NextResponse("Title cannot be empty", { status: 400 });
    }

    const doc = await prisma.document.update({
      where: { id: id },
      data: { title: title.trim() }
    });

    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error updating document:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
