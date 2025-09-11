"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { parseServicesText } from "@/lib/text-parser"
import { EditItemsModal } from "./edit-items-modal"
import type { LineItem } from "./invoice-form"
import { MessageSquare, Sparkles, Edit3, Zap } from "lucide-react"

interface ConversationalInputProps {
  onServicesParsed: (lineItems: LineItem[]) => void
}

export function ConversationalInput({ onServicesParsed }: ConversationalInputProps) {
  const [inputText, setInputText] = useState("")
  const [parsedItems, setParsedItems] = useState<LineItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleParse = () => {
    if (!inputText.trim()) return

    setIsProcessing(true)
    try {
      const items = parseServicesText(inputText)
      setParsedItems(items)
      onServicesParsed(items)
    } catch (error) {
      console.error("Parsing error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClear = () => {
    setInputText("")
    setParsedItems([])
    onServicesParsed([])
  }

  const handleEditSave = (editedItems: LineItem[]) => {
    setParsedItems(editedItems)
    onServicesParsed(editedItems)
  }

  const exampleSuggestions = [
    "website development for $1,299 and SEO optimization at $499",
    "3x logo design at $50 each and social media management for $299",
    "ai chatbot development $799, website maintenance 199",
  ]

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion)
  }

  return (
    <>
      <Card className="shadow-sm border-border/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            Services & Pricing
            <Badge variant="secondary" className="ml-auto text-xs">
              <Zap className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Describe your services in natural language. Our AI will automatically extract service descriptions,
            quantities, and prices.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="relative">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your services here... e.g., 'website dev at $129 and ai chatbot for $79'"
              rows={4}
              className="resize-none text-base leading-relaxed pr-12"
            />
            <div className="absolute top-3 right-3">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {!inputText && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Try these examples:</p>
              <div className="space-y-2">
                {exampleSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="h-auto py-2 px-3 text-left justify-start text-sm leading-relaxed hover:bg-background"
                  >
                    "{suggestion}"
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleParse} disabled={!inputText.trim() || isProcessing} className="flex-1 h-11">
              {isProcessing ? "Processing..." : "Parse Services"}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={!inputText && parsedItems.length === 0}
              className="h-11 bg-transparent"
            >
              Clear
            </Button>
          </div>

          {parsedItems.length > 0 && (
            <div className="space-y-4 p-4 bg-card border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Parsed Services ({parsedItems.length})
                </h4>
                <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)} className="text-xs h-8">
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="space-y-3">
                {parsedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-3 font-mono">
                      ${item.total.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditItemsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        items={parsedItems}
        onSave={handleEditSave}
      />
    </>
  )
}
