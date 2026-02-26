const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const ctrl = require("../controllers/cartController");

router.post("/merge", auth, ctrl.mergeCart);
router.get("/", auth, ctrl.getCart);
router.delete("/", auth, ctrl.clearCart);

module.exports = router;