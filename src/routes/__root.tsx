import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

import Header from '../components/Header'
import { checkSessionFn } from '../services/auth-funcs'
import { useAuthStore } from '../services/authStore'

import appCss from '../styles.css?url'
import { seo } from 'utils/seo'
import { ErrorComponent } from '../components/ErrorComponent'

export const Route = createRootRoute({
  errorComponent: ErrorComponent,
  beforeLoad: async () => {
    const result = await checkSessionFn()
    return {
      user: result?.user || null,
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'LensLearn - Learn Anything by Exploring the World',
      },
      ...seo({
        title: 'LensLearn - Learn Anything by Exploring the World',
        description: 'LensLearn is an AI-powered visual learning platform that turns images, scenes, and curiosity into interactive learning experiences. Users can start learning by exploring AI-generated worlds, asking questions, or uploading their own images. AI agents orchestrate visual generation, narration, and interaction across multiple learning domains.',
        image: 'https://tanstack.com/start/starter.png',
        keywords: 'Learning, AI, Curiosity, Visual Learning, Interactive Learning, AI Agents, Visual Generation, Narration, Interaction, Multiple Learning Domains',
      }),
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-display">404 - Page Not Found</h1>
      <p className="text-zinc-500">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary">Go Home</a>
    </div>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()
  const { user } = Route.useRouteContext()

  useEffect(() => {
    setUser(user)
    setLoading(false)
  }, [user, setUser, setLoading])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <Header />
        <main className="pt-16 min-h-screen">
          {children || <Outlet />}
        </main>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 5000,
            style: {
              background: '#fff',
              color: '#363636',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
          }}
        />
        <Scripts />
      </body>
    </html>
  )
}
