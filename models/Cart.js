const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      quantity: Number,
      price: Number
    }
  ],
  updatedAt: Date
});

module.exports = mongoose.model("Cart", cartSchema);