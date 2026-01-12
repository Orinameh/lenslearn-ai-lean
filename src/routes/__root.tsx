import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from 'react-hot-toast'

import Header from '../components/Header'
// import { checkSessionFn, logoutUserFn } from '../services/auth-funcs'

// Mock User for Client
const MOCK_USER = {
  id: 'demo-user-123',
  email: 'demo@lenslearn.ai',
  full_name: 'Demo User',
  app_metadata: {},
  user_metadata: { role: 'user' },
  aud: 'authenticated',
  created_at: new Date().toISOString()
}


import appCss from '../styles.css?url'
import { seo } from 'utils/seo'
import { ErrorComponent } from '../components/ErrorComponent'
import { NotFound } from '@/components/NotFound'
import 'katex/dist/katex.min.css'

export const Route = createRootRoute({
  errorComponent: ErrorComponent,
  beforeLoad: async () => {
    // POC: Always logged in
    return {
      user: MOCK_USER,
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
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {



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
