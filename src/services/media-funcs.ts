import { createServerFn } from '@tanstack/react-start'
import { v2 as cloudinary } from 'cloudinary'
import { requireUser } from './auth-helper'

// Initialize Cloudinary
cloudinary.config({
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export const getCloudinarySignatureFn = createServerFn({ method: "GET" })
  .handler(async () => {
    await requireUser()

    const timestamp = Math.round(new Date().getTime() / 1000)
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: 'lenslearn_uploads',
      },
      cloudinary.config().api_secret!
    )

    return {
      signature,
      timestamp,
      cloudName: cloudinary.config().cloud_name,
      apiKey: cloudinary.config().api_key,
      folder: 'lenslearn_uploads',
    }
  })

export const uploadMediaFn = createServerFn({ method: "POST" })
  .inputValidator((d: { 
    type: 'image'; 
    storage_url: string; 
    is_watermarked: boolean 
  }) => d)
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()

    const { data: media, error } = await supabase
      .from('media')
      .insert({
        user_id: user.id,
        ...data,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return media
  })

export const getMediaFn = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { user, supabase } = await requireUser()

    const { data: media, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', data.id)
      .eq('user_id', user.id)
      .single()

    if (error) throw new Error(error.message)
    return media
  })
