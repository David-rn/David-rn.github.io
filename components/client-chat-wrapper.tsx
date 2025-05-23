'use client'

import dynamic from 'next/dynamic'

const ChatInterface = dynamic(() => import('@/components/chat-interface'), {
  ssr: false,
})

export default function ClientChatWrapper() {
  return <ChatInterface />
} 