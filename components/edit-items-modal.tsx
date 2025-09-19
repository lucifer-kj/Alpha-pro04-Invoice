"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus } from "lucide-react"
import type { LineItem } from "./invoice-form"

interface EditItemsModalProps {
  isOpen: boolean
  onClose: () => void
  items: LineItem[]
  onSave: (items: LineItem[]) => void
}

export function EditItemsModal({ isOpen, onClose, items, onSave }: EditItemsModalProps) {
  const [editedItems, setEditedItems] = useState<LineItem[]>(items)

  const updateItem = (index: number, field: keyof LineItem, value: string | number | boolean) => {
    setEditedItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value,
      }

      // Recalculate total when quantity or unit_price changes
      if (field === "quantity" || field === "unit_price") {
        updated[index].total = updated[index].quantity * updated[index].unit_price
      }

      return updated
    })
  }

  const removeItem = (index: number) => {
    setEditedItems((prev) => prev.filter((_, i) => i !== index))
  }

  const addItem = () => {
    setEditedItems((prev) => [
      ...prev,
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        total: 0,
        isMonthly: false,
      },
    ])
  }

  const handleSave = () => {
    // Filter out empty items
    const validItems = editedItems.filter((item) => item.description.trim() && item.unit_price > 0 && item.quantity > 0)
    onSave(validItems)
    onClose()
  }

  const handleCancel = () => {
    setEditedItems(items) // Reset to original items
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Parsed Services</DialogTitle>
          <DialogDescription>Review and modify the parsed services before generating your invoice.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {editedItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 border rounded-lg">
              <div className="col-span-5">
                <Label htmlFor={`description-${index}`}>Description</Label>
                <Input
                  id={`description-${index}`}
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  placeholder="Service description"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor={`unit_price-${index}`}>Unit Price</Label>
                <Input
                  id={`unit_price-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, "unit_price", Number.parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="col-span-2">
                <Label>Total</Label>
                <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                  ${item.total.toFixed(2)}{item.isMonthly ? '/month' : ''}
                </div>
              </div>

              <div className="col-span-1 flex items-center gap-2">
                <div className="text-xs text-muted-foreground">Monthly</div>
                <button
                  onClick={() => updateItem(index, 'isMonthly', !item.isMonthly)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    item.isMonthly ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      item.isMonthly ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="col-span-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button onClick={addItem} variant="outline" className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
