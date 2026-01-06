import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from './supabase-server'
import { requireUser } from './auth-helper'

// export const getCloudinarySignatureFn = createServerFn({
//   method: 'GET',
// }).handler(async () => {
//   await requireUser()

//   // Import Cloudinary only on the server
//   const { v2: cloudinary } = await import('cloudinary')

//   // Initialize Cloudinary
//   cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
//     secure: true,
//   })

//   const timestamp = Math.round(new Date().getTime() / 1000)
//   const signature = cloudinary.utils.api_sign_request(
//     {
//       timestamp: timestamp,
//       folder: 'lenslearn_uploads',
//     },
//     cloudinary.config().api_secret!,
//   )

//   return {
//     signature,
//     timestamp,
//     cloudName: cloudinary.config().cloud_name,
//     apiKey: cloudinary.config().api_key,
//     folder: 'lenslearn_uploads',
//   }
// })

// export const uploadMediaFn = createServerFn({ method: 'POST' })
//   .inputValidator(
//     (d: { type: 'image'; storage_url: string; is_watermarked: boolean }) => d,
//   )
//   .handler(async ({ data }) => {
//     const { user, supabase } = await requireUser()

//     const { data: media, error } = await supabase
//       .from('media')
//       .insert({
//         user_id: user.id,
//         ...data,
//         created_at: new Date().toISOString(),
//       })
//       .select()
//       .single()

//     if (error) throw new Error(error.message)
//     return media
//   })

export const uploadImageToSupabaseFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      fileName: z.string(),
      fileType: z.string(),
      fileData: z.string(), // base64
    }),
  )
  .handler(async ({ data }) => {
    const { user } = await requireUser()
    const serverClient = getSupabaseServerClient()

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${user.id}/${timestamp}-${sanitizedFileName}`

    // Convert base64 to buffer
    const buffer = Buffer.from(data.fileData, 'base64')

    // Upload to Supabase Storage
    const { error: uploadError } = await serverClient.storage
      .from('media-uploads')
      .upload(uniqueFileName, buffer, {
        contentType: data.fileType,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = serverClient.storage.from('media-uploads').getPublicUrl(uniqueFileName)

    // Save metadata to media table (matching your schema exactly)
    const { data: mediaData, error: mediaError } = await serverClient
      .from('media')
      .insert({
        user_id: user.id,
        type: 'image',
        storage_url: publicUrl,
        is_watermarked: false,
        // created_at is automatically set by Supabase timestamptz default
      })
      .select('id')
      .single()

    if (mediaError) {
      // Cleanup: delete uploaded file if metadata save fails
      await serverClient.storage.from('media-uploads').remove([uniqueFileName])
      throw new Error(`Failed to save metadata: ${mediaError.message}`)
    }

    return {
      mediaId: mediaData.id,
      storageUrl: publicUrl,
    }
  })

export const getMediaFn = createServerFn({ method: 'GET' })
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
