const Cart = require("../models/Cart");

exports.mergeCart = async (req, res) => {
  try {
    const { localCart } = req.body;

    // Clamp each quantity to a sane upper bound to prevent corrupted data
    const sanitizedCart = (localCart || []).map(item => ({
      productId: item.productId,
      quantity: Math.min(Math.max(1, item.quantity), 999)
    }));

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user.id,
        items: sanitizedCart,
        updatedAt: new Date()
      });
    } else {
      // ✅ REPLACE – don't accumulate. Local cart is the source of truth.
      cart.items = sanitizedCart;
      cart.updatedAt = new Date();
      await cart.save();
    }

    res.send(cart);
  } catch (err) {
    console.error("MERGE CART ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.json({ items: [] });
    }

    res.json(cart);
  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { items: [], updatedAt: new Date() }
    );
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    console.error("CLEAR CART ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
