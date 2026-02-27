class CreateTokenQueues < ActiveRecord::Migration[7.0]
  def change
    create_table :token_queues do |t|
      t.string :name
      t.string :unique_token

      t.timestamps
    end
  end
end