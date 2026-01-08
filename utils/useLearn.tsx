import { createLearningSessionFn, getSessionMessagesFn, saveMessageFn } from "@/services/learning-funcs"
import { getExplanationStreamFn } from "@/services/server-funcs"
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
    const [sessionId, setSessionId] = useState<string | null>(search.session || loaderData.sessionData?.id || null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const hasAutoSent = useRef(false)

    // Determine if we should show the scene canvas
    const showScene = search.type === 'image'

    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant', text: showScene
                ? "Welcome to this interactive world! I've analyzed the scene and identified 3 to 5 key learning hotspots for you to explore. Where would you like to start?"
                : "Hello! I'm your LensLearn AI Guide. What would you like to learn about today?"
        }
    ])

    // Add a ref to track the latest messages
    const messagesRef = useRef(messages)
    const isStreamingRef = useRef(false)

    // Keep ref in sync with state
    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    // Load history if session exists
    useEffect(() => {
        const loadHistory = async () => {
            if (!sessionId) return

            try {
                const history = await getSessionMessagesFn({ data: { sessionId } })
                if (history && history.length > 0) {
                    const formattedHistory: Message[] = history.map((m: any) => ({
                        role: m.role,
                        text: m.text
                    }))
                    setMessages(formattedHistory)
                    hasAutoSent.current = true // Prevent auto-sending if we have history
                }
            } catch (err) {
                console.error("Failed to load history:", err)
            }
        }
        loadHistory()
    }, [sessionId])

    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
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
            } catch (err) {
                console.error("Failed to create session:", err)
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
                saveMessageFn({
                    data: {
                        sessionId: currentSessionId,
                        role: 'assistant',
                        text: accumulatedText
                    }
                }).catch(err => console.error("Failed to save assistant message:", err))
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

        // Create session for user message if needed (redundant but safe)
        let currentSessionId: string | undefined = sessionId ?? undefined
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
            } catch (err) {
                console.error("Failed to create session in handleSend:", err)
            }
        }

        // Save user message to DB
        if (currentSessionId) {
            saveMessageFn({
                data: {
                    sessionId: currentSessionId,
                    role: 'user',
                    text: userMessage
                }
            }).catch(err => console.error("Failed to save user message:", err))
        }

        await sendMessage(userMessage, currentSessionId)
    }

    // Auto-send initial prompt for text mode
    useEffect(() => {
        if (showScene) return
        if (!loaderData.prompt) return
        if (hasAutoSent.current) return

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
    }

}