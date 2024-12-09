const orderModel = require("../models/orderModel");
const { NotFoundError, BadRequestError } = require("../core/errorResponse");
const userModel = require("../models/userModel");
const { sendNotification } = require("../utils/notification");
const { toObjectId } = require("../utils/index");
const listOrderPendingOfUser = async (user) => {
  const query = {
    order_userId: user._id,
    order_status: "pending",
    "order_payment.payment_status": "Success",
  };
  const findOrder = await orderModel.find(query).sort({ createdAt: -1 });
  console.log(findOrder);

  if (!findOrder) {
    throw new NotFoundError("Order not found");
  }
  return findOrder;
};
const listOrderCompletedOfUser = async (user) => {
  const query = {
    order_userId: user._id,
    order_status: "completed",
  };
  const findOrder = await orderModel.find(query).sort({ createdAt: -1 });
  if (!findOrder) {
    throw new NotFoundError("Order not found");
  }
  return findOrder;
};
const listOrderCancelledOfUser = async (user) => {
  const query = {
    order_userId: user._id,
    order_status: "cancelled",
  };
  const findOrder = await orderModel.find(query).sort({ createdAt: -1 });
  if (!findOrder) {
    throw new NotFoundError("Order not found");
  }
  return findOrder;
};
const listOrderSuccessOfUser = async (user) => {
  const query = {
    order_userId: user._id,
    order_status: "success",
  };
  const findOrder = await orderModel.find(query).sort({ createdAt: -1 });
  if (!findOrder) {
    throw new NotFoundError("Order not found");
  }
  return findOrder;
};
const updateStatusCompleted = async (order_id) => {
  const query = {
    _id: order_id,
    order_status: "pending",
    "order_payment.payment_status": "Success",
  };

  const updateOrder = await orderModel.findOneAndUpdate(
    query,
    { $set: { order_status: "completed" } },
    { new: true, lean: true }
  );
  console.log(updateOrder);

  if (!updateOrder) {
    throw new BadRequestError(
      "Update order failed: either payment was not successful or order is no longer pending."
    );
  }

  // Gửi thông báo đẩy
  const user = await userModel.findById(updateOrder.order_userId); // Tìm người dùng liên quan
  console.log("ầdfadfasfdfas" + user.deviceToken);

  if (user && user.deviceToken) {
    const title = "Đơn hàng đã hoàn thành";
    const body = `Đơn hàng ${
      updateOrder.order_product?.map((product) => product.product_name) || []
    } của bạn đã hoàn thành.`;
    const data = {
      order_id: updateOrder._id,
      status: "completed",
    };

    await sendNotification(user.deviceToken, title, body, data); // Gửi thông báo
  }

  return updateOrder;
};

const updateStatusCancelled = async (order_id) => {
  const query = {
    _id: order_id,
    order_status: "pending",
    "order_payment.payment_status": "Success",
  };
  const updateOrder = await orderModel.findOneAndUpdate(
    query,
    {
      $set: {
        order_status: "cancelled",
      },
    },
    {
      new: true,
      lean: true,
    }
  );
  // Gửi thông báo đẩy
  const user = await userModel.findById(updateOrder.order_userId); // Tìm người dùng liên quan
  console.log("ầdfadfasfdfas: " + user.deviceToken);

  if (user && user.deviceToken) {
    const title = "Đơn hàng đã bị huỷ";
    const body = `Đơn hàng ${
      updateOrder.order_product?.map((product) => product.product_name) || []
    } của bạn đã bị huỷ.`;
    const data = {
      order_id: updateOrder._id,
      status: "cancelled",
    };

    await sendNotification(user.deviceToken, title, body, data); // Gửi thông báo
  }

  return updateOrder;
};
const listOrderPending = async ({ limit, page, shop }) => {
  const skip = (page - 1) * limit;
  const query = {
    order_status: "pending",
    order_shopId: shop._id,
  };
  const findOrder = await orderModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!findOrder) {
    throw new NotFoundError("Order not found");
  }
  return findOrder;
};
const listOrderSuccess = async ({ limit, page, shop }) => {
  const skip = (page - 1) * limit;
  const query = {
    order_status: "success",
    order_shopId: shop._id,
  };
  const findOrder = await orderModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!findOrder) {
    throw new NotFoundError("Order not found");
  }
  return findOrder;
};
const listOrderCancelled = async ({ limit, page, shop }) => {
  const skip = (page - 1) * limit;
  const query = {
    order_status: "cancelled",
    order_shopId: shop._id,
  };
  const findOrder = await orderModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!findOrder) {
    throw new NotFoundError("Order not found");
  }
  return findOrder;
};
const listOrderCompleted = async ({ limit, page, shop }) => {
  const skip = (page - 1) * limit;
  const query = {
    order_status: "completed",
    order_shopId: shop._id,
  };
  const findOrder = await orderModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!findOrder) {
    throw new NotFoundError("Order not found");
  }
  return findOrder;
};
const getOrderDetail = async (user, orderId) => {
  const findOrder = await orderModel.findOne({
    _id: orderId,
    order_userId: user._id,
  });
  if (!findOrder) {
    throw new NotFoundError("Order not found");
  }
  return findOrder;
};
const listBestSellingProductsInShop = async (shopId, limit) => {
  const bestSellingProducts = await orderModel.aggregate([
    {
      $match: {
        order_shopId: toObjectId(shopId),
        order_status: "completed",
        "order_payment.payment_status": "Success",
      },
    },

    {
      $project: {
        order_product: 1,
      },
    },

    {
      $unwind: {
        path: "$order_product",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $group: {
        _id: "$order_product.product_id",
        totalSold: { $sum: "$order_product.quantity" },
        productName: { $first: "$order_product.product_name" },
        productThumb: { $first: "$order_product.product_thumb" },
      },
    },

    { $sort: { totalSold: -1 } },

    { $limit: limit },
  ]);

  return bestSellingProducts;
};

const getTotalRevenueInShop = async (shopId) => {
  const totalRevenue = await orderModel.aggregate([
    {
      $match: {
        order_shopId: toObjectId(shopId),
        order_status: "completed",
        "order_payment.payment_status": "Success",
      },
    },
    {
      $project: {
        order_product: 1,
      },
    },
    {
      $unwind: {
        path: "$order_product",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$order_product.totalPrice" },
      },
    },
  ]);

  return totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0;
};

module.exports = {
  listOrderPendingOfUser,
  listOrderCompletedOfUser,
  listOrderCancelledOfUser,
  listOrderSuccessOfUser,
  updateStatusCompleted,
  updateStatusCancelled,
  listOrderPending,
  listOrderSuccess,
  listOrderCancelled,
  listOrderCompleted,
  getOrderDetail,
  listBestSellingProductsInShop,
  getTotalRevenueInShop,
};
