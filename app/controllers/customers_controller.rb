class CustomersController < ApplicationController
  before_action :set_token_queue
  before_action :require_admin!, only: %i[next]

  def create
    token = @token_queue.unique_token
    existing_customer_id = queue_memberships[token]
    existing_customer = @token_queue.customers.find_by(id: existing_customer_id) if existing_customer_id.present?

    if existing_customer&.status.in?(%w[waiting serving])
      redirect_to token_queue_path(token, customer_id: existing_customer.id), alert: "You have already joined this queue."
      return
    end

    queue_memberships.delete(token)

    customer = @token_queue.customers.new(customer_params.merge(status: "waiting"))

    if customer.save
      queue_memberships[token] = customer.id
      broadcast_queue_update
      redirect_to token_queue_path(@token_queue.unique_token, customer_id: customer.id), notice: "You joined the queue."
    else
      redirect_to token_queue_path(@token_queue.unique_token), alert: customer.errors.full_messages.to_sentence
    end
  end

  def destroy
    customer = @token_queue.customers.find_by(id: params[:id])

    unless customer
      redirect_to token_queue_path(@token_queue.unique_token), alert: "Customer not found."
      return
    end

    if customer.status == "served"
      redirect_to token_queue_path(@token_queue.unique_token), alert: "Served entries cannot be removed."
      return
    end

    queue_memberships.delete(@token_queue.unique_token) if queue_memberships[@token_queue.unique_token].to_s == customer.id.to_s
    customer.destroy
    broadcast_queue_update

    redirect_to token_queue_path(@token_queue.unique_token), notice: "You left the queue."
  end

  def next
    ActiveRecord::Base.transaction do
      current_customer = @token_queue.serving_customer
      current_customer&.update!(status: "served")

      next_customer = @token_queue.waiting_customers.first
      next_customer&.update!(status: "serving")
    end

    broadcast_queue_update

    redirect_to admin_token_queue_path(@token_queue.unique_token), notice: "Queue advanced."
  end

  private

  def set_token_queue
    @token_queue = TokenQueue.find_by(unique_token: params[:token_queue_token])
    return if @token_queue

    redirect_to root_path, alert: "Invalid queue token."
  end

  def customer_params
    params.require(:customer).permit(:name)
  end

  def broadcast_queue_update
    ActionCable.server.broadcast(
      "queue_#{@token_queue.unique_token}",
      {
        action: "queue_updated",
        queue_status: @token_queue.queue_status
      }
    )
  end
end
