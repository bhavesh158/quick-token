require "securerandom"

class TokenQueue < ApplicationRecord
  has_many :customers, dependent: :destroy

  STATUSES = %w[active completed].freeze

  validates :name, presence: true
  validates :unique_token, presence: true, uniqueness: true
  validates :status, inclusion: { in: STATUSES }

  before_validation :generate_unique_token, on: :create

  scope :active, -> { where(status: "active") }
  scope :completed, -> { where(status: "completed") }

  def active?
    status == "active"
  end

  def completed?
    status == "completed"
  end

  def waiting_customers
    customers.waiting.order(:created_at, :id)
  end

  def serving_customer
    customers.serving.order(:updated_at).first
  end

  def served_customers(limit_count = 5)
    customers.served.order(updated_at: :desc).limit(limit_count)
  end

  def served_count
    customers.served.count
  end

  def queue_status
    waiting = waiting_customers

    {
      now_serving: serialize_customer(serving_customer),
      waiting_customers: waiting.map { |customer| serialize_customer(customer) },
      served_customers: served_customers.map { |customer| serialize_customer(customer) },
      customer_count: customers.count,
      waiting_count: waiting.count,
      queue_status: status,
      completed_at: completed_at
    }
  end

  private

  def generate_unique_token
    return if unique_token.present?

    self.unique_token = loop do
      token = SecureRandom.alphanumeric(8).downcase
      break token unless self.class.exists?(unique_token: token)
    end
  end

  def serialize_customer(customer)
    return nil unless customer

    {
      id: customer.id,
      name: customer.name,
      status: customer.status,
      created_at: customer.created_at,
      updated_at: customer.updated_at
    }
  end
end
