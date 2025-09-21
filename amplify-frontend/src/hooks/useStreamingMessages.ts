import { useState, useCallback, useRef } from 'react'
import { StreamMessage } from '../components/StreamingMessage'

export interface UseStreamingMessagesReturn {
  messages: StreamMessage[]
  addMessage: (message: Omit<StreamMessage, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, updates: Partial<StreamMessage>) => void
  appendToMessage: (id: string, text: string) => void
  clearMessages: () => void
  getCurrentMessage: (id: string) => StreamMessage | undefined
  findMessageById: (id: string) => StreamMessage | undefined
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
  }, []) // 의존성 배열은 비워두어 함수가 안정적으로 유지되도록 함

  const updateMessage = useCallback((id: string, updates: Partial<StreamMessage>) => {
    setMessages(prev => {
      const updatedMessages = prev.map(msg => {
        if (msg.id === id) {
          const updatedMessage = { ...msg, ...updates }
          messageRefs.current.set(id, updatedMessage)
          return updatedMessage
        }
        return msg
      })
      
      // 강제로 리렌더링을 트리거하기 위해 새로운 배열 반환
      return [...updatedMessages]
    })
  }, [])

  const appendToMessage = useCallback((id: string, text: string) => {
    // 먼저 ref를 업데이트하여 즉시 접근 가능하도록 함
    const currentMessage = messageRefs.current.get(id)
    if (currentMessage) {
      const updatedMessage = { 
        ...currentMessage, 
        data: (currentMessage.data || '') + text,
        timestamp: new Date()
      }
      messageRefs.current.set(id, updatedMessage)
    }
    
    // 그 다음 상태를 업데이트하여 리렌더링 트리거
    setMessages(prev => {
      const updatedMessages = prev.map(msg => {
        if (msg.id === id) {
          const updatedMessage = { 
            ...msg, 
            data: (msg.data || '') + text,
            timestamp: new Date()
          }
          return updatedMessage
        }
        return msg
      })
      
      // 강제로 리렌더링을 트리거하기 위해 새로운 배열 반환
      return [...updatedMessages]
    })
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    messageRefs.current.clear()
  }, [])

  const getCurrentMessage = useCallback((id: string): StreamMessage | undefined => {
    return messageRefs.current.get(id)
  }, [])

  const findMessageById = useCallback((id: string): StreamMessage | undefined => {
    // 먼저 ref에서 찾고, 없으면 현재 messages 상태에서 찾기
    const refMessage = messageRefs.current.get(id)
    if (refMessage) {
      return refMessage
    }
    
    // ref에 없으면 현재 상태에서 찾기 (최신 상태 보장)
    return messages.find(msg => msg.id === id)
  }, [messages])

  return {
    messages,
    addMessage,
    updateMessage,
    appendToMessage,
    clearMessages,
    getCurrentMessage,
    findMessageById,
  }
}
