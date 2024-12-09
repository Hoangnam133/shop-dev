const orderModel = require("../models/orderModel");
const categoryModel = require("../models/categoryModel");

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


const getStatistics = async (timeRange) => {
  const now = new Date(); // Ngày hiện tại

  // Kiểm tra nếu `timeRange` không hợp lệ
  if (!timeRanges[timeRange]) {
    throw new Error(`Invalid time range: ${timeRange}. Please choose one of ${Object.keys(timeRanges).join(', ')}`);
  }

  const startDate = timeRanges[timeRange];

  try {
    // Thực hiện aggregation
    const result = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }, // Lọc đơn hàng từ `startDate`
          order_status: "completed", // Chỉ lấy đơn hàng đã hoàn thành
        },
      },
      {
        $unwind: "$order_product", // Tách từng sản phẩm trong đơn hàng
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: "$order_product.quantity" }, // Tổng số sản phẩm bán ra
          totalRevenue: { $sum: { $multiply: ["$order_product.quantity", "$order_product.totalPrice"] } }, // Tổng doanh thu
          totalUsers: { $addToSet: "$order_userId" }, // Số lượt user mua hàng
          totalOrders: { $sum: 1 }, // Tổng số đơn hàng
        },
      },
      {
        $project: {
          totalProducts: 1,
          totalRevenue: 1,
          totalUsers: { $size: "$totalUsers" }, // Đếm số user unique
          totalOrders: 1,
        },
      },
    ]);

    // Trả về kết quả
    return result[0] || { totalProducts: 0, totalRevenue: 0, totalUsers: 0, totalOrders: 0 };
  } catch (error) {
    console.error("Error in getStatistics:", error.message);
    throw error;
  }
};

const getBestSellingProducts = async (timeRange) => {
  const now = new Date(); // Current date

  // Validate timeRange
  if (!timeRanges[timeRange]) {
    throw new Error(`Invalid time range: ${timeRange}. Please choose one of ${Object.keys(timeRanges).join(', ')}`);
  }

  const startDate = timeRanges[timeRange];

  try {
    const result = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(startDate) }, // Ensure 'createdAt' is compared with a Date object
          order_status: "completed", // Only completed orders
        },
      },
      {
        $unwind: "$order_product", // Flatten the 'order_product' array
      },
      {
        $group: {
          _id: "$order_product.product_id", // Group by product_id
          totalQuantity: { $sum: "$order_product.quantity" }, // Sum of quantities
          totalRevenue: { $sum: "$order_product.totalPrice" }, // Sum of total prices
        },
      },
      {
        $sort: { totalQuantity: -1 }, // Sort by totalQuantity in descending order
      },
      {
        $limit: 10, // Limit to top 10 products
      },
      {
        $lookup: {
          from: "Products", // Join with the Products collection
          localField: "_id", // Match by _id from the group stage
          foreignField: "_id", // Match with the _id field in Products
          as: "productDetails", // Store details in 'productDetails'
        },
      },
      {
        $unwind: "$productDetails", // Flatten the 'productDetails' array
      },
      {
        $project: {
          product_id: "$_id", // Include product_id from the group stage
          product_name: "$productDetails.product_name", // Product name from the lookup
          product_thumb: "$productDetails.product_thumb", // Product thumbnail from the lookup
          totalQuantity: 1, // Include totalQuantity
          totalRevenue: 1, // Include totalRevenue
        },
      },
    ]);

    return result || []; // Return the result, or an empty array if no results
  } catch (error) {
    console.error("Error in getBestSellingProducts:", error.message);
    throw error;
  }
};

const timeRanges = {
  "1_day": new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
  "7_days": new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
  "1_month": new Date(new Date().setMonth(new Date().getMonth() - 1)),
  "3_months": new Date(new Date().setMonth(new Date().getMonth() - 3)),
  "6_months": new Date(new Date().setMonth(new Date().getMonth() - 6)),
  "9_months": new Date(new Date().setMonth(new Date().getMonth() - 9)),
  "1_year": new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
  "2_years": new Date(new Date().setFullYear(new Date().getFullYear() - 2)),
};
const getCategorySales = async (timeRangeKey) => {
  const now = new Date();
  const startDate = timeRanges[timeRangeKey];

  if (!startDate) {
    throw new Error("Invalid time range key.");
  }

  try {
    const orders = await orderModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: "$order_product" },
      {
        $group: {
          _id: "$order_product.product_id",
          totalRevenue: {
            $sum: { $multiply: ["$order_product.totalPrice", "$order_product.quantity"] },
          },
        },
      },
      {
        $lookup: {
          from: "Products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category_id",
          categoryRevenue: { $sum: "$totalRevenue" },
        },
      },
      { $sort: { categoryRevenue: -1 } },
    ]);

    if (!orders.length) {
      return [];
    }

    const totalRevenue = await orderModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: "$order_product" },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ["$order_product.totalPrice", "$order_product.quantity"] },
          },
        },
      },
    ]);

    const total = totalRevenue[0] ? totalRevenue[0].totalRevenue : 0;
    console.log("Total Revenue:", total);  // Kiểm tra tổng doanh thu

    const categorySalesPercentage = orders.map((category) => ({
      categoryId: category._id,
      categoryRevenue: category.categoryRevenue,
      percentage: total > 0 ? (category.categoryRevenue / total) * 100 : 0,
    }));

    console.log("Category Sales Percentage:", categorySalesPercentage);  // Kiểm tra tỷ lệ phần trăm

    const categoryIds = categorySalesPercentage.map((category) => category.categoryId);
    const categories = await categoryModel.find({ _id: { $in: categoryIds } });

    for (let category of categorySalesPercentage) {
      const categoryInfo = categories.find((c) => c._id.toString() === category.categoryId.toString());
      category.categoryInfo = categoryInfo || null;
    }

    return categorySalesPercentage;
  } catch (error) {
    console.error("Error fetching category sales:", error);
    throw error;
  }
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

  getStatistics,
  getBestSellingProducts,
  getCategorySales


};
