import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '../services/supabase-server'

type CallbackSearch = {
    code?: string
}

export const Route = createFileRoute('/auth/callback')({
    validateSearch: (search: Record<string, unknown>): CallbackSearch => ({
        code: (search.code as string) || undefined,
    }),
    loaderDeps: ({ search }: { search: CallbackSearch }) => ({ code: search.code }),
    loader: async ({ deps }: { deps: { code?: string } }) => {
        if (!deps.code) {
            throw redirect({ to: '/login', search: { error: 'no_code' } })
        }

        const result = await handleOAuthCallback({ data: { code: deps.code } })

        if (result.success) {
            throw redirect({ to: '/' })
        }

        throw redirect({ to: '/login', search: { error: result.error || 'unknown' } })
    },
})

const handleOAuthCallback = createServerFn({ method: "POST" })
    .inputValidator(z.object({
        code: z.string()
    }))
    .handler(async ({ data }) => {
        const serverClient = getSupabaseServerClient()

        const { data: sessionData, error } = await serverClient.auth.exchangeCodeForSession(data.code)

        if (error || !sessionData.session || !sessionData.user) {
            return { success: false, error: 'auth_failed' }
        }

        const { error: profileError } = await serverClient
            .from('profiles')
            .upsert({
                user_id: sessionData.user.id,
                email: sessionData.user.email,
                full_name: sessionData.user.user_metadata?.full_name || sessionData.user.user_metadata?.name || null,
                provider: sessionData.user.app_metadata?.provider || 'google',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })

        if (profileError) {
            return { success: false, error: 'profile_failed' }
        }

        return { success: true }
    })