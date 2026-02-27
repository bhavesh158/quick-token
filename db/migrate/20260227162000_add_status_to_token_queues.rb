class AddStatusToTokenQueues < ActiveRecord::Migration[7.1]
  def change
    add_column :token_queues, :status, :string, null: false, default: "active"
    add_column :token_queues, :completed_at, :datetime

    add_index :token_queues, :status
  end
end
