require "csv"

class TokenQueuesController < ApplicationController
  before_action :require_admin!, only: %i[index admin report]
  before_action :set_token_queue_by_token, only: %i[show]
  before_action :set_token_queue_by_admin_token, only: %i[admin report]

  def new
    if admin_logged_in?
      redirect_to admin_token_queues_path
      return
    end

    @token_queue = TokenQueue.new
  end

  def index
    @status_filter = params[:status] == "completed" ? "completed" : "active"
    base_scope = @status_filter == "completed" ? TokenQueue.completed : TokenQueue.active
    @token_queues = base_scope.order(created_at: :desc).includes(:customers)
    @active_count = TokenQueue.active.count
    @completed_count = TokenQueue.completed.count
    @new_token_queue = TokenQueue.new
  end

  def create
    from_dashboard = params[:from_dashboard] == "1"

    unless admin_logged_in?
      session[:pending_queue_name] = params.dig(:token_queue, :name).to_s
      redirect_to admin_login_path, alert: "Admin login required to create a queue."
      return
    end

    @token_queue = TokenQueue.new(token_queue_params)

    if @token_queue.save
      if from_dashboard
        redirect_to admin_token_queues_path, notice: "Queue created."
      else
        redirect_to admin_token_queue_path(@token_queue.unique_token), notice: "Queue created."
      end
    else
      if from_dashboard
        @token_queues = TokenQueue.order(created_at: :desc).includes(:customers)
        @new_token_queue = @token_queue
        render :index, status: :unprocessable_entity
      else
        render :new, status: :unprocessable_entity
      end
    end
  end

  def show
    session_customer_id = queue_memberships[@token_queue.unique_token]
    @current_customer = @token_queue.customers.find_by(id: session_customer_id || params[:customer_id])

    if @current_customer&.status.in?(%w[waiting serving])
      queue_memberships[@token_queue.unique_token] = @current_customer.id
    else
      queue_memberships.delete(@token_queue.unique_token)
      @current_customer = nil
    end

    @queue_status = @token_queue.queue_status
    @join_customer = Customer.new
  end

  def admin
    @queue_status = @token_queue.queue_status
    @public_queue_url = token_queue_url(@token_queue.unique_token)
  end

  def report
    rows = @token_queue.customers.order(:created_at).map do |customer|
      [customer.id, customer.name, customer.status, customer.created_at, customer.updated_at]
    end

    csv = CSV.generate(headers: true) do |table|
      table << ["Ticket", "Name", "Status", "Joined At", "Updated At"]
      rows.each { |row| table << row }
    end

    send_data csv,
              filename: "#{@token_queue.name.parameterize}-queue-report.csv",
              type: "text/csv"
  end

  private

  def set_token_queue_by_token
    @token_queue = TokenQueue.find_by(unique_token: params[:id])
    return if @token_queue

    redirect_to root_path, alert: "Invalid queue token."
  end

  def set_token_queue_by_admin_token
    lookup_token = params[:id] || params[:token]
    @token_queue = TokenQueue.find_by(unique_token: lookup_token)
    return if @token_queue

    redirect_to root_path, alert: "Invalid queue token."
  end

  def token_queue_params
    params.require(:token_queue).permit(:name)
  end
end
