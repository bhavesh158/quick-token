class QueueChannel < ApplicationCable::Channel
  def subscribed
    token = params[:token].to_s
    reject and return if token.blank?

    stream_from "queue_#{token}"
  end
end
