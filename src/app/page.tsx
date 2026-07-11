import { Header } from '@/components/Document/Header';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const session = await auth();
  
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700">
            Now in Public Beta
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter text-foreground">
            Write Together. <br className="hidden sm:inline" />
            <span className="text-zinc-500 dark:text-zinc-400">Beautifully.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A premium, real-time collaborative workspace designed for speed, focus, and elegance. Create documents, share instantly, and build ideas seamlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/auth">
              <Button size="lg" className="h-12 px-8 text-base transition-all hover:scale-105 active:scale-95 shadow-lg">
                Get Started for Free
              </Button>
            </Link>
            <Link href="https://github.com" target="_blank" rel="noreferrer">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base transition-all hover:scale-105 active:scale-95">
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>

        {/* Abstract UI Mockup */}
        <div className="mt-24 w-full max-w-5xl mx-auto p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border bg-card text-card-foreground shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
          <div className="rounded-xl overflow-hidden border bg-background">
            <div className="flex items-center px-4 py-3 border-b bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
              </div>
            </div>
            <div className="p-8 sm:p-12 text-left space-y-6">
              <div className="h-8 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse"></div>
                <div className="h-4 w-4/6 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
