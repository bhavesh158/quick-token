class AdminSessionsController < ApplicationController
  ADMIN_PASSWORD_ENV_KEY = "QUICK_TOKEN_ADMIN_PASSWORD".freeze

  def new
    return unless admin_logged_in?

    redirect_to new_token_queue_path, notice: "You are already logged in."
  end

  def create
    if params[:password].to_s == admin_password
      session[:admin_logged_in] = true
      pending_queue_name = session.delete(:pending_queue_name).to_s.strip
      if pending_queue_name.present?
        queue = TokenQueue.create(name: pending_queue_name)
        if queue.persisted?
          redirect_to admin_token_queue_path(queue.unique_token), notice: "Queue created."
          return
        end
      end

      redirect_to(consume_return_to || new_token_queue_path, notice: "Logged in as admin.")
    else
      flash.now[:alert] = "Invalid admin password."
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    session.delete(:admin_logged_in)
    session.delete(:return_to)
    session.delete(:pending_queue_name)
    redirect_to admin_login_path, notice: "Logged out."
  end

  private

  def admin_password
    ENV.fetch(ADMIN_PASSWORD_ENV_KEY, "")
  end
end
