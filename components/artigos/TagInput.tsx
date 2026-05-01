'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function TagInput({ value = [], onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [allTags, setAllTags] = useState<{name: string, slug: string}[]>([])

  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setAllTags(data.data)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (inputValue.trim().length > 0) {
      const lowerVal = inputValue.toLowerCase()
      setSuggestions(
        allTags
          .filter(t => t.name.toLowerCase().includes(lowerVal) && !value.includes(t.name))
          .map(t => t.name)
      )
    } else {
      setSuggestions([])
    }
  }, [inputValue, allTags, value])

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
    }
  }

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
  }

  function removeTag(tagToRemove: string) {
    onChange(value.filter(t => t !== tagToRemove))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(tag)}
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              <X size={14} />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input 
          type="text"
          placeholder="Digite uma tag e pressione Enter..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-surface border rounded-md shadow-lg p-1">
            {suggestions.map(sug => (
              <div 
                key={sug}
                className="px-3 py-2 cursor-pointer hover:bg-muted rounded-sm text-sm"
                onClick={() => addTag(sug)}
              >
                {sug}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
