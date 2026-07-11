import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Header } from '@/components/Document/Header';
import { prisma } from '@/lib/prisma';
import { FileText, Clock, Users } from 'lucide-react';
import { NewDocumentButton } from '@/components/Document/NewDocumentButton';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  // Fetch roles and documents, including other role assignments (collaborators)
  const userRoles = await prisma.documentRole.findMany({
    where: { userId: session.user.id },
    include: { 
      document: {
        include: {
          roles: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      } 
    },
    orderBy: { document: { updatedAt: 'desc' } }
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Header user={session.user} />
      <div className="container mx-auto px-4 py-12 max-w-6xl flex-1 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
            <p className="text-muted-foreground mt-1">Manage and collaborate on your documents.</p>
          </div>
          <NewDocumentButton />
        </div>

        {userRoles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRoles.map((role: typeof userRoles[number]) => {
              // Extract collaborator names (excluding current user)
              const collaborators = role.document.roles
                .filter(r => r.userId !== session?.user?.id)
                .map(r => r.user.name || r.user.email || 'Collaborator');

              return (
                <Link href={`/document/${role.documentId}`} key={role.id} className="group">
                  <div className="flex flex-col justify-between h-52 p-6 rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-zinc-300 dark:hover:border-zinc-700">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
                          <FileText className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">
                          {role.role}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">{role.document.title}</h2>
                      
                      {/* Collaborators list */}
                      {collaborators.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Users className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {collaborators.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{role.document.updatedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-16 sm:p-24 border rounded-3xl border-dashed bg-card mt-8">
            <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-4">
              <FileText className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              You haven&apos;t created or joined any documents yet. Create your first document to get started.
            </p>
            <NewDocumentButton />
          </div>
        )}
      </div>
    </div>
  );
}
