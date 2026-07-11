import { CollaborativeEditor } from '@/components/Editor/Editor';
import { Header } from '@/components/Document/Header';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/');
  }

  // Check if user has access to this document
  const role = await prisma.documentRole.findUnique({
    where: {
      documentId_userId: {
        documentId: id,
        userId: session.user.id
      }
    }
  });

  if (!role) {
    return <div className="p-12 text-center text-red-500">You do not have access to this document.</div>;
  }

  const doc = await prisma.document.findUnique({
    where: { id }
  });
  if (!doc) {
    redirect('/dashboard');
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('authjs.session-token')?.value || cookieStore.get('__Secure-authjs.session-token')?.value || '';

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen">
      <Header user={session.user} documentId={id} documentTitle={doc.title} role={role.role} />
      <main className="flex-1 flex overflow-hidden">
        <CollaborativeEditor 
          documentId={id} 
          token={token} 
          role={role.role} 
          username={session.user.name || session.user.email || 'Anonymous'} 
        />
      </main>
    </div>
  );
}
