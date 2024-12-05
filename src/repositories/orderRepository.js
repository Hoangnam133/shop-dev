const orderModel = require("../models/orderModel");
const { NotFoundError, BadRequestError } = require("../core/errorResponse");
const userModel = require("../models/userModel");
const { sendNotification } = require("../utils/notification");
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
    "order_payment.payment_status": "success",
  };

  const updateOrder = await orderModel.findOneAndUpdate(
    query,
    { $set: { order_status: "completed" } },
    { new: true, lean: true }
  );

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
    const body = `Đơn hàng ${updateOrder._id} của bạn đã hoàn thành.`;
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
    "order_payment.payment_status": "success",
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
  if (!updateOrder) {
    throw new BadRequestError(
      "Update order failed: either payment was not successful or order is no longer pending."
    );
  }
  return updateOrder;
};
const listOrderPending = async ({ limit, page }) => {
  const skip = (page - 1) * limit;
  const query = {
    order_status: "pending",
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
const listOrderSuccess = async ({ limit, page }) => {
  const skip = (page - 1) * limit;
  const query = {
    order_status: "success",
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
const listOrderCancelled = async ({ limit, page }) => {
  const skip = (page - 1) * limit;
  const query = {
    order_status: "cancelled",
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
const listOrderCompleted = async ({ limit, page }) => {
  const skip = (page - 1) * limit;
  const query = {
    order_status: "completed",
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
};
