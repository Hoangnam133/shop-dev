const orderModel = require("../models/orderModel");
const categoryModel = require("../models/categoryModel");
const {runProducerNoti} = require('../message_queue/sendNotification/producerSendNoti')
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
  const findOrder = await orderModel.find(query).sort({ createdAt: 1 });
  console.log(findOrder);
  
  if (!findOrder) {
    throw new NotFoundError("có một chút lỗi xảy ra, vui lòng thử lại");
  }
  return findOrder;
};
const listOrderCompletedOfUser = async (user) => {
  const query = {
    order_userId: user._id,
    order_status: "completed",
    "order_payment.payment_status": "Success",
  };
  const findOrder = await orderModel.find(query).sort({ createdAt: 1 });
  if (!findOrder) {
    throw new NotFoundError("có một chút lỗi xảy ra, vui lòng thử lại");
  }
  return findOrder;
};
const listOrderCancelledOfUser = async (user) => {
  const query = {
    order_userId: user._id,
    order_status: "cancelled",
    "order_payment.payment_status": "Success",
  };
  const findOrder = await orderModel.find(query).sort({ createdAt: 1 });
  if (!findOrder) {
    throw new NotFoundError("có một chút lỗi xảy ra, vui lòng thử lại");
  }
  return findOrder;
};
const listOrderSuccessOfUser = async (user) => {
  const query = {
    order_userId: user._id,
    order_status: "Success",
    "order_payment.payment_status": "Success",
  };
  const findOrder = await orderModel.find(query).sort({ createdAt: 1 });
  if (!findOrder) {
    throw new NotFoundError("có một chút lỗi xảy ra, vui lòng thử lại");
  }
  return findOrder;
};
const updateStatusCompleted = async (order_id) => {
  const query = {
    _id: order_id,
    order_status: "Success",
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
      "Update order failed: either payment was not Successful or order is no longer pending."
    );
  }

  const user = await userModel.findById(updateOrder.order_userId); 


  if (user && user.deviceToken) {
    const title = "Bạn đã nhận đơn hàng";
    const body = `Đơn hàng đã nhận gồm ${
      updateOrder.order_product?.map((product) => product.product_name) || []
    }, Nếu sản phẩm bị hư hại tự chịu trách nhiệm cdmm`;
    const data = {
      order_id: updateOrder._id,
      status: "completed",
    };
    const payload= {
      title: title,
      body: body,
      data: data,
      deviceToken: user.deviceToken
    }
    await runProducerNoti(payload)
  }
  return updateOrder;
};
const updateStatusSuccess = async (order_id) => {
  const query = {
    _id: order_id,
    order_status: "pending",
    "order_payment.payment_status": "Success",
  };

  const updateOrder = await orderModel.findOneAndUpdate(
    query,
    { $set: { order_status: "Success" } },
    { new: true, lean: true }
  );

  if (!updateOrder) {
    throw new BadRequestError(
      "Update order failed: either payment was not Successful or order is no longer pending."
    );
  }

  // Gửi thông báo đẩy
  const user = await userModel.findById(updateOrder.order_userId);

  if (user && user.deviceToken) {
    const title = "Đơn hàng của bạn đã hoàn thành";
    const body = `Đơn hàng của bạn: ${
      updateOrder.order_product?.map((product) => product.product_name) || []
    }. Vui lòng xuống căng tin nhận hàng`;
    const data = {
      order_id: updateOrder._id,
      status: "completed",
    };
    const payload= {
      title: title,
      body: body,
      data: data,
      deviceToken: user.deviceToken
    }
    await runProducerNoti(payload)
   
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


  if (user && user.deviceToken) {
    const title = "Đơn hàng đã bị huỷ";
    const body = `Đơn hàng ${
      updateOrder.order_product?.map((product) => product.product_name) || []
    } của bạn đã bị huỷ.`;
    const data = {
      order_id: updateOrder._id,
      status: "cancelled",
    };

    const payload= {
      title: title,
      body: body,
      data: data,
      deviceToken: user.deviceToken
    }
    await runProducerNoti(payload)
  }

  return updateOrder;
};
const listOrderPending = async ({ limit, page, shop }) => {
  const skip = (page - 1) * limit;
  const query = {
    order_status: "pending",
    order_shopId: shop._id,
    "order_payment.payment_status": "Success",
  };
  const findOrder = await orderModel
    .find(query).populate({path:"order_userId",select: "name"})
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!findOrder) {
    throw new NotFoundError("có một chút lỗi xảy ra, vui lòng thử lại");
  }
  return findOrder;
};
const listOrderSuccess = async ({ limit, page, shop }) => {
  const skip = (page - 1) * limit;
  const query = {
    order_status: "Success",
    order_shopId: shop._id,
    "order_payment.payment_status": "Success",
  };
  const findOrder = await orderModel
    .find(query).populate({path:"order_userId",select: "name"})
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!findOrder) {
    throw new NotFoundError("có một chút lỗi xảy ra, vui lòng thử lại");
  }
  return findOrder;
};
const listOrderCancelled = async ({ limit, page, shop }) => {
  const skip = (page - 1) * limit;
  const query = {
    order_status: "cancelled",
    order_shopId: shop._id,
    "order_payment.payment_status": "Success",
  };
  const findOrder = await orderModel
    .find(query).populate({path:"order_userId",select: "name"})
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!findOrder) {
    throw new NotFoundError("có một chút lỗi xảy ra, vui lòng thử lại");
  }
  return findOrder;
};
const listOrderCompleted = async ({ limit, page, shop }) => {
  const skip = (page - 1) * limit;
  const query = {
    order_status: "completed",
    order_shopId: shop._id,
    "order_payment.payment_status": "Success",
  };
  const findOrder = await orderModel
    .find(query).populate({path:"order_userId",select: "name"})
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!findOrder) {
    throw new NotFoundError("có một chút lỗi xảy ra, vui lòng thử lại");
  }
  return findOrder;
};
const getOrderDetail = async (user, orderId) => {
  const findOrder = await orderModel.findOne({
    _id: orderId,
    order_userId: user._id,
    "order_payment.payment_status": "Success",
  });
  if (!findOrder) {
    throw new NotFoundError("có một chút lỗi xảy ra, vui lòng thử lại");
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
const getStatistics = async (timeRange) => {
  const now = new Date(); // Ngày hiện tại

  // Kiểm tra nếu `timeRange` không hợp lệ
  if (!timeRanges[timeRange]) {
    throw new Error(
      `Invalid time range: ${timeRange}. Please choose one of ${Object.keys(
        timeRanges
      ).join(", ")}`
    );
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
          totalRevenue: {
            $sum: {
              $multiply: [
                "$order_product.quantity",
                "$order_product.totalPrice",
              ],
            },
          }, // Tổng doanh thu
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
    return (
      result[0] || {
        totalProducts: 0,
        totalRevenue: 0,
        totalUsers: 0,
        totalOrders: 0,
      }
    );
  } catch (error) {
    console.error("Error in getStatistics:", error.message);
    throw error;
  }
};
const getStatisticsOfShop = async (timeRange, shop) => {
  const now = new Date(); // Ngày hiện tại

  // Kiểm tra nếu `timeRange` không hợp lệ
  if (!timeRanges[timeRange]) {
    throw new Error(
      `Invalid time range: ${timeRange}. Please choose one of ${Object.keys(
        timeRanges
      ).join(", ")}`
    );
  }

  const startDate = timeRanges[timeRange];

  try {
    // Thực hiện aggregation
    const result = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }, // Lọc đơn hàng từ `startDate`
          order_status: "completed", // Chỉ lấy đơn hàng đã hoàn thành
          order_shopId: shop._id, // Lọc đơn hàng theo shop
        },
      },
      {
        $unwind: "$order_product", // Tách từng sản phẩm trong đơn hàng
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: "$order_product.quantity" }, // Tổng số sản phẩm bán ra
          totalRevenue: {
            $sum: {
              $multiply: [
                "$order_product.quantity",
                "$order_product.totalPrice",
              ],
            },
          }, // Tổng doanh thu
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
    return (
      result[0] || {
        totalProducts: 0,
        totalRevenue: 0,
        totalUsers: 0,
        totalOrders: 0,
      }
    );
  } catch (error) {
    console.error("Error in getStatistics:", error.message);
    throw error;
  }
};
const getBestSellingProducts = async (timeRange) => {
  const now = new Date(); // Current date

  // Validate timeRange
  if (!timeRanges[timeRange]) {
    throw new Error(
      `Invalid time range: ${timeRange}. Please choose one of ${Object.keys(
        timeRanges
      ).join(", ")}`
    );
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
const getBestSellingProductsOfShop = async (timeRange, shop) => {
  const now = new Date(); // Current date

  // Validate timeRange
  if (!timeRanges[timeRange]) {
    throw new Error(
      `Invalid time range: ${timeRange}. Please choose one of ${Object.keys(
        timeRanges
      ).join(", ")}`
    );
  }

  const startDate = timeRanges[timeRange];

  try {
    const result = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(startDate) }, // Ensure 'createdAt' is compared with a Date object
          order_status: "completed", // Only completed orders,
          order_shopId: shop._id
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
const getCategorySales = async (timeRangeKey) => {
  const now = new Date();
  const startDate = timeRanges[timeRangeKey];

  if (!startDate) {
    throw new Error("Invalid time range key.");
  }

  try {
    // Tính tổng doanh thu theo từng category
    const orders = await orderModel.aggregate([
      { $match: { createdAt: { $gte: startDate } },  order_status: "completed", },
      { $unwind: "$order_product" },
      {
        $group: {
          _id: "$order_product.product_id", // Sản phẩm được chọn trong đơn hàng
          totalRevenue: {
            $sum: {
              $multiply: [
                "$order_product.totalPrice",
                "$order_product.quantity",
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "Products", // Kết nối với bảng Products
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" }, // Chắc chắn chỉ có 1 sản phẩm ở mỗi mục
      {
        $group: {
          _id: "$productInfo.category_id", // Tính tổng doanh thu theo từng category
          categoryRevenue: { $sum: "$totalRevenue" },
        },
      },
      { $sort: { categoryRevenue: -1 } },
    ]);

    // Lấy tất cả categoryIds từ kết quả trên
    const categoryIds = orders.map((category) => category._id);

    // Tính tổng doanh thu của tất cả sản phẩm trong các category đã tính ở trên
    const totalRevenue = await orderModel.aggregate([
      { $match: { createdAt: { $gte: startDate } },  order_status: "completed", },
      { $unwind: "$order_product" },
      {
        $lookup: {
          from: "Products", // Kết nối với bảng Products để lấy thông tin về category_id
          localField: "order_product.product_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $match: {
          "productInfo.category_id": { $in: categoryIds }, // Lọc các sản phẩm thuộc các category đã tính
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $multiply: [
                "$order_product.totalPrice",
                "$order_product.quantity",
              ],
            },
          },
        },
      },
    ]);

    const total = totalRevenue[0] ? totalRevenue[0].totalRevenue : 0;

    // Lọc và tính tỷ lệ phần trăm và doanh thu cho các category
    const categorySalesPercentage = orders.map((category) => {
      const percentage =
        total > 0 ? (category.categoryRevenue / total) * 100 : 0;
      return {
        categoryId: category._id,
        categoryRevenue: percentage > 0 ? category.categoryRevenue : 0, // Chỉ tính categoryRevenue nếu tỷ lệ phần trăm > 0
        percentage: percentage,
        revenueAmount: percentage > 0 ? (percentage / 100) * total : 0, // Tính doanh thu nếu tỷ lệ phần trăm > 0
      };
    });

    // Lấy thông tin chi tiết các category, bao gồm tất cả các category, không phụ thuộc vào doanh thu
    const categories = await categoryModel.find({ _id: { $in: categoryIds } });

    // Gắn thông tin category vào kết quả
    for (let category of categorySalesPercentage) {
      const categoryInfo = categories.find(
        (c) => c._id.toString() === category.categoryId.toString()
      );
      category.categoryInfo = categoryInfo || null;
    }

    // Lấy danh sách tất cả category từ categoryModel để chắc chắn mọi category đều có mặt
    const allCategories = await categoryModel.find();

    // Gắn thông tin của tất cả các category vào kết quả trả về
    for (let cat of allCategories) {
      // Nếu category không có trong categorySalesPercentage, thêm nó vào với categoryRevenue = 0 và percentage = 0
      if (
        !categorySalesPercentage.some(
          (category) => category.categoryId.toString() === cat._id.toString()
        )
      ) {
        categorySalesPercentage.push({
          categoryId: cat._id,
          categoryRevenue: 0,
          percentage: 0,
          revenueAmount: 0,
          categoryInfo: cat,
        });
      }
    }

    // Sắp xếp lại danh sách theo categoryRevenue giảm dần
    categorySalesPercentage.sort(
      (a, b) => b.categoryRevenue - a.categoryRevenue
    );

    return categorySalesPercentage;
  } catch (error) {
    console.error("Error fetching category sales:", error);
    throw error;
  }
};
const getCategorySalesOfShop = async (timeRangeKey, shop) => {
  const now = new Date();
  const startDate = timeRanges[timeRangeKey];

  if (!startDate) {
    throw new Error("Invalid time range key.");
  }

  try {
    // Tính tổng doanh thu theo từng category
    const orders = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          order_status: "completed",
          order_shopId: shop._id
        }
      },
      { $unwind: "$order_product" },
      {
        $group: {
          _id: "$order_product.product_id", // Sản phẩm được chọn trong đơn hàng
          totalRevenue: {
            $sum: {
              $multiply: [
                "$order_product.totalPrice",
                "$order_product.quantity",
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "Products", // Kết nối với bảng Products
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" }, // Chắc chắn chỉ có 1 sản phẩm ở mỗi mục
      {
        $group: {
          _id: "$productInfo.category_id", // Tính tổng doanh thu theo từng category
          categoryRevenue: { $sum: "$totalRevenue" },
        },
      },
      { $sort: { categoryRevenue: -1 } },
    ]);
    

    // Lấy tất cả categoryIds từ kết quả trên
    const categoryIds = orders.map((category) => category._id);

    // Tính tổng doanh thu của tất cả sản phẩm trong các category đã tính ở trên
    const totalRevenue = await orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          order_status: "completed"
        }
      },
      { $unwind: "$order_product" },
      {
        $lookup: {
          from: "Products",
          localField: "order_product.product_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $match: {
          "productInfo.category_id": { $in: categoryIds },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $multiply: [
                "$order_product.totalPrice",
                "$order_product.quantity",
              ],
            },
          },
        },
      },
    ]);
    

    const total = totalRevenue[0] ? totalRevenue[0].totalRevenue : 0;

    // Lọc và tính tỷ lệ phần trăm và doanh thu cho các category
    const categorySalesPercentage = orders.map((category) => {
      const percentage =
        total > 0 ? (category.categoryRevenue / total) * 100 : 0;
      return {
        categoryId: category._id,
        categoryRevenue: percentage > 0 ? category.categoryRevenue : 0, // Chỉ tính categoryRevenue nếu tỷ lệ phần trăm > 0
        percentage: percentage,
        revenueAmount: percentage > 0 ? (percentage / 100) * total : 0, // Tính doanh thu nếu tỷ lệ phần trăm > 0
      };
    });

    // Lấy thông tin chi tiết các category, bao gồm tất cả các category, không phụ thuộc vào doanh thu
    const categories = await categoryModel.find({ _id: { $in: categoryIds } });

    // Gắn thông tin category vào kết quả
    for (let category of categorySalesPercentage) {
      const categoryInfo = categories.find(
        (c) => c._id.toString() === category.categoryId.toString()
      );
      category.categoryInfo = categoryInfo || null;
    }

    // Lấy danh sách tất cả category từ categoryModel để chắc chắn mọi category đều có mặt
    const allCategories = await categoryModel.find();

    // Gắn thông tin của tất cả các category vào kết quả trả về
    for (let cat of allCategories) {
      // Nếu category không có trong categorySalesPercentage, thêm nó vào với categoryRevenue = 0 và percentage = 0
      if (
        !categorySalesPercentage.some(
          (category) => category.categoryId.toString() === cat._id.toString()
        )
      ) {
        categorySalesPercentage.push({
          categoryId: cat._id,
          categoryRevenue: 0,
          percentage: 0,
          revenueAmount: 0,
          categoryInfo: cat,
        });
      }
    }

    // Sắp xếp lại danh sách theo categoryRevenue giảm dần
    categorySalesPercentage.sort(
      (a, b) => b.categoryRevenue - a.categoryRevenue
    );

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
  updateStatusSuccess,
  listOrderPending,
  listOrderSuccess,
  listOrderCancelled,
  listOrderCompleted,
  getOrderDetail,
  listBestSellingProductsInShop,
  getTotalRevenueInShop,


  getStatistics,
  getBestSellingProducts,
  getCategorySales,

  
  getStatisticsOfShop,
  getBestSellingProductsOfShop,
  getCategorySalesOfShop,
};
