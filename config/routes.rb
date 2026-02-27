Rails.application.routes.draw do
  root "token_queues#new"

  get "admin/login", to: "admin_sessions#new", as: :admin_login
  post "admin/login", to: "admin_sessions#create"
  delete "admin/logout", to: "admin_sessions#destroy", as: :admin_logout

  get "queues/new", to: "token_queues#new", as: :new_token_queue
  post "queues", to: "token_queues#create", as: :create_token_queues
  get "queues/:id", to: "token_queues#show", as: :token_queue

  get "admin/:token", to: "token_queues#admin", as: :admin_token_queue
  get "admin/:token/report", to: "token_queues#report", as: :admin_token_queue_report

  post "queues/:token_queue_token/customers", to: "customers#create", as: :join_queue
  delete "queues/:token_queue_token/customers/:id", to: "customers#destroy", as: :leave_queue
  post "admin/:token_queue_token/next", to: "customers#next", as: :next_customer

  get "privacy", to: "static_pages#privacy", as: :privacy
  get "terms", to: "static_pages#terms", as: :terms
  get "help", to: "static_pages#help", as: :help
  get "contact", to: "static_pages#contact", as: :contact
end
