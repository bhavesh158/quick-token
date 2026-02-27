class TokenQueuesController < ApplicationController
  before_action :require_admin!, only: %i[admin report]
  before_action :set_token_queue_by_token, only: %i[show]
  before_action :set_token_queue_by_admin_token, only: %i[admin report]

  def new
    @token_queue = TokenQueue.new
  end

  def create
    @token_queue = TokenQueue.new(token_queue_params)

    if @token_queue.save
      redirect_to admin_token_queue_path(@token_queue.unique_token), notice: "Queue created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def show
    @current_customer = @token_queue.customers.find_by(id: params[:customer_id])
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
    @token_queue = TokenQueue.find_by(unique_token: params[:token])
    return if @token_queue

    redirect_to root_path, alert: "Invalid queue token."
  end

  def token_queue_params
    params.require(:token_queue).permit(:name)
  end
end
