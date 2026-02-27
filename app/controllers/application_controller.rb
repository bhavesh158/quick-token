class ApplicationController < ActionController::Base
  helper_method :admin_logged_in?

  private

  def admin_logged_in?
    session[:admin_logged_in] == true
  end

  def require_admin!
    return if admin_logged_in?

    session[:return_to] = request.fullpath if request.get?
    redirect_to admin_login_path, alert: "Admin login required."
  end

  def consume_return_to
    session.delete(:return_to)
  end

  def queue_memberships
    session[:queue_memberships] ||= {}
  end
end
