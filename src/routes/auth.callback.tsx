import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { setCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import { supabase } from '../services/supabase'
import { getSupabaseServerClient } from '../services/supabase-server'

type CallbackSearch = {
    code?: string
}

export const Route = createFileRoute('/auth/callback')({
    validateSearch: (search: Record<string, unknown>): CallbackSearch => {
        return {
            code: (search.code as string) || undefined,
        }
    },
    loader: async ({ search }: any) => {
        const { code } = search as CallbackSearch

        if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                console.error('OAuth exchange error:', error.message)
                throw redirect({ to: '/login' })
            }

            if (data.session) {
                // Set cookies on the server
                await handleOAuthSession({
                    data: {
                        access_token: data.session.access_token,
                        refresh_token: data.session.refresh_token,
                        user_id: data.user.id,
                    }
                })
            }
        }

        throw redirect({ to: '/' })
    },
})

const handleOAuthSession = createServerFn({ method: "POST" })
    .inputValidator(z.object({
        access_token: z.string(),
        refresh_token: z.string(),
        user_id: z.string(),
    }))
    .handler(async ({ data }) => {
        setCookie('sb-access-token', data.access_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        })
        setCookie('sb-refresh-token', data.refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        })

        // Initialize/Update profile
        const serverClient = getSupabaseServerClient()
        await serverClient
            .from('profiles')
            .upsert({
                user_id: data.user_id,
                provider: 'google',
                updated_at: new Date().toISOString()
            })

        return { success: true }
    })
