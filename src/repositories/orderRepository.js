const updateStatusCompleted = async (order_id) => {
  const query = {
    _id: order_id,
    order_status: "pending",
    "order_payment.payment_status": "success",
  };
  const updateOrder = await orderModel.findOneAndUpdate(
    query,
    {
      $set: {
        order_status: "completed",
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
const updateStatusCancelled = async (order_id) => {
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
