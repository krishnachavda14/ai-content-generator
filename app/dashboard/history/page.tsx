'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { desc } from 'drizzle-orm'
import { db } from '@/utils/db'
import { AIOutput } from '@/utils/schema'

export interface HistoryEntry {
  id: number
  formData: string
  templateSlug: string
  aiResponse: string // Always a string
  createdBy: string
  createdAt: string // Always a string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchHistory() {
      try {
        const results = await db.select().from(AIOutput).orderBy(desc(AIOutput.createdAt))

        // Transform data to ensure aiResponse and createdAt are strings
        const transformedResults: HistoryEntry[] = results.map((entry) => ({
          ...entry,
          aiResponse: entry.aiResponse ?? "", // Replace null with an empty string
          createdAt: entry.createdAt ?? "", // Replace null with an empty string
        }))

        setHistory(transformedResults)
      } catch (error) {
        console.error("Error fetching history:", error)
      }
    }

    fetchHistory()
  }, [])

  const filteredHistory = history.filter(entry => 
    entry.templateSlug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.aiResponse.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const getTemplateIcon = (slug: string) => {
    switch (slug) {
      case 'write-code':
        return '💻'
      case 'instagram-hashtags':
        return '#️⃣'
      case 'blog-topics':
        return '📝'
      default:
        return '📄'
    }
  }

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).length
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-2">History</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Search your previously generated AI content
      </p>
      
      <Input
        type="search"
        placeholder="Search history..."
        className="max-w-md mb-6"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>TEMPLATE</TableHead>
              <TableHead className="w-[400px]">AI RESP</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>WORDS</TableHead>
              <TableHead>COPY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No results found for "{searchTerm}". Try adjusting your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTemplateIcon(entry.templateSlug)}</span>
                      <span className="capitalize">
                        {entry.templateSlug.replace(/-/g, ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[400px] truncate">
                    {entry.aiResponse}
                  </TableCell>
                  <TableCell>
                    {new Date(entry.createdAt).toLocaleDateString('en-GB')}
                  </TableCell>
                  <TableCell>{getWordCount(entry.aiResponse)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      className="text-primary hover:text-primary/80"
                    >
                      Copy
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}


