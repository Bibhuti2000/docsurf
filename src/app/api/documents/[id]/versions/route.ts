import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const role = await prisma.documentRole.findUnique({
    where: { documentId_userId: { documentId: id, userId: session.user.id } }
  });
  if (!role) return new NextResponse("Forbidden", { status: 403 });

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, createdAt: true } // Don't send full binary content in list
  });

  return NextResponse.json(versions);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const role = await prisma.documentRole.findUnique({
    where: { documentId_userId: { documentId: id, userId: session.user.id } }
  });
  if (!role || role.role === 'VIEWER') return new NextResponse("Forbidden", { status: 403 });

  const { name, content } = await req.json();

  let buffer: Uint8Array;
  if (content) {
    buffer = new Uint8Array(Buffer.from(content, 'base64'));
  } else {
    // Get current document content to snapshot
    const doc = await prisma.document.findUnique({ where: { id: id } });
    if (!doc || !doc.content) return new NextResponse("No document content", { status: 400 });
    buffer = doc.content;
  }

  const version = await prisma.documentVersion.create({
    data: {
      documentId: id,
      name,
      content: buffer as unknown as Uint8Array<ArrayBuffer>
    }
  });

  return NextResponse.json(version);
}
