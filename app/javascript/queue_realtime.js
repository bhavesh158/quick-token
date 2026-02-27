import { createQueueSubscription } from "channels/queue_channel"

let queueSubscription

function formatTimeAgo(isoTime) {
  if (!isoTime) return "just now"
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

function renderAdmin(queueStatus) {
  const nowServing = queueStatus.now_serving
  const waitingCustomers = queueStatus.waiting_customers || []
  const servedCustomers = queueStatus.served_customers || []

  const nowServingTicket = document.getElementById("now-serving-ticket")
  const nowServingName = document.getElementById("now-serving-name")
  const waitingCountCta = document.getElementById("waiting-count-cta")
  const waitingCountHeader = document.getElementById("waiting-count-header")
  const todayVolume = document.getElementById("today-volume")

  if (nowServingTicket) nowServingTicket.textContent = nowServing ? nowServing.id : "--"
  if (nowServingName) nowServingName.textContent = nowServing ? nowServing.name : "No one is being served"
  if (waitingCountCta) waitingCountCta.textContent = `${queueStatus.waiting_count} people waiting in queue`
  if (waitingCountHeader) waitingCountHeader.textContent = `${queueStatus.waiting_count} customers`
  if (todayVolume) todayVolume.textContent = `${queueStatus.customer_count} customers`

  const waitingList = document.getElementById("waiting-list-container")
  if (waitingList) {
    waitingList.innerHTML = waitingCustomers.length
      ? waitingCustomers
          .map((customer, index) => `
            <div class="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div class="flex items-center gap-4">
                <div class="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">${customer.id}</div>
                <div>
                  <p class="font-semibold text-slate-900 dark:text-slate-100">${customer.name}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Joined ${formatTimeAgo(customer.created_at)}</p>
                </div>
              </div>
              <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Pos. ${index + 1}</span>
            </div>`)
          .join("")
      : '<div class="p-4 text-center text-slate-500">No customers waiting.</div>'
  }

  const servedList = document.getElementById("served-list-container")
  if (servedList) {
    servedList.innerHTML = servedCustomers.length
      ? servedCustomers
          .map(
            (customer) => `
              <div class="flex items-center justify-between px-6 py-4 opacity-70">
                <div class="flex items-center gap-4">
                  <div class="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-emerald-600">${customer.id}</div>
                  <div>
                    <p class="font-semibold text-slate-900 dark:text-slate-100 line-through decoration-slate-400">${customer.name}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Served ${formatTimeAgo(customer.updated_at)}</p>
                  </div>
                </div>
              </div>`
          )
          .join("")
      : '<div class="p-4 text-center text-slate-500">No one has been served yet.</div>'
  }
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
    if (queueView === "admin") renderAdmin(initialStatus)
    if (queueView === "customer") renderCustomer(initialStatus, currentCustomerId)
  }

  queueSubscription?.unsubscribe()
  queueSubscription = createQueueSubscription(queueToken, (payload) => {
    if (!payload?.queue_status) return

    if (queueView === "admin") renderAdmin(payload.queue_status)
    if (queueView === "customer") renderCustomer(payload.queue_status, currentCustomerId)
  })
}

function cleanupSubscription() {
  queueSubscription?.unsubscribe()
  queueSubscription = null
}

document.addEventListener("turbo:load", queueViewInit)
document.addEventListener("turbo:before-cache", cleanupSubscription)
