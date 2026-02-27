import consumer from "channels/consumer"

export function createQueueSubscription(token, onReceive) {
  return consumer.subscriptions.create(
    { channel: "QueueChannel", token },
    {
      received(data) {
        onReceive?.(data)
      }
    }
  )
}
