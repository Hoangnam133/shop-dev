const {
  getCartByUserId,
  getCart,
} = require("../repositories/cartRepository_v4");
const { BadRequestError, NotFoundError } = require("../core/errorResponse");
const mongoose = require("mongoose");
const userModel = require("../models/userModel");
const shopModel = require("../models/shopModel");
const rewardSettingModel = require("../models/rewardSettingModel");
const { processMoMoPayment } = require("../momo/paymentService");
const {
  checkProductStockInShop,
} = require("../repositories/inventoryRepository");
const productModel = require("../models/productModel");
const {
  getDiscountByCode,
  checkproductAppliedDiscount,
  checkDiscountApplicable,
  calculateDiscountAmount,
} = require("../repositories/discountRepository");
const {
  checkDeliveryTimeForShop,
  checkImmediateDeliveryTime,
} = require("../repositories/openingHoursRepository");
const orderModel = require("../models/orderModel");
const {
  listOrderCancelledOfUser,
  listOrderCompletedOfUser,
  listOrderPendingOfUser,
  listOrderSuccessOfUser,
  updateStatusCancelled,
  updateStatusCompleted,
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
  updateStatusSuccess,
} = require("../repositories/orderRepository");
const { runProducer } = require("../message_queue/rabbitmq/producer");
const moment = require("moment-timezone");
const { calculateDistance } = require("../utils/Distance");
const locationModel = require("../models/locationModel");
const { toObjectId } = require("../utils");
class OrderServiceV5 {
  static async getCategorySales(timeRange) {
    return await getCategorySales(timeRange);
  }
  static async getBestSellingProducts(timeRange) {
    return await getBestSellingProducts(timeRange);
  }
  static async getStatistics(timeRange) {
    return await getStatistics(timeRange);
  }
  static async getTotalRevenueInShop(shop_id) {
    return await getTotalRevenueInShop(shop_id);
  }
  static async listBestSellingProductsInShop(shop_id, limit) {
    return await listBestSellingProductsInShop(shop_id, limit);
  }
  static async getOrderDetail(user, orderId) {
    return await getOrderDetail(user, orderId);
  }
  static async listOrderCancelledOfUser(user) {
    return await listOrderCancelledOfUser(user);
  }
  static async listOrderCompletedOfUser(user) {
    return await listOrderCompletedOfUser(user);
  }
  static async list_OrderPendingOfUser(user) {
    return await listOrderPendingOfUser(user);
  }
  static async listOrderSuccessOfUser(user) {
    return await listOrderSuccessOfUser(user);
  }

  static async updateStatusSuccess(order_id) {
    return await updateStatusSuccess(order_id);
  }
  static async updateStatusCancelled(order_id) {
    return await updateStatusCancelled(order_id);
  }
  static async updateStatusCompleted(order_id) {
    return await updateStatusCompleted(order_id);
  }
  static async updateStatusSuccess(order_id) {
    return await updateStatusSuccess(order_id);
  }
  static async listOrderPending({ limit = 10, page = 1, shop }) {
    return await listOrderPending({ limit, page, shop });
  }
  static async listOrderSuccess({ limit = 10, page = 1, shop }) {
    return await listOrderSuccess({ limit, page, shop });
  }
  static async listOrderCancelled({ limit = 10, page = 1, shop }) {
    return await listOrderCancelled({ limit, page, shop });
  }
  static async listOrderCompleted({ limit = 10, page = 1, shop }) {
    return await listOrderCompleted({ limit, page, shop });
  }
  static async checkoutPreview({ user, shop, discount_code }) {
    const foundUser = await userModel.findById(user._id);
    const foundShop = await shopModel.findById(shop._id);

    if (!foundUser || !foundShop) {
      throw new NotFoundError("User or shop not found");
    }
    const cart = await getCart(foundUser._id);
    if (!cart) {
      throw new NotFoundError("Cart not found");
    }

    let productCheckout = [];
    let totalDiscount = 0;
    let finalPrice = 0;
    let totalPrice = 0;
    let totalMinutes = 0;
    var checkDiscount;
    if (discount_code) {
      checkDiscount = await getDiscountByCode(discount_code);
      if (!checkDiscount) {
        throw new BadRequestError("Invalid discount code");
      }
    }
    const groupedProducts = cart.cart_products.reduce((group, item) => {
      let productId = item.product_id;


      if (typeof productId === "object" && productId._id) {
    
        productId = productId._id;
      }
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new BadRequestError(
          `Invalid product_id: ${JSON.stringify(productId)}`
        );
      }
      const validProductId = toObjectId(productId);

      if (!group[validProductId]) {
        group[validProductId] = [];
      }
      group[validProductId].push(item);
      return group;
    }, {});

