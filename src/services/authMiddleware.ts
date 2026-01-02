import { redirect } from '@tanstack/react-router'

export const authGuard = async ({ context }: { context: { user: any } }) => {
  if (!context.user) {
    // During SSR, we don't have window.location
    // TanStack Router handles redirects on the server automatically if thrown from beforeLoad
    throw redirect({
      to: '/login',
      search: {
        redirect:
          typeof window !== 'undefined' ? window.location.pathname : undefined,
      },
    })
  }
}
