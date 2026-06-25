<script setup lang="ts">
import { ref, nextTick, watch, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Message } from '../api/assistant'
import { sendMessageStreamApi, abortChatRequest } from '../api/assistant'
import { getUser } from '../utils/request'

const STORAGE_KEY = 'cloud-hospital-chat-history'
const MAX_STORED_MESSAGES = 50

const visible = ref(false)
const inputMessage = ref('')
const messages = ref<Message[]>([])
const isLoading = ref(false)
const messagesContainerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const textareaHeight = ref(44)
const currentUser = ref(getUser())

const quickQuestions = [
  { icon: '📅', label: '在线挂号', content: '如何在线挂号？' },
  { icon: '💊', label: '药品咨询', content: '请问感冒药应该怎么吃？' },
  { icon: '🩺', label: '症状分析', content: '我最近有点头痛、发烧，应该怎么办？' },
  { icon: '🏥', label: '科室导航', content: '医院有哪些科室？' },
  { icon: '⏰', label: '就诊流程', content: '医院就诊流程是什么样的？' },
  { icon: '💳', label: '医保报销', content: '医保报销怎么办理？' },
  { icon: '👨‍⚕️', label: '医生排班', content: '如何查询医生排班信息？' },
  { icon: '📋', label: '取药须知', content: '取药需要注意什么？' }
]

const isTyping = computed(() => isLoading.value)

const welcomeMessage = computed(() => {
  const userName = currentUser.value?.realName || ''
  const greeting = userName ? `${userName}，您好！` : '您好！'
  
  let roleSpecific = ''
  if (currentUser.value?.roleCode === 'patient') {
    roleSpecific = '\n\n作为患者，我可以帮您：\n• 快速预约挂号\n• 查询就诊记录\n• 药品使用咨询\n• 缴费和报销指引'
  } else if (currentUser.value?.roleCode === 'doctor') {
    roleSpecific = '\n\n作为医生，我可以帮您：\n• 查询排班信息\n• 了解系统操作\n• 药品信息查询\n• 患者就诊流程'
  }
  
  return `${greeting}我是云医院智能助手医小伴。
\n我可以帮助您：
• 在线挂号预约
• 药品咨询
• 症状初步分析
• 科室导航
• 就诊流程指引
${roleSpecific}
\n请问有什么可以帮您？`
})

function loadMessages() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        messages.value = parsed
        return
      }
    }
  } catch (e) {
    console.error('Failed to load chat history:', e)
  }
  messages.value = [
    {
      id: '1',
      role: 'assistant',
      content: welcomeMessage.value,
      timestamp: new Date().toLocaleString()
    }
  ]
}

function saveMessages() {
  try {
    const toSave = messages.value.slice(-MAX_STORED_MESSAGES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('Failed to save chat history:', e)
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTo({
        top: messagesContainerRef.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

watch(messages, () => {
  scrollToBottom()
  saveMessages()
}, { deep: true })

function adjustTextareaHeight() {
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto'
      const scrollHeight = inputRef.value.scrollHeight
      textareaHeight.value = Math.min(Math.max(scrollHeight, 44), 120)
      inputRef.value.style.height = textareaHeight.value + 'px'
    }
  })
}

watch(inputMessage, adjustTextareaHeight)

async function sendMessage() {
  const content = inputMessage.value.trim()
  if (!content || isLoading.value) return

  inputMessage.value = ''
  textareaHeight.value = 44
  if (inputRef.value) {
    inputRef.value.style.height = '44px'
  }

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content,
    timestamp: new Date().toLocaleString()
  }
  messages.value.push(userMessage)

  isLoading.value = true
  const assistantMessageId = (Date.now() + 1).toString()
  const assistantMessage: Message = {
    id: assistantMessageId,
    role: 'assistant',
    content: '',
    timestamp: new Date().toLocaleString()
  }
  messages.value.push(assistantMessage)

  try {
    await sendMessageStreamApi(content, (chunk) => {
      const lastMessage = messages.value[messages.value.length - 1]
      if (lastMessage.id === assistantMessageId && lastMessage.role === 'assistant') {
        lastMessage.content += chunk
      }
    })
  } catch (error) {
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage.id === assistantMessageId && lastMessage.role === 'assistant') {
      if (!lastMessage.content) {
        lastMessage.content = '抱歉，暂时无法连接到智能助手，请稍后再试。\n\n您也可以尝试：\n• 检查网络连接\n• 刷新页面重试\n• 联系系统管理员'
      }
    }
  } finally {
    isLoading.value = false
  }
}

