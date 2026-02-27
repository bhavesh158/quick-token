import { createQueueSubscription } from "channels/queue_channel"

let queueSubscription
let lastQueueStatus = null
let updateFlashTimeout = null

function formatTimeAgo(isoTime) {
  if (!isoTime) return "just now"
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

function formatTime(isoTime) {
  if (!isoTime) return ""
  const date = new Date(isoTime)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getColorForName(name) {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
  ]
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  return colors[index]
}

function flashElement(elementId) {
  const element = document.getElementById(elementId)
  if (!element) return
  
  element.style.transition = "background-color 0.3s ease"
  const originalBg = element.style.backgroundColor
  element.style.backgroundColor = "rgb(255, 255, 200)"
  
  setTimeout(() => {
    element.style.backgroundColor = originalBg
  }, 500)
}

function renderAdmin(queueStatus) {
  const nowServing = queueStatus.now_serving
  const waitingCustomers = queueStatus.waiting_customers || []
  const servedCustomers = queueStatus.served_customers || []
  
  const hasChanges = JSON.stringify(lastQueueStatus) !== JSON.stringify(queueStatus)
  
  if (hasChanges) {
    // Flash effect on update
    const connectionStatus = document.getElementById("connection-status")
    if (connectionStatus) {
      connectionStatus.classList.add("bg-blue-50", "text-blue-700")
      connectionStatus.classList.remove("bg-emerald-50", "text-emerald-700")
      
      clearTimeout(updateFlashTimeout)
      updateFlashTimeout = setTimeout(() => {
        connectionStatus.classList.remove("bg-blue-50", "text-blue-700")
        connectionStatus.classList.add("bg-emerald-50", "text-emerald-700")
      }, 1000)
    }
  }

  const nowServingTicket = document.getElementById("now-serving-ticket")
  const nowServingName = document.getElementById("now-serving-name")
  const nowServingTime = document.getElementById("now-serving-time")
  const waitingCountCta = document.getElementById("waiting-count-cta")
  const waitingCountHeader = document.getElementById("waiting-count-header")
  const statTotal = document.getElementById("stat-total")
  const statServed = document.getElementById("stat-served")
  const statAvgWait = document.getElementById("stat-avg-wait")
  const statWaiting = document.getElementById("stat-waiting")
  const servedCountHeader = document.getElementById("served-count-header")

  if (nowServingTicket) {
    const oldValue = nowServingTicket.textContent
    nowServingTicket.textContent = nowServing ? nowServing.id : "--"
    if (oldValue !== nowServingTicket.textContent && nowServing) {
      nowServingTicket.parentElement.classList.add("animate-pulse")
      setTimeout(() => nowServingTicket.parentElement.classList.remove("animate-pulse"), 1000)
    }
  }
  if (nowServingName) nowServingName.textContent = nowServing ? nowServing.name : "No one is being served"
  if (nowServingTime) nowServingTime.textContent = nowServing ? `Called at ${formatTime(nowServing.updated_at)}` : ""
  if (waitingCountCta) waitingCountCta.textContent = `${queueStatus.waiting_count} people waiting in queue`
  if (waitingCountHeader) waitingCountHeader.textContent = `${queueStatus.waiting_count} customers`
  if (statTotal) statTotal.textContent = queueStatus.customer_count
  if (statServed) statServed.textContent = queueStatus.total_served_today
  if (statAvgWait) statAvgWait.innerHTML = `${queueStatus.avg_wait_time_minutes || '--'}<span class="text-sm font-medium text-slate-500">m</span>`
  if (statWaiting) statWaiting.textContent = queueStatus.waiting_count
  if (servedCountHeader) servedCountHeader.textContent = `${servedCustomers.length} today`

  const waitingList = document.getElementById("waiting-list-container")
  if (waitingList) {
    const oldHtml = waitingList.innerHTML
    const newHtml = waitingCustomers.length
      ? waitingCustomers
          .map((customer, index) => {
            const bgColor = getColorForName(customer.name)
            return `
            <div class="group flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors lg:px-6" id="waiting-customer-${customer.id}">
              <div class="flex items-center gap-3 lg:gap-4">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg ${bgColor} text-white text-sm font-bold">${getInitials(customer.name)}</div>
                <div>
                  <p class="font-semibold text-slate-900">${customer.name}</p>
                  <p class="text-xs text-slate-500">Joined ${formatTimeAgo(customer.created_at)}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="hidden rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 sm:inline-flex">Pos. ${index + 1}</span>
                <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onclick="confirmSkip(${customer.id}, '${customer.name.replace(/'/g, "\\'")}')" class="rounded p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600" title="Skip">
                    <span class="material-symbols-outlined text-sm">skip_next</span>
                  </button>
                  <button type="button" onclick="confirmRemove(${customer.id}, '${customer.name.replace(/'/g, "\\'")}')" class="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Remove">
                    <span class="material-symbols-outlined text-sm">person_remove</span>
                  </button>
                </div>
              </div>
            </div>`
          })
          .join("")
      : '<div class="p-6 text-center text-slate-500">No customers waiting.</div>'
    
    if (oldHtml !== newHtml) {
      waitingList.innerHTML = newHtml
    }
  }

  const servedList = document.getElementById("served-list-container")
  if (servedList) {
    const oldHtml = servedList.innerHTML
    const newHtml = servedCustomers.length
      ? servedCustomers
          .map(
            (customer) => {
              const bgColor = getColorForName(customer.name)
              return `
              <div class="flex items-center justify-between px-4 py-3 opacity-70 transition-opacity hover:opacity-100 lg:px-6" id="served-customer-${customer.id}">
                <div class="flex items-center gap-3 lg:gap-4">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-sm font-bold line-through">${getInitials(customer.name)}</div>
                  <div>
                    <p class="font-semibold text-slate-900 line-through decoration-slate-400">${customer.name}</p>
                    <p class="text-xs text-slate-500">Served ${formatTimeAgo(customer.updated_at)}</p>
                  </div>
                </div>
                <span class="text-xs font-medium text-emerald-600">${formatTime(customer.updated_at)}</span>
              </div>`
            }
          )
          .join("")
      : '<div class="p-6 text-center text-slate-500">No one has been served yet.</div>'
    
    if (oldHtml !== newHtml) {
      servedList.innerHTML = newHtml
    }
  }
  
  lastQueueStatus = queueStatus
}

function renderCustomer(queueStatus, currentCustomerId) {
  const waitingCustomers = queueStatus.waiting_customers || []
  const currentCustomer = waitingCustomers.find((customer) => String(customer.id) === String(currentCustomerId))
  const position = currentCustomer ? waitingCustomers.findIndex((customer) => customer.id === currentCustomer.id) + 1 : null

  const customerPosition = document.getElementById("customer-position")
  const peopleAhead = document.getElementById("people-ahead")
  const nowServing = document.getElementById("now-serving")
  const totalWaiting = document.getElementById("total-waiting")
  const estimatedWait = document.getElementById("estimated-wait")

  if (customerPosition) customerPosition.textContent = position || "-"
  if (peopleAhead) peopleAhead.textContent = position ? `${position - 1} people ahead` : "Join to get your place"
  if (totalWaiting) totalWaiting.textContent = `${queueStatus.waiting_count} waiting`
  if (estimatedWait) estimatedWait.textContent = position ? `${position * 5} mins` : "N/A"
  if (nowServing) {
    nowServing.textContent = queueStatus.now_serving
      ? `${queueStatus.now_serving.name} (Ticket #${queueStatus.now_serving.id})`
      : "No one yet"
  }

  const queueList = document.getElementById("queue-list")
  if (queueList) {
    queueList.innerHTML = waitingCustomers.length
      ? waitingCustomers
          .slice(0, 6)
          .map((customer, index) => {
            const isCurrent = String(customer.id) === String(currentCustomerId)
            return `
              <div class="p-4 flex items-center gap-4 ${isCurrent ? "bg-primary/5 border-l-4 border-primary" : ""}">
                <div class="size-10 rounded-full ${isCurrent ? "bg-primary text-white" : "bg-primary/20 text-primary"} flex items-center justify-center font-bold text-sm">${index + 1}</div>
                <div class="flex-1">
                  <div class="text-sm font-semibold ${isCurrent ? "text-primary" : "text-slate-900 dark:text-white"}">${isCurrent ? "You" : customer.name}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Estimated call: ${(index + 1) * 5}m</div>
                </div>
                <div class="text-xs font-medium text-slate-400 italic">${isCurrent ? "Current" : "Waiting"}</div>
              </div>`
          })
          .join("")
      : '<div class="p-4 text-center text-slate-500">No one is currently waiting.</div>'
  }

  const leaveButton = document.getElementById("leave-queue-button")
  if (leaveButton) leaveButton.disabled = !currentCustomerId
}

function queueViewInit() {
  const root = document.querySelector("[data-queue-view]")
  if (!root) return

  const queueToken = root.dataset.queueToken
  const queueView = root.dataset.queueView
  const currentCustomerId = root.dataset.customerId

  if (!queueToken) return

  const statusJson = root.dataset.queueStatus
  if (statusJson) {
    const initialStatus = JSON.parse(statusJson)
    if (queueView === "admin") {
      renderAdmin(initialStatus)
      setupKeyboardShortcuts()
    }
    if (queueView === "customer") renderCustomer(initialStatus, currentCustomerId)
  }

  queueSubscription?.unsubscribe()
  queueSubscription = createQueueSubscription(queueToken, (payload) => {
    if (!payload?.queue_status) return

    if (queueView === "admin") renderAdmin(payload.queue_status)
    if (queueView === "customer") renderCustomer(payload.queue_status, currentCustomerId)
  })
}

function setupKeyboardShortcuts() {
  // Remove existing listener if any
  document.removeEventListener('keydown', handleKeyboardShortcut)
  document.addEventListener('keydown', handleKeyboardShortcut)
}

function handleKeyboardShortcut(event) {
  // Don't trigger if typing in an input
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }
  
  // Space bar to serve next
  if (event.code === 'Space' && !event.repeat) {
    event.preventDefault()
    const serveButton = document.querySelector('button[type="submit"]')
    if (serveButton && !serveButton.disabled) {
      serveButton.click()
    }
  }
}

function cleanupSubscription() {
  document.removeEventListener('keydown', handleKeyboardShortcut)
  queueSubscription?.unsubscribe()
  queueSubscription = null
}

document.addEventListener("turbo:load", queueViewInit)
document.addEventListener("turbo:before-cache", cleanupSubscription)
