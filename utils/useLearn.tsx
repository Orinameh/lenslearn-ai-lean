import { getExplanationStreamFn } from "@/services/server-funcs"
import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"

export type Message = {
    role: 'user' | 'assistant'
    text: string
}

export const useLearn = (search: { type?: 'text' | 'image' }, id: string, loaderData: { prompt: string }) => {

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const hasAutoSent = useRef(false)

    // Determine if we should show the scene canvas
    const showScene = search.type === 'image'

    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant', text: showScene
                ? "Welcome to this interactive world! I've analyzed the scene and identified 3 key learning hotspots for you to explore. Where would you like to start?"
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

    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    // Improved auto-scroll function
    const scrollToBottom = (force = false) => {
        if (force || isStreamingRef.current) {
            // Always scroll during streaming or when forced
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        } else {
            // Otherwise check if user is near bottom
            const container = messagesContainerRef.current
            if (!container) return

            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
            if (isNearBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
        }
    }

    // Auto-scroll during streaming
    useEffect(() => {
        if (isStreamingRef.current) {
            scrollToBottom(true)
        }
    }, [messages])

    const sendMessage = async (userMessage: string) => {
        setIsLoading(true)
        isStreamingRef.current = true

        const currentMessages = messagesRef.current

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
            let lastUpdateTime = Date.now()

            try {
                while (true) {
                    const { done, value } = await reader.read()

                    if (done) {
                        break
                    }

                    const chunk = decoder.decode(value, { stream: true })
                    accumulatedText += chunk

                    const now = Date.now()
                    if (now - lastUpdateTime > 50 || done) {
                        setMessages(prev => {
                            const newMessages = [...prev]
                            newMessages[newMessages.length - 1] = {
                                role: 'assistant',
                                text: accumulatedText
                            }
                            return newMessages
                        })
                        lastUpdateTime = now
                    }
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