"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface AIAssistantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AIAssistantDialog({ open, onOpenChange }: AIAssistantDialogProps) {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [stubMode, setStubMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setResponse("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response")
      }

      setResponse(data.response)
      setStubMode(!!data?.meta?.stub)
    } catch (error) {
      console.error("[v0] AI Assistant Error:", error)
      setResponse(
        (error as Error)?.message ||
          "Sorry, I encountered an error. Please make sure Ollama is running with the tinyllama model.",
      )
      setStubMode(false)
    } finally {
      setLoading(false)
    }
  }, [prompt])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault()
        if (!loading) handleSubmit()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, loading, handleSubmit])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-blue-50 to-indigo-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Powered by Ollama Tinyllama - Ask me anything about social media marketing!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {stubMode && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-900">
              Running in demo mode. Start Ollama tinyllama for AI-generated responses.
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Your Question</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., How can I improve my social media engagement?"
              className="min-h-[100px] resize-none bg-white"
              disabled={loading}
              ref={textareaRef}
            />
          </div>

          {response && (
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <label className="text-sm font-medium text-gray-700 mb-2 block">AI Response</label>
              <p className="text-gray-800 whitespace-pre-wrap">{response}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPrompt("")
                setResponse("")
                onOpenChange(false)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Thinking...
                </>
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
