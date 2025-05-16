"use client"

import { useState, useEffect } from "react"

interface TypewriterEffectProps {
  words: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseTime?: number
}

export default function TypewriterEffect({
  words,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseTime = 1500,
}: TypewriterEffectProps) {
  const [text, setText] = useState("")
  const [wordIndex, setWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBlinking, setIsBlinking] = useState(true)

  useEffect(() => {
    const currentWord = words[wordIndex]

    const timer = setTimeout(
      () => {
        // Handle typing animation
        if (!isDeleting) {
          setText(currentWord.substring(0, text.length + 1))
          setIsBlinking(false)

          // If word is complete, pause then start deleting
          if (text === currentWord) {
            setIsBlinking(true)
            setTimeout(() => {
              setIsDeleting(true)
              setIsBlinking(false)
            }, pauseTime)
          }
        } else {
          // Handle deleting animation
          setText(currentWord.substring(0, text.length - 1))

          // If word is deleted, move to next word
          if (text === "") {
            setIsDeleting(false)
            setWordIndex((prev) => (prev + 1) % words.length)
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed,
    )

    return () => clearTimeout(timer)
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseTime])

  return (
    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
      {text}
      <span className={`border-r-2 border-blue-500 ml-1 ${isBlinking ? "animate-blink" : "opacity-0"}`}>&nbsp;</span>
    </span>
  )
}