    // **Áp dụng giảm giá cho từng nhóm sản phẩm**
    for (const [productId, items] of Object.entries(groupedProducts)) {
      const foundProduct = await productModel.findById(productId);
      if (!foundProduct) {
        throw new NotFoundError(`${productId} not found`);
      }

      // Kiểm tra tồn kho sản phẩm
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const checkStockProduct = await checkProductStockInShop({
        shop_id: foundShop._id,
        quantity: totalQuantity,
        product_id: productId,
      });
      if (!checkStockProduct) {
        throw new BadRequestError(
          `${foundProduct.product_name} not enough stock`
        );
      }

      // Tính tổng giá trị nhóm sản phẩm
      const totalPriceForProduct = items.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      // Kiểm tra và áp dụng giảm giá
      let discountForProduct = 0;
      if (checkDiscount && checkDiscount.applicable_to === "product") {
        const checkTypeDiscount = await checkDiscountApplicable(
          checkDiscount,
          "product"
        );
        if (checkTypeDiscount) {
          const applicableProducts = await checkproductAppliedDiscount(
            checkTypeDiscount,
            foundProduct
          );

          if (applicableProducts) {
            if (
              checkDiscount &&
              totalPriceForProduct < checkDiscount.min_order_value
            ) {
              throw new BadRequestError(
                `Min order value ${checkDiscount.min_order_value} is not enough for product ${foundProduct.product_name}`
              );
            }
            discountForProduct = calculateDiscountAmount({
              discountValue: checkTypeDiscount.discount_value,
              totalPrice: totalPriceForProduct,
              discountValueType: checkTypeDiscount.discount_value_type,
              maxValueDiscount: checkTypeDiscount.maximum_discount_value,
            });
          }
        }
      }

      items.forEach((item) => {
        const proportion = item.totalPrice / totalPriceForProduct;
        const itemDiscount = discountForProduct * proportion;

        totalMinutes += item.quantity * foundProduct.preparation_time;
        productCheckout.push({
          product_id: foundProduct._id,
          product_thumb: foundProduct.product_thumb,
          product_name: foundProduct.product_name,
          extra: item.sideDishes.map((sideDish) => ({
            sideDish_id: sideDish.sideDish_id,
            quantity: sideDish.quantity,
            sideDish_name: sideDish.sideDish_name,
          })),
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          discountForProduct: itemDiscount,
        });
      });

      // Cập nhật tổng giảm giá và tổng giá trị cuối cùng
      finalPrice += totalPriceForProduct - discountForProduct;
      totalDiscount += discountForProduct;
      totalPrice += totalPriceForProduct;
    }
    if (checkDiscount && totalPrice < checkDiscount.min_order_value) {
      throw new BadRequestError(
        `Min order value ${checkDiscount.min_order_value} is not enough for total order`
      );
    }
    // **Giảm giá toàn đơn hàng (nếu cần)**
    if (checkDiscount && totalDiscount === 0) {
      const checkTypeDiscount = await checkDiscountApplicable(
        checkDiscount,
        "order"
      );
      if (checkTypeDiscount) {
        totalDiscount = calculateDiscountAmount({
          discountValue: checkTypeDiscount.discount_value,
          totalPrice,
          discountValueType: checkTypeDiscount.discount_value_type,
          maxValueDiscount: checkTypeDiscount.maximum_discount_value,
        });
        finalPrice = totalPrice - totalDiscount;
      }
    }

    const rewardSetting = await rewardSettingModel.findOne({ isActive: true });
    let pointsEarned = 0;
    if (rewardSetting) {
      const pointRate = rewardSetting.pointRate;
      pointsEarned = Math.floor(totalPrice * pointRate);
    }

