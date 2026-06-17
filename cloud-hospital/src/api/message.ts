
import request from '../utils/request'
import type {
  MessageCreateDTO,
  MessagePageResult,
  MessageUnreadVO,
  Result,
  SysMessageVO
} from '../types'

export interface MessageQuery {
  keyword?: string
  isRead?: number
  messageType?: string
  pageNum?: number
  pageSize?: number
}

export const listMyMessagesApi = (
  params: MessageQuery
): Promise<Result<MessagePageResult>> => request.get('/messages', { params })

export const unreadMessageApi = (): Promise<Result<MessageUnreadVO>> =>
  request.get('/messages/unread')

export const latestMessagesApi = (limit = 5): Promise<Result<SysMessageVO[]>> =>
  request.get('/messages/latest', { params: { limit } })

export const markMessageReadApi = (id: number): Promise<Result<null>> =>
  request.put(`/messages/${id}/read`)

export const markAllMessagesReadApi = (): Promise<Result<null>> =>
  request.put('/messages/read-all')

export const deleteMessageApi = (id: number): Promise<Result<null>> =>
  request.delete(`/messages/${id}`)

export const createMessageApi = (data: MessageCreateDTO): Promise<Result<null>> =>
  request.post('/messages', data)