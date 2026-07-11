import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const role = await prisma.documentRole.findUnique({
      where: { documentId_userId: { documentId: id, userId: session.user.id } }
    });
    if (!role) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId }
    });
    if (!version || version.documentId !== id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return new Response(version.content, {
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });
  } catch (error) {
    console.error('Error fetching version:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
