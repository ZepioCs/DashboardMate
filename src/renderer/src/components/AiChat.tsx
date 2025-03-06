import { useState, useEffect } from 'react'
import { Loader2, Send, X, MessageSquare } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '../lib/utils'

export function AiChat(): JSX.Element {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>(
    []
  )
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('ai-chat-open')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('ai-chat-open', JSON.stringify(isOpen))
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    // TODO: Implement actual API call to ChatGPT
    // For now, just simulate a response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'This is a placeholder response. ChatGPT integration coming soon!'
        }
      ])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex flex-col rounded-lg border bg-card text-card-foreground shadow-2xl transition-all duration-200',
        isOpen ? 'h-[500px] w-[400px]' : 'h-12 w-12'
      )}
    >
      {isOpen ? (
        <>
          <div className="flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">AI Assistant</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
                <p className="text-lg font-medium">How can I help you today?</p>
                <p className="text-sm">Ask me to create tasks or help you organize your work.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn('flex', {
                      'justify-end': msg.role === 'user'
                    })}
                  >
                    <div
                      className={cn('max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm', {
                        'bg-primary text-primary-foreground': msg.role === 'user',
                        'bg-muted': msg.role === 'assistant'
                      })}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2 text-sm shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="border-t bg-card/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <form onSubmit={handleSubmit}>
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me to create tasks..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isLoading}
                  className="border-muted-foreground/20"
                />
                <Button type="submit" disabled={isLoading} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="h-full w-full rounded-lg border-muted-foreground/20"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