function stopGeneration() {
  abortChatRequest()
  isLoading.value = false
  ElMessage.info('已停止生成')
}

function handleQuickQuestion(content: string) {
  if (isLoading.value) return
  inputMessage.value = content
  sendMessage()
}

function handleKeydown(e: Event) {
  const evt = e as KeyboardEvent
  if (evt.key === 'Enter' && !evt.shiftKey) {
    evt.preventDefault()
    sendMessage()
  }
}

async function copyMessage(content: string) {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    const textarea = document.createElement('textarea')
    textarea.value = content
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('已复制到剪贴板')
  }
}

async function regenerateMessage(messageId: string) {
  const index = messages.value.findIndex(m => m.id === messageId)
  if (index <= 0 || isLoading.value) return

  const userMessage = messages.value[index - 1]
  if (userMessage.role !== 'user') return

  messages.value = messages.value.slice(0, index - 1)
  
  inputMessage.value = userMessage.content
  await sendMessage()
}

async function clearChat() {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有对话记录吗？此操作不可恢复。',
      '清空对话',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    messages.value = [
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: welcomeMessage.value,
        timestamp: new Date().toLocaleString()
      }
    ]
    localStorage.removeItem(STORAGE_KEY)
    ElMessage.success('对话已清空')
  } catch {
  }
}

function formatMessage(content: string): string {
  if (!content) return '<span class="typing-cursor"></span>'
  
  let html = content
  
  html = html.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
  
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
  
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  
  html = html.replace(/^### (.+)$/gm, '<h3 class="message-h3">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="message-h2">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="message-h1">$1</h1>')
  
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')
  
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="message-quote">$1</blockquote>')
  
  html = html.replace(/^---$/gm, '<hr class="message-divider">')
  
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="list-item ordered" style="--index: $1;">$2</li>')
  
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="list-item">$1</li>')
  
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>')
  
  html = html.replace(/\n\n+/g, '</p><p class="message-paragraph">')
  html = html.replace(/\n/g, '<br>')
  
  html = '<p class="message-paragraph">' + html + '</p>'
  
  html = html.replace(/<p class="message-paragraph">\s*(<br\s*\/?>)*\s*<\/p>/g, '')
  
  if (isLoading.value) {
    html += '<span class="typing-cursor"></span>'
  }
  
  return html
}

onMounted(() => {
  loadMessages()
  currentUser.value = getUser()
})

const buttonStyle = computed(() => ({
  transform: visible.value ? 'scale(0)' : 'scale(1)',
  opacity: visible.value ? 0 : 1
}))
</script>

<template>
  <div class="chat-assistant">
    <button
      class="assistant-toggle"
      type="button"
      @click="visible = true"
      :style="buttonStyle"
      aria-label="打开智能助手"
    >
      <div class="toggle-inner">
        <div class="toggle-icon-wrapper">
          <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <span class="toggle-text">医小伴</span>
      </div>
      <div class="toggle-pulse"></div>
    </button>

    <Transition name="drawer">
      <div v-if="visible" class="chat-panel">
        <div class="panel-header">
          <div class="header-content">
            <div class="assistant-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
                <path d="M8 22h8"/>
              </svg>
            </div>
            <div class="assistant-meta">
              <h3 class="assistant-name">医小伴</h3>
              <div class="assistant-status">
                <span class="status-indicator"></span>
                <span>在线服务中</span>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button class="action-btn" type="button" @click="clearChat" title="清空对话" aria-label="清空对话">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
              </svg>
            </button>
            <button class="close-btn" type="button" @click="visible = false" aria-label="关闭">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="quick-section">
          <div class="quick-grid">
            <button
              v-for="q in quickQuestions"
              :key="q.content"
              class="quick-card"
              type="button"
              @click="handleQuickQuestion(q.content)"
              :disabled="isLoading"
            >
              <span class="quick-icon">{{ q.icon }}</span>
              <span class="quick-label">{{ q.label }}</span>
            </button>
          </div>
        </div>

        <div ref="messagesContainerRef" class="messages-area">
          <div class="messages-inner">
            <TransitionGroup name="message">
              <div
                v-for="message in messages"
                :key="message.id"
                class="message-wrapper"
                :class="message.role"
              >
                <div class="message-avatar" :class="message.role">
                  <svg v-if="message.role === 'user'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  </svg>
                </div>
                <div class="message-body">
                  <div class="message-bubble" :class="message.role">
                    <div class="message-text" v-html="formatMessage(message.content)"></div>
                  </div>
                  <div class="message-footer">
                    <span class="message-time">{{ message.timestamp }}</span>
                    <div class="message-actions">
                      <button 
                        class="msg-action-btn" 
                        type="button" 
                        @click="copyMessage(message.content)"
                        title="复制"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5,15H4a2,2,0,0,1-2-2V4A2,2,0,0,1,4,2h9a2,2,0,0,1,2,2v1"/>
                        </svg>
                      </button>
                      <button 
                        v-if="message.role === 'assistant' && messages[messages.indexOf(message) + 1] === undefined && !isLoading"
                        class="msg-action-btn" 
                        type="button" 
                        @click="regenerateMessage(message.id)"
                        title="重新生成"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="23,4 23,10 17,10"/>
                          <path d="M20.49,15a9,9,0,1,1-2.12-9.36L23,10"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TransitionGroup>

            <div v-if="isLoading" class="typing-indicator">
              <div class="typing-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
              </div>
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="input-section">
          <div class="input-wrapper">
            <textarea
              ref="inputRef"
              v-model="inputMessage"
              class="input-field"
              placeholder="输入您的问题..."
              rows="1"
              @keydown="handleKeydown"
              :disabled="isLoading"
            ></textarea>
            <button
              v-if="!isLoading"
              class="send-btn"
              type="button"
              :disabled="!inputMessage.trim()"
              @click="sendMessage"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
            <button
              v-else
              class="send-btn stop-btn"
              type="button"
              @click="stopGeneration"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            </button>
          </div>
          <div class="input-hints">
            <span class="hint-item">Enter 发送</span>
            <span class="hint-divider">|</span>
            <span class="hint-item">Shift+Enter 换行</span>
          </div>
          <div class="disclaimer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>仅供参考，不构成医疗诊断</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.chat-assistant {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.assistant-toggle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: none;
  border-radius: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  cursor: pointer;
  box-shadow: 
    0 10px 40px rgba(102, 126, 234, 0.4),
    0 0 0 0 rgba(102, 126, 234, 0.4);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
}

