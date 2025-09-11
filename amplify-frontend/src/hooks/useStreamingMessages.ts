import { useState, useCallback, useRef } from 'react'
import { StreamMessage } from '../components/StreamingMessage'

export interface UseStreamingMessagesReturn {
  messages: StreamMessage[]
  addMessage: (message: Omit<StreamMessage, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, updates: Partial<StreamMessage>) => void
  appendToMessage: (id: string, text: string) => void
  clearMessages: () => void
  getCurrentMessage: (id: string) => StreamMessage | undefined
}

export const useStreamingMessages = (): UseStreamingMessagesReturn => {
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const messageRefs = useRef<Map<string, StreamMessage>>(new Map())

  const addMessage = useCallback((message: Omit<StreamMessage, 'id' | 'timestamp'>): string => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newMessage: StreamMessage = {
      ...message,
      id,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, newMessage])
    messageRefs.current.set(id, newMessage)
    
    return id
  }, [])

  const updateMessage = useCallback((id: string, updates: Partial<StreamMessage>) => {
    setMessages(prev => 
      prev.map(msg => {
        if (msg.id === id) {
          const updatedMessage = { ...msg, ...updates }
          messageRefs.current.set(id, updatedMessage)
          return updatedMessage
        }
        return msg
      })
    )
  }, [])

  const appendToMessage = useCallback((id: string, text: string) => {
    setMessages(prev => 
      prev.map(msg => {
        if (msg.id === id) {
          const updatedMessage = { 
            ...msg, 
            data: (msg.data || '') + text,
            timestamp: new Date() // 타임스탬프 업데이트
          }
          messageRefs.current.set(id, updatedMessage)
          return updatedMessage
        }
        return msg
      })
    )
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    messageRefs.current.clear()
  }, [])

  const getCurrentMessage = useCallback((id: string): StreamMessage | undefined => {
    return messageRefs.current.get(id)
  }, [])

  return {
    messages,
    addMessage,
    updateMessage,
    appendToMessage,
    clearMessages,
    getCurrentMessage,
  }
}
