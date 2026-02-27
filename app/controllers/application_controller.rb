class ApplicationController < ActionController::Base
  helper_method :admin_logged_in?

  private

  def admin_logged_in?
    session[:admin_logged_in] == true
  end

  def require_admin!
    return if admin_logged_in?

    redirect_to admin_login_path, alert: "Admin login required."
  end
end
