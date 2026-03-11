const User = require('../models/User');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    localField: 'email',
                    foreignField: 'email',
                    as: 'orderHistory'
                }
            },
            {
                $addFields: {
                    orders: { $size: "$orderHistory" },
                    spent: {
                        $reduce: {
                            input: "$orderHistory",
                            initialValue: 0,
                            in: {
                                $add: [
                                    "$$value",
                                    { $cond: [{ $in: ["$$this.orderStatus", ["Cancelled", "Returned"]] }, 0, "$$this.totalAmount"] }
                                ]
                            }
                        }
                    },
                    status: {
                        $cond: [{ $eq: ["$isBlocked", true] }, 'blocked', 'active']
                    }
                }
            },
            {
                $project: {
                    orderHistory: 0 // Remove the large array to save bandwidth
                }
            },
            { $sort: { createdAt: -1 } }
        ]);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addUser = async (req, res) => {
    const user = new User(req.body);
    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Address Management Extensions
exports.addAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const newAddress = { ...req.body, isDefault: user.addresses.length === 0 };
        user.addresses.push(newAddress);
        await user.save();
        res.status(201).json(user.addresses);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const addrIndex = user.addresses.findIndex(a => a._id.toString() === req.params.addressId);
        if (addrIndex === -1) return res.status(404).json({ message: "Address not found" });

        user.addresses[addrIndex] = { ...user.addresses[addrIndex].toObject(), ...req.body };
        await user.save();
        res.json(user.addresses);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
        await user.save();
        res.json(user.addresses);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.addresses.forEach(addr => {
            addr.isDefault = (addr._id.toString() === req.params.addressId);
        });

        await user.save();
        res.json(user.addresses);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const { image } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { image },
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