.assistant-toggle:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 
    0 20px 60px rgba(102, 126, 234, 0.5),
    0 0 0 0 rgba(102, 126, 234, 0.4);
}

.toggle-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 1;
}

.toggle-icon-wrapper {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon {
  width: 24px;
  height: 24px;
}

.toggle-text {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.toggle-pulse {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: pulse 2s ease-in-out infinite;
  z-index: -1;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.3;
  }
}

.chat-panel {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 420px;
  height: 680px;
  max-height: calc(100vh - 48px);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 
    0 25px 80px rgba(0, 0, 0, 0.15),
    0 0 1px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assistant-avatar {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.assistant-avatar svg {
  width: 26px;
  height: 26px;
}

.assistant-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.assistant-name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.assistant-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.9;
}

.status-indicator {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.action-btn,
.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover,
.close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.close-btn:hover {
  transform: rotate(90deg);
}

.action-btn svg,
.close-btn svg {
  width: 18px;
  height: 18px;
}

.quick-section {
  padding: 16px 20px;
  background: linear-gradient(to bottom, #f8fafc, #fff);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: none;
  background: #fff;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.quick-card:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
  background: linear-gradient(135deg, #f8fafc, #fff);
}

.quick-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-icon {
  font-size: 20px;
}

.quick-label {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
}

.messages-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-wrapper {
  display: flex;
  gap: 12px;
  max-width: 90%;
}

.message-wrapper.user {
  flex-direction: row-reverse;
  margin-left: auto;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-avatar.assistant {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.message-avatar.user {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
}

.message-avatar svg {
  width: 18px;
  height: 18px;
}

.message-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.message-wrapper.user .message-body {
  align-items: flex-end;
}

.message-bubble {
  padding: 14px 18px;
  border-radius: 18px;
  line-height: 1.6;
  font-size: 14px;
  max-width: 100%;
  word-wrap: break-word;
}

.message-bubble.assistant {
  background: #fff;
  color: #1e293b;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border-radius: 4px 18px 18px 18px;
}

.message-bubble.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 18px 4px 18px 18px;
}

.message-text {
  word-wrap: break-word;
}

.message-text .message-paragraph {
  margin: 0 0 8px 0;
  line-height: 1.7;
}

.message-text .message-paragraph:last-child {
  margin-bottom: 0;
}

.message-text .message-h1 {
  font-size: 18px;
  font-weight: 700;
  margin: 12px 0 8px 0;
  color: #1e293b;
}

.message-text .message-h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 10px 0 6px 0;
  color: #334155;
}

.message-text .message-h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 8px 0 4px 0;
  color: #475569;
}

.message-text .list-item {
  margin: 4px 0;
  padding-left: 20px;
  position: relative;
  list-style: none;
}

.message-text .list-item::before {
  content: '•';
  position: absolute;
  left: 4px;
  color: #667eea;
  font-weight: 700;
}

.message-text .list-item.ordered::before {
  content: var(--index) '.';
  color: #667eea;
  font-weight: 600;
}

.message-text .message-quote {
  margin: 8px 0;
  padding: 8px 12px;
  background: #f8fafc;
  border-left: 3px solid #667eea;
  color: #64748b;
  font-style: italic;
}

.message-text .message-divider {
  border: none;
  height: 1px;
  background: #e2e8f0;
  margin: 12px 0;
}

.message-text .message-link {
  color: #667eea;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.message-text .message-link:hover {
  color: #764ba2;
}

.message-text .code-block {
  display: block;
  margin: 8px 0;
  padding: 12px;
  background: #f1f5f9;
  border-radius: 8px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
}

.message-text .inline-code {
  padding: 2px 6px;
  background: #f1f5f9;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
  font-size: 12px;
  color: #e11d48;
}

.message-text strong {
  font-weight: 700;
  color: #0f172a;
}

.message-bubble.user .message-text strong {
  color: #fff;
}

.message-text em {
  font-style: italic;
  color: #475569;
}

.message-bubble.user .message-text em {
  color: rgba(255, 255, 255, 0.9);
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 16px;
  background: #667eea;
  margin-left: 2px;
  animation: blink-cursor 0.8s infinite;
  vertical-align: text-bottom;
}

.message-bubble.user .typing-cursor {
  background: #fff;
}

@keyframes blink-cursor {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px;
}

.message-wrapper.user .message-footer {
  flex-direction: row-reverse;
}

.message-time {
  font-size: 11px;
  color: #94a3b8;
}

.message-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-wrapper:hover .message-actions {
  opacity: 1;
}

.msg-action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.msg-action-btn:hover {
  background: #f1f5f9;
  color: #667eea;
}

.msg-action-btn svg {
  width: 14px;
  height: 14px;
}

.message-enter-active {
  transition: all 0.3s ease-out;
}

.message-leave-active {
  transition: all 0.2s ease-in;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.message-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.typing-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.typing-avatar svg {
  width: 18px;
  height: 18px;
}

.typing-dots {
  display: flex;
  gap: 5px;
  padding: 12px 18px;
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: #94a3b8;
  border-radius: 50%;
  animation: typing 1.4s ease-in-out infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.input-section {
  padding: 12px 20px 16px;
  background: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-field {
  flex: 1;
  min-height: 44px;
  max-height: 120px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  transition: all 0.2s;
  font-family: inherit;
  overflow-y: auto;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-field::placeholder {
  color: #94a3b8;
}

.input-field:disabled {
  background: #f8fafc;
  cursor: not-allowed;
}

.send-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.send-btn.stop-btn {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
}

.send-btn.stop-btn:hover {
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

.send-btn svg {
  width: 20px;
  height: 20px;
}

.input-hints {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 11px;
  color: #cbd5e1;
}

.hint-divider {
  color: #e2e8f0;
}

.disclaimer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 11px;
  color: #94a3b8;
}

.disclaimer svg {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.messages-area::-webkit-scrollbar {
  width: 6px;
}

.messages-area::-webkit-scrollbar-track {
  background: transparent;
}

.messages-area::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.messages-area::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

@media (max-width: 480px) {
  .chat-assistant {
    bottom: 16px;
    right: 16px;
  }

  .assistant-toggle {
    width: 56px;
    height: 56px;
    border-radius: 20px;
  }

  .chat-panel {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .quick-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
