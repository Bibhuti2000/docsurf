import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: Fetch all collaborators and their roles for this document
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify current user has access to the document
    const userRole = await prisma.documentRole.findUnique({
      where: { documentId_userId: { documentId: id, userId: session.user.id } }
    });
    if (!userRole) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const collaborators = await prisma.documentRole.findMany({
      where: { documentId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(collaborators);
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST: Add a new collaborator by email
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only OWNER can share/manage roles
    const userRole = await prisma.documentRole.findUnique({
      where: { documentId_userId: { documentId: id, userId: session.user.id } }
    });
    if (!userRole || userRole.role !== 'OWNER') {
      return new NextResponse("Forbidden - Only the owner can share", { status: 403 });
    }

    const { email, role } = await req.json();
    if (!email || !role) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Find the target collaborator
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (!targetUser) {
      return new NextResponse("Collaborator must have a registered account", { status: 404 });
    }

    // Check if they are already added
    const existing = await prisma.documentRole.findUnique({
      where: {
        documentId_userId: {
          documentId: id,
          userId: targetUser.id
        }
      }
    });
    if (existing) {
      return new NextResponse("User is already a collaborator", { status: 400 });
    }

    // Create the document role
    const newCollaborator = await prisma.documentRole.create({
      data: {
        documentId: id,
        userId: targetUser.id,
        role: role // OWNER, EDITOR, or VIEWER
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(newCollaborator);
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Revoke collaborator access
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only OWNER can manage roles
    const userRole = await prisma.documentRole.findUnique({
      where: { documentId_userId: { documentId: id, userId: session.user.id } }
    });
    if (!userRole || userRole.role !== 'OWNER') {
      return new NextResponse("Forbidden - Only the owner can manage access", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get('roleId');
    if (!roleId) {
      return new NextResponse("Missing roleId parameter", { status: 400 });
    }

    // Find document role to be deleted
    const targetRole = await prisma.documentRole.findUnique({
      where: { id: roleId }
    });
    if (!targetRole || targetRole.documentId !== id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Owners cannot delete their own owner role (there must be an owner)
    if (targetRole.userId === session.user.id) {
      return new NextResponse("Cannot revoke your own access as the owner", { status: 400 });
    }

    await prisma.documentRole.delete({
      where: { id: roleId }
    });

    return new NextResponse("Collaborator revoked successfully", { status: 200 });
  } catch (error) {
    console.error('Error deleting collaborator:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
