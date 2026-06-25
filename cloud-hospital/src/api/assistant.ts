import request from '../utils/request'
import type { Result } from '../types'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatResponse {
  content: string
  finish_reason?: string
}

let currentXhr: XMLHttpRequest | null = null

export const sendMessageApi = (content: string): Promise<Result<ChatResponse>> =>
  request.post('/assistant/chat', { content })

export const abortChatRequest = () => {
  if (currentXhr) {
    currentXhr.abort()
    currentXhr = null
  }
}

export const sendMessageStreamApi = (
  content: string,
  onData: (chunk: string) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (currentXhr) {
      currentXhr.abort()
    }

    const xhr = new XMLHttpRequest()
    currentXhr = xhr
    let lastProcessedLength = 0

    xhr.open('POST', '/api/assistant/chat/stream', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.responseType = 'text'

    xhr.onprogress = () => {
      const response = xhr.responseText
      if (response && response.length > lastProcessedLength) {
        const newContent = response.slice(lastProcessedLength)
        lastProcessedLength = response.length

        const lines = newContent.split('\n').filter((line) => line.trim())
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                onData(data.content)
              }
            } catch {
            }
          }
        }
      }
    }

    xhr.onload = () => {
      currentXhr = null
      if (xhr.status === 200) {
        resolve()
      } else {
        reject(new Error('请求失败'))
      }
    }

    xhr.onerror = () => {
      currentXhr = null
      if (xhr.status === 0) {
        resolve()
      } else if (onError) {
        onError(new Error('网络错误'))
      } else {
        reject(new Error('网络错误'))
      }
    }

    xhr.onabort = () => {
      currentXhr = null
      resolve()
    }

    xhr.send(JSON.stringify({ content }))
  })
}
