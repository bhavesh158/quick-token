class CreateCustomers < ActiveRecord::Migration[7.0]
  def change
    create_table :customers do |t|
      t.references :token_queue, null: false, foreign_key: true
      t.string :name
      t.string :status

      t.timestamps
    end
  end
end