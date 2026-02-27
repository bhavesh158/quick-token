module ApplicationHelper
  def quicktoken_brand_path
    admin_logged_in? ? admin_token_queues_path : root_path
  end
end
