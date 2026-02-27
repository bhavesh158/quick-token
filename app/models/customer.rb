class Customer < ApplicationRecord
  STATUSES = %w[waiting serving served].freeze

  belongs_to :token_queue

  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :waiting, -> { where(status: "waiting") }
  scope :serving, -> { where(status: "serving") }
  scope :served, -> { where(status: "served") }
end
