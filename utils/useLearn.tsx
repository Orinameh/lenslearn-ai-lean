import { createLearningSessionFn, saveMessageFn } from "@/services/learning-funcs"
import { getExplanationStreamFn } from "@/services/server-funcs"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"

export type Message = {
    role: 'user' | 'assistant'
    text: string
}

export const useLearn = (
    search: { type?: 'text' | 'image'; session?: string },
    id: string,
    loaderData: { prompt: string; mediaData?: any; sessionData?: any }
) => {
    const navigate = useNavigate()
    const [sessionId, setSessionId] = useState<string | null>(search.session || loaderData.sessionData?.id || null)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Determine if we have existing history from the loader or sessionData
    const initialHistory = loaderData.sessionData?.messages
    const hasHistory = Array.isArray(initialHistory) && initialHistory.length > 0
    const hasExistingSession = !!loaderData.sessionData?.id

    const hasAutoSent = useRef(hasHistory || hasExistingSession)

    // Determine if we should show the scene canvas
    const showScene = search.type === 'image'

    const [messages, setMessages] = useState<Message[]>(() => {
        if (hasHistory) {
            return initialHistory.map((m: any) => ({
                role: m.role,
                text: m.text
            }))
        }

        return [
            {
                role: 'assistant', text: showScene
                    ? "Welcome to this interactive world! I've analyzed the scene and identified 3 to 5 key learning hotspots for you to explore. Where would you like to start?"
                    : "Hello! I'm your LensLearn AI Guide. What would you like to learn about today?"
            }
        ]
    })

    // Add a ref to track the latest messages
    const messagesRef = useRef(messages)
    const isStreamingRef = useRef(false)

    // Keep ref in sync with state
    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [modelId, setModelId] = useState<string>(import.meta.env.VITE_GEMINI_MAIN_MODEL)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    // Improved auto-scroll function to use window scroll
    const scrollToBottom = (force = false) => {
        if (force || isStreamingRef.current) {
            // Always scroll window during streaming or when forced
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
            })
        } else {
            // Otherwise check if user is near bottom of window
            const scrollPos = window.innerHeight + window.scrollY
            const threshold = document.documentElement.scrollHeight - 150
            if (scrollPos > threshold) {
                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: 'smooth'
                })
            }
        }
    }

    // Auto-scroll during streaming
    useEffect(() => {
        if (isStreamingRef.current) {
            scrollToBottom(true)
        }
    }, [messages])

    const sendMessage = async (userMessage: string, overrideSessionId?: string) => {
        setIsLoading(true)
        isStreamingRef.current = true

        const currentMessages = messagesRef.current

        // Create session if it doesn't exist
        let currentSessionId = overrideSessionId || sessionId
        if (!currentSessionId) {
            try {
                const session = await createLearningSessionFn({
                    data: {
                        entry_point: showScene ? 'upload' : 'explore',
                        world: showScene ? undefined : id,
                        media_id: showScene ? id : undefined,
                        title: showScene ? loaderData.mediaData?.analysis_data?.title : id.replace(/-/g, ' ')
                    }
                })
                currentSessionId = session.id
                setSessionId(session.id)

                // Sync URL with sessionId for refreshes
                navigate({
                    search: { ...search, session: session.id } as any,
                    replace: true
                })
            } catch (err) {
                console.error("Failed to create session:", err)
            }
        }

        // Save user message to DB if we have a session
        if (currentSessionId && userMessage) {
            try {
                await saveMessageFn({
                    data: {
                        sessionId: currentSessionId,
                        role: 'user',
                        text: userMessage
                    }
                })
            } catch (err) {
                console.error("Failed to save user message:", err)
            }
        }

        // Add placeholder assistant message
        setMessages(prev => {
            if (prev[prev.length - 1]?.role === 'assistant' && prev[prev.length - 1]?.text === '') {
                return prev
            }
            return [...prev, { role: 'assistant', text: '' }]
        })

        try {
            const response = await getExplanationStreamFn({
                data: {
                    context: showScene
                        ? "Global Context: Learning scene about " + id
                        : "Global Context: Learning about " + id,
                    question: userMessage,
                    history: currentMessages
                }
            })

            if (!response.ok) {
                if (response.status === 402) {
                    setShowUpgradeModal(true)
                    setMessages(prev => {
                        const newMessages = [...prev]
                        newMessages[newMessages.length - 1] = {
                            role: 'assistant',
                            text: "You've reached your free limit. Please upgrade to continue learning."
                        }
                        return newMessages
                    })
                    isStreamingRef.current = false
                    setIsLoading(false)
                    return
                }

                const errorText = await response.text()
                throw new Error(errorText || 'Failed to get response')
            }

            // Capture the model ID from header
            const responseModelId = response.headers.get('X-Model-ID')
            if (responseModelId) {
                setModelId(responseModelId)
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No reader available')

            const decoder = new TextDecoder()
            let accumulatedText = ''

            try {
                while (true) {
                    const { done, value } = await reader.read()
                    const chunk = value ? decoder.decode(value, { stream: true }) : ''

                    if (chunk) {
                        accumulatedText += chunk

                        setMessages(prev => {
                            const newMessages = [...prev]
                            newMessages[newMessages.length - 1] = {
                                role: 'assistant',
                                text: accumulatedText
                            }
                            return newMessages
                        })
                    }

                    if (done) break
                }
            } catch (readError: any) {
                console.error('Stream reading error:', readError)

                if (accumulatedText) {
                    setMessages(prev => {
                        const newMessages = [...prev]
                        newMessages[newMessages.length - 1] = {
                            role: 'assistant',
                            text: accumulatedText + '\n\n[Connection interrupted]'
                        }
                        return newMessages
                    })
                } else {
                    throw readError
                }
            } finally {
                try {
                    reader.releaseLock()
                } catch { }
            }

            // Save assistant message to DB
            if (currentSessionId && accumulatedText) {
                try {
                    await saveMessageFn({
                        data: {
                            sessionId: currentSessionId,
                            role: 'assistant',
                            text: accumulatedText
                        }
                    })
                } catch (err) {
                    console.error("Failed to save assistant message:", err)
                }
            }

        } catch (error: any) {
            console.error('Send message error:', error)

            setMessages(prev => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    text: "There was an error connecting to the AI guide. Please try again."
                }
                return newMessages
            })
            toast.error('Failed to connect to AI guide')
        } finally {
            isStreamingRef.current = false
            setIsLoading(false)
            // Force scroll to bottom after streaming completes
            setTimeout(() => scrollToBottom(true), 100)
        }
    }

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = input
        setInput('')

        // Add user message
        setMessages(prev => {
            const newMessage: Message = { role: 'user', text: userMessage }
            const updated = [...prev, newMessage]
            messagesRef.current = updated
            return updated
        })

        // Force scroll when user sends a message
        setTimeout(() => scrollToBottom(true), 100)

        await sendMessage(userMessage)
    }

    // Auto-send initial prompt for text mode
    useEffect(() => {
        if (showScene) return
        if (!loaderData.prompt) return

        // CRITICAL: Block if we have any indication of history or existing session
        if (hasAutoSent.current || messages.length > 1 || loaderData.sessionData) {
            hasAutoSent.current = true
            return
        }

        hasAutoSent.current = true

        setMessages(prev => {
            const newMessage: Message = { role: 'user', text: loaderData.prompt }
            const updated = [...prev, newMessage]
            messagesRef.current = updated
            return updated
        })

        sendMessage(loaderData.prompt)
    }, [showScene, loaderData.prompt])


    return {
        messages,
        input,
        isLoading,
        showUpgradeModal,
        setShowUpgradeModal,
        handleSend,
        setInput,
        messagesContainerRef,
        messagesEndRef,
        showScene,
        modelId,
    }

}