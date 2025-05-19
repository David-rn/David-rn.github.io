"use client"

import "ios-vibrator-pro-max"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Plus,
  ArrowUp,
  Briefcase,
  GraduationCap,
  FileText,
  Code,
  Mail,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { portfolioData, isQueryInScope, getPortfolioResponse, getOutOfScopeResponse } from "../lib/portfolio-data"
import TypewriterEffect from "@/components/typewriter-effect"

type ActiveButton = "none" | "add" | "deepSearch" | "think"
type MessageType = "user" | "system"

interface Message {
  id: string
  content: string
  type: MessageType
  completed?: boolean
  newSection?: boolean
}

interface MessageSection {
  id: string
  messages: Message[]
  isNewSection: boolean
  isActive?: boolean
  sectionIndex: number
}

interface StreamingWord {
  id: number
  text: string
}

interface TopicBubble {
  id: string
  label: string
  icon: React.ReactNode
  query: string
}

// Faster word delay for smoother streaming
const WORD_DELAY = 40 // ms per word
const CHUNK_SIZE = 2 // Number of words to add at once

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const newSectionRef = useRef<HTMLDivElement>(null)
  const [hasTyped, setHasTyped] = useState(false)
  const [activeButton, setActiveButton] = useState<ActiveButton>("none")
  const [isMobile, setIsMobile] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageSections, setMessageSections] = useState<MessageSection[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingWords, setStreamingWords] = useState<StreamingWord[]>([])
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [viewportHeight, setViewportHeight] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [completedMessages, setCompletedMessages] = useState<Set<string>>(new Set())
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const shouldFocusAfterStreamingRef = useRef(false)
  const mainContainerRef = useRef<HTMLDivElement>(null)
  // Store selection state
  const selectionStateRef = useRef<{ start: number | null; end: number | null }>({ start: null, end: null })

  // Words for the typewriter effect based on the portfolio data
  const typewriterWords = [
    "Computer Vision",
    "Artificial Intelligence",
    "Running",
    "Photography",
    ]

  // Define topic bubbles
  const topicBubbles: TopicBubble[] = [
    { id: "about", label: "About Me", icon: <User className="h-4 w-4" />, query: "Tell me about yourself" },
    {
      id: "experience",
      label: "Experience",
      icon: <Briefcase className="h-4 w-4" />,
      query: "What is your work experience?",
    },
    {
      id: "education",
      label: "Education",
      icon: <GraduationCap className="h-4 w-4" />,
      query: "What is your educational background?",
    },
    {
      id: "publications",
      label: "Publications",
      icon: <FileText className="h-4 w-4" />,
      query: "What have you published?",
    },
    {
      id: "projects",
      label: "Projects",
      icon: <Code className="h-4 w-4" />,
      query: "What projects do you have?",
    },
    { id: "contact", label: "Contact", icon: <Mail className="h-4 w-4" />, query: "How can I contact you?" },
  ]

  // Constants for layout calculations to account for the padding values
  const TOP_PADDING = 48 // pt-12 (3rem = 48px)
  const BOTTOM_PADDING = 128 // pb-32 (8rem = 128px)
  const ADDITIONAL_OFFSET = 16 // Reduced offset for fine-tuning

  // Check if device is mobile and get viewport height
  useEffect(() => {
    const checkMobileAndViewport = () => {
      const isMobileDevice = window.innerWidth < 768
      setIsMobile(isMobileDevice)

      // Capture the viewport height
      const vh = window.innerHeight
      setViewportHeight(vh)

      // Apply fixed height to main container on mobile
      if (isMobileDevice && mainContainerRef.current) {
        mainContainerRef.current.style.height = `${vh}px`
      }
    }

    checkMobileAndViewport()

    // Set initial height
    if (mainContainerRef.current) {
      mainContainerRef.current.style.height = isMobile ? `${viewportHeight}px` : "100svh"
    }

    // Update on resize
    window.addEventListener("resize", checkMobileAndViewport)

    // Add welcome message
    const welcomeMessage = {
      id: `system`,
      content: ``,
      type: "system" as MessageType,
      completed: true,
    }

    setMessages([welcomeMessage])
    setCompletedMessages(new Set([welcomeMessage.id]))

    return () => {
      window.removeEventListener("resize", checkMobileAndViewport)
    }
  }, [isMobile, viewportHeight])

  // Organize messages into sections
  useEffect(() => {
    if (messages.length === 0) {
      setMessageSections([])
      setActiveSectionId(null)
      return
    }

    const sections: MessageSection[] = []
    let currentSection: MessageSection = {
      id: `section-${Date.now()}-0`,
      messages: [],
      isNewSection: false,
      sectionIndex: 0,
    }

    messages.forEach((message) => {
      if (message.newSection) {
        // Start a new section
        if (currentSection.messages.length > 0) {
          // Mark previous section as inactive
          sections.push({
            ...currentSection,
            isActive: false,
          })
        }

        // Create new active section
        const newSectionId = `section-${Date.now()}-${sections.length}`
        currentSection = {
          id: newSectionId,
          messages: [message],
          isNewSection: true,
          isActive: true,
          sectionIndex: sections.length,
        }

        // Update active section ID
        setActiveSectionId(newSectionId)
      } else {
        // Add to current section
        currentSection.messages.push(message)
      }
    })

    // Add the last section if it has messages
    if (currentSection.messages.length > 0) {
      sections.push(currentSection)
    }

    setMessageSections(sections)
  }, [messages])

  // Scroll to maximum position when new section is created, but only for sections after the first
  useEffect(() => {
    if (messageSections.length > 0) {
      setTimeout(() => {
        const scrollContainer = chatContainerRef.current

        if (scrollContainer) {
          // Scroll to maximum possible position
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          })
        }
      }, 100)
    }
  }, [messageSections, isStreaming])

  // Add a new useEffect to handle scrolling when streaming completes
  useEffect(() => {
    if (!isStreaming && streamingMessageId === null && messagesEndRef.current) {
      // Scroll to the end of messages when streaming completes
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [isStreaming, streamingMessageId])

  // Focus the textarea on component mount (only on desktop)
  useEffect(() => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus()
    }
  }, [isMobile])

  // Set focus back to textarea after streaming ends (only on desktop)
  useEffect(() => {
    if (!isStreaming && shouldFocusAfterStreamingRef.current && !isMobile) {
      focusTextarea()
      shouldFocusAfterStreamingRef.current = false
    }
  }, [isStreaming, isMobile])

  // Save the current selection state
  const saveSelectionState = () => {
    if (textareaRef.current) {
      selectionStateRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      }
    }
  }

  // Restore the saved selection state
  const restoreSelectionState = () => {
    const textarea = textareaRef.current
    const { start, end } = selectionStateRef.current

    if (textarea && start !== null && end !== null) {
      // Focus first, then set selection range
      textarea.focus()
      textarea.setSelectionRange(start, end)
    } else if (textarea) {
      // If no selection was saved, just focus
      textarea.focus()
    }
  }

  const focusTextarea = () => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus()
    }
  }

  const handleInputContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only focus if clicking directly on the container, not on buttons or other interactive elements
    if (
      e.target === e.currentTarget ||
      (e.currentTarget === inputContainerRef.current && !(e.target as HTMLElement).closest("button"))
    ) {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  const simulateTextStreaming = async (text: string) => {
    // Split text into words
    const words = text.split(" ")
    let currentIndex = 0
    setStreamingWords([])
    setIsStreaming(true)

    return new Promise<void>((resolve) => {
      const streamInterval = setInterval(() => {
        if (currentIndex < words.length) {
          // Add a few words at a time
          const nextIndex = Math.min(currentIndex + CHUNK_SIZE, words.length)
          const newWords = words.slice(currentIndex, nextIndex)

          setStreamingWords((prev) => [
            ...prev,
            {
              id: Date.now() + currentIndex,
              text: newWords.join(" ") + " ",
            },
          ])

          currentIndex = nextIndex
        } else {
          clearInterval(streamInterval)
          resolve()
        }
      }, WORD_DELAY)
    })
  }

  const getPortfolioResponseForQuery = (userMessage: string) => {
    // Check if the query is within the scope of the portfolio
    if (isQueryInScope(userMessage)) {
      return getPortfolioResponse(userMessage)
    } else {
      return getOutOfScopeResponse()
    }
  }

  const simulateAIResponse = async (userMessage: string) => {
    const response = getPortfolioResponseForQuery(userMessage)

    // Create a new message with empty content
    const messageId = Date.now().toString()
    setStreamingMessageId(messageId)

    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        content: "",
        type: "system",
      },
    ])

    // Add a delay before the second vibration
    setTimeout(() => {
      // Add vibration when streaming begins
      navigator.vibrate(50)
    }, 200) // 200ms delay to make it distinct from the first vibration

    // Stream the text
    await simulateTextStreaming(response)

    // Update with complete message
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, content: response, completed: true } : msg)),
    )

    // Add to completed messages set to prevent re-animation
    setCompletedMessages((prev) => new Set(prev).add(messageId))

    // Add vibration when streaming ends
    navigator.vibrate(50)

    // Reset streaming state
    setStreamingWords([])
    setStreamingMessageId(null)
    setIsStreaming(false)

    // Ensure scrolling to the bottom after response is complete
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
      }

      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        })
      }
    }, 100)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value

    // Only allow input changes when not streaming
    if (!isStreaming) {
      setInputValue(newValue)

      if (newValue.trim() !== "" && !hasTyped) {
        setHasTyped(true)
      } else if (newValue.trim() === "" && hasTyped) {
        setHasTyped(false)
      }

      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = "auto"
        const newHeight = Math.max(24, Math.min(textarea.scrollHeight, 160))
        textarea.style.height = `${newHeight}px`
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isStreaming) {
      // Add vibration when message is submitted
      navigator.vibrate(50)

      const userMessage = inputValue.trim()

      // Add as a new section if messages already exist
      const shouldAddNewSection = messages.length > 0

      const newUserMessage = {
        id: `user-${Date.now()}`,
        content: userMessage,
        type: "user" as MessageType,
        newSection: shouldAddNewSection,
      }

      // Reset input before starting the AI response
      setInputValue("")
      setHasTyped(false)
      setActiveButton("none")

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }

      // Add the message after resetting input
      setMessages((prev) => [...prev, newUserMessage])

      // Only focus the textarea on desktop, not on mobile
      if (!isMobile) {
        focusTextarea()
      } else {
        // On mobile, blur the textarea to dismiss the keyboard
        if (textareaRef.current) {
          textareaRef.current.blur()
        }
      }

      // Start AI response
      simulateAIResponse(userMessage)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Cmd+Enter on both mobile and desktop
    if (!isStreaming && e.key === "Enter" && e.metaKey) {
      e.preventDefault()
      handleSubmit(e)
      return
    }

    // Only handle regular Enter key (without Shift) on desktop
    if (!isStreaming && !isMobile && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleButton = (button: ActiveButton) => {
    if (!isStreaming) {
      // Save the current selection state before toggling
      saveSelectionState()

      setActiveButton((prev) => (prev === button ? "none" : button))

      // Restore the selection state after toggling
      setTimeout(() => {
        restoreSelectionState()
      }, 0)
    }
  }

  const handleTopicBubbleClick = (query: string) => {
    if (!isStreaming) {
      // Set the input value to the query
      setInputValue(query)
      setHasTyped(true)

      // Focus the textarea
      if (textareaRef.current) {
        textareaRef.current.focus()
      }

      // Adjust textarea height
      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = "auto"
        const newHeight = Math.max(24, Math.min(textarea.scrollHeight, 160))
        textarea.style.height = `${newHeight}px`
      }
    }
  }

  // Update the renderMessage function to properly format markdown-like content
  const renderMessage = (message: Message) => {
    const isCompleted = completedMessages.has(message.id)

    // Function to format text with markdown-like syntax
    const formatText = (text: string) => {
      // Replace headers
      const formattedText = text
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-1">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>')

        // Replace bold text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

        // Replace bullet points
        .replace(/^• (.*$)/gm, '<li class="ml-5">$1</li>')

        // Replace horizontal rules
        .replace(/^---$/gm, '<hr class="my-4 border-t border-gray-200" />')

        // Replace line breaks with <br> tags
        .replace(/\n/g, "<br />")

        .replace(/\[(.*?)\]\((.*?)\)/g, "<a style=\"color:#189AB4\" href=\"$2\">$1</a>")

      return formattedText
    }

    return (
      <div key={message.id} className={cn("flex flex-col", message.type === "user" ? "items-end" : "items-start")}>
        <div
          className={cn(
            "max-w-[80%] px-4 py-2 rounded-2xl",
            message.type === "user" ? "bg-white border border-gray-200 rounded-br-none" : "text-gray-900",
          )}
        >
          {/* For user messages, render without formatting */}
          {message.type === "user" && message.content && <span className="">{message.content}</span>}

          {/* For system messages, apply formatting */}
          {message.type === "system" && message.content && (
            <div
              className={!isCompleted ? "animate-fade-in" : ""}
              dangerouslySetInnerHTML={{ __html: formatText(message.content) }}
            />
          )}

          {/* For streaming messages, render with animation */}
          {message.id === streamingMessageId && (
            <span className="inline">
              {streamingWords.map((word) => (
                <span key={word.id} className="animate-fade-in inline">
                  {word.text}
                </span>
              ))}
            </span>
          )}
        </div>

      </div>
    )
  }

  // Check if we should show the hero section (only when there's just the welcome message)
  const showHeroSection = messages.length === 1 && messages[0].type === "system"

  return (
    <div
      ref={mainContainerRef}
      className="bg-gray-50 flex flex-col overflow-hidden"
      style={{ height: isMobile ? `${viewportHeight}px` : "100svh", overflowY: "hidden" }}
    >
      <div
        ref={chatContainerRef}
        className="flex-grow pb-48 md:pb-40 pt-12 px-4 overflow-y-auto overscroll-contain"
        data-chat-container
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Enhanced Hero Section with Typewriter Effect */}
          {showHeroSection ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-center hero-animation hero-animation-delay-1">
                {portfolioData.name}
              </h1>
              <div className="text-xl md:text-2xl text-gray-600 mb-8 text-center hero-animation hero-animation-delay-2">
                I'm passionate about <TypewriterEffect words={typewriterWords} />
              </div>
              <p className="text-gray-600 max-w-lg text-center mb-8 hero-animation hero-animation-delay-3">
                {portfolioData.summary}
              </p>
              <div className="animate-bounce mt-8 text-gray-400">
                <ArrowUp className="h-6 w-6 rotate-180" />
              </div>
            </div>
          ) : (
            <>
              {/* Profile section at the top - smaller version after conversation starts */}
              {messages.length === 1 && (
                <div className="flex flex-col items-center my-6 animate-fade-in">
                  <h2 className="text-xl font-bold text-gray-900">{portfolioData.name}</h2>
                  <p className="text-gray-600 mb-2">{portfolioData.title}</p>
                </div>
              )}

              {messageSections.map((section, sectionIndex) => (
                <div
                  key={section.id}
                  ref={sectionIndex === messageSections.length - 1 && section.isNewSection ? newSectionRef : null}
                  className="w-full"
                >
                  {section.isNewSection && (
                    <div className="pt-4 flex flex-col justify-start w-full">
                      {section.messages.map((message) => renderMessage(message))}
                    </div>
                  )}

                  {!section.isNewSection && (
                    <div className="w-full">{section.messages.map((message) => renderMessage(message))}</div>
                  )}
                </div>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {/* Topic bubbles - now with dynamic positioning */}
          <div className="px-4 mb-4 md:mb-4 flex flex-wrap gap-2 justify-center">
            {topicBubbles.map((bubble) => (
              <Button
                key={bubble.id}
                type="button"
                variant="outline"
                className="rounded-full px-3 py-1 h-8 flex items-center gap-1.5 border-gray-200 hover:bg-gray-100 transition-colors"
                onClick={() => handleTopicBubbleClick(bubble.query)}
                disabled={isStreaming}
              >
                {bubble.icon}
                <span className="text-gray-900 text-sm">{bubble.label}</span>
              </Button>
            ))}
          </div>

          <div className="px-4 pb-4 md:pb-4">
            <div
              ref={inputContainerRef}
              className={cn(
                "relative w-full rounded-3xl border border-gray-200 bg-white p-3 cursor-text",
                isStreaming && "opacity-80",
              )}
              onClick={handleInputContainerClick}
            >
              <div className="pb-9">
                <Textarea
                  ref={textareaRef}
                  placeholder={isStreaming ? "Waiting for response..." : "Ask about my portfolio..."}
                  className="min-h-[24px] max-h-[160px] w-full rounded-3xl border-0 bg-transparent text-gray-900 placeholder:text-gray-400 placeholder:text-base focus-visible:ring-0 focus-visible:ring-offset-0 text-base pl-2 pr-4 pt-0 pb-0 resize-none overflow-y-auto leading-tight"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    // Ensure the textarea is scrolled into view when focused
                    if (textareaRef.current) {
                      textareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                  }}
                />
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn(
                        "rounded-full h-8 w-8 flex-shrink-0 border-gray-200 p-0 transition-colors",
                        activeButton === "add" && "bg-gray-100 border-gray-300",
                      )}
                      onClick={() => toggleButton("add")}
                      disabled={isStreaming}
                    >
                      <Plus className={cn("h-4 w-4 text-gray-500", activeButton === "add" && "text-gray-700")} />
                      <span className="sr-only">Add</span>
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    size="icon"
                    className={cn(
                      "rounded-full h-8 w-8 border-0 flex-shrink-0 transition-all duration-200",
                      hasTyped ? "bg-black scale-110" : "bg-gray-200",
                    )}
                    disabled={!inputValue.trim() || isStreaming}
                  >
                    <ArrowUp className={cn("h-4 w-4 transition-colors", hasTyped ? "text-white" : "text-gray-500")} />
                    <span className="sr-only">Submit</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