    return {
      productCheckout,
      totalPrice,
      totalDiscount,
      finalPrice,
      totalMinutes,
      pointsEarned,
    };
  }
  static async checkout({
    user,
    shop,
    discount_code,
    selectedDeliveryTime,
    note,
    userLat,
    userLon,
  }) {
    const {
      productCheckout,
      totalPrice,
      totalDiscount,
      finalPrice,
      totalMinutes,
      pointsEarned,
    } = await OrderServiceV5.checkoutPreview({ user, shop, discount_code });
    let estimated_delivery, options_delivery
    if (selectedDeliveryTime) {
      console.log("Selected Delivery Time:", selectedDeliveryTime);
      const checkTime = await checkDeliveryTimeForShop({
        shop_id: shop._id,
        selectedDeliveryTime,
        totalMinutes,
      });
      if (checkTime) {
        estimated_delivery = selectedDeliveryTime;
        options_delivery = "specific_time";
      } else {
        throw new BadRequestError("Invalid delivery time");
      }
    } else {
      if (!userLat || !userLon) {
        throw new BadRequestError("User location is required");
      }
      const findLocation = await locationModel.findById(shop.location_id);
      if (!findLocation) {
        throw new NotFoundError("Location not found");
      }
      const caDistance = calculateDistance({
        userLat,
        userLon,
        facilityLat: findLocation.latitude,
        facilityLon: findLocation.longitude,
      });
      const minAllowedDistance = process.env.ALLOWED_RADIUS;
      if (caDistance > minAllowedDistance) {
        throw new BadRequestError(
          "You are outside the delivery radius for immediate pickup. Please choose another option."
        );
      }
      const checkTimeImmediate = await checkImmediateDeliveryTime({
        shop_id: shop._id,
        totalMinutes,
      });
      if (checkTimeImmediate === false) {
        throw new BadRequestError("Shop is not open during this time");
      } else {
        estimated_delivery = checkTimeImmediate;
        options_delivery = "asap";
      }
    }
    const order_time = moment
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DDTHH:mm:ss");
    const payload = {
      shop_id: shop._id,
      order_checkout: {
        totalAmount: totalPrice,
        finalPrice,
        totalDiscount,
      },
      order_payment: {
        payment_method: "online_payment",
        payment_status: "pending",
      },
      options_delivery,
      order_product: productCheckout,
      order_status: "pending",
      order_discount_code: discount_code,
      estimated_delivery_time: estimated_delivery,
      order_time,
      order_userId: user._id,
      order_shopId: shop._id,
      note,
    };
    const createOrder = await orderModel.create(payload);
    if (!createOrder) {
      throw new BadRequestError("Failed to create order");
    }
    const deeplink = await processMoMoPayment({
      orderId: createOrder._id,
      totalPrice: createOrder.order_checkout.finalPrice,
      shop_id: shop._id,
    });
    if (!deeplink) {
      throw new BadRequestError("Failed to process MoMo payment");
    }
    console.log("MoMo payment link app---------------------", deeplink);
    return deeplink;
  }

  static async cancelOrder({ order_id, user }) {
    const order = await orderModel.findOne({
      _id: order_id,
      order_userId: user._id,
      order_status: "pending",
    });
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    const cancellationCutoffTime = order.order_cancellation_cutoff;
    const currentTime = moment
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DDTHH:mm:ss");
    if (moment(currentTime).isAfter(cancellationCutoffTime)) {
      throw new BadRequestError("Cancellation time has passed");
    }
    const updateOrder = await orderModel.findOneAndUpdate(
      {
        _id: order_id,
        order_userId: user._id,
      },
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
      throw new BadRequestError("Failed to cancel order");
    }
  }
  static async cancelOrder({ order_id, user }){
    const order = await orderModel.findOne({
      _id: order_id,
      order_userId: user._id,
      order_status: "pending",
    });
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    const cancellationCutoffTime = order.order_cancellation_cutoff;
    const currentTime = moment
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DDTHH:mm:ss");
    if (moment(currentTime).isAfter(cancellationCutoffTime)) {
      throw new BadRequestError("Cancellation time has passed");
    }
    const updateOrder = await orderModel.findOneAndUpdate(
      {
        _id: order_id,
        order_userId: user._id,
      },
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
      throw new BadRequestError("Failed to cancel order");
    }
  }
}
module.exports = OrderServiceV5;
