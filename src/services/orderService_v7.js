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
  checkUserDiscountUsage
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
  getStatisticsOfShop,
  getBestSellingProductsOfShop,
  getCategorySalesOfShop,
  getSummaryForToday,
  getSideDishSummaryForToday,
  getOrderDetailsStatusSuccess
} = require("../repositories/orderRepository");
const { runProducer } = require("../message_queue/rabbitmq/producer");
const moment = require("moment-timezone");
const { calculateDistance } = require("../utils/Distance");
const locationModel = require("../models/locationModel");
const { toObjectId } = require("../utils");
class OrderServiceV5 {
  
  static async getOrderDetailsStatusSuccess(order_id){
    return await getOrderDetailsStatusSuccess(order_id)
  }
  static async getSummaryForToday(days,shop){
    return await getSummaryForToday(days,shop)
  }
  static async getSideDishSummaryForToday(days,shop){
    return await getSideDishSummaryForToday(days,shop)
  }
  static async getStatisticsOfShop(timeRange, shop) {
    return await getStatisticsOfShop(timeRange, shop);
  }
  static async getBestSellingProductsOfShop(timeRange, shop) {
    return await getBestSellingProductsOfShop(timeRange, shop);
  }
  static async getCategorySalesOfShop(timeRange, shop) {
    return await getCategorySalesOfShop(timeRange, shop);
  }
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
      throw new NotFoundError("có 1 chút sự cố xảy ra. Vui lòng liên hệ hỗ trợ để được giúp đỡ");
    }
    const cart = await getCart(foundUser._id);
    if (!cart) {
      throw new NotFoundError("có 1 chút sự cố xảy ra. Vui lòng liên hệ hỗ trợ để được giúp đỡ");
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
        throw new BadRequestError("áp dụng giảm giá không phù hợp");
      }
      const countUsed = await checkUserDiscountUsage(checkDiscount._id, user)
      if(countUsed === 0){
        throw new BadRequestError("Bạn đã sử dụng giảm giá này quá lần hạn sử dụng");
      }
    }
    const groupedProducts = cart.cart_products.reduce((group, item) => {
      let productId = item.product_id;


      if (typeof productId === "object" && productId._id) {
    
        productId = productId._id;
      }
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new BadRequestError(
          `có một chút sự cố. Vui lòng liên hệ hỗ trợ để được giúp đỡ`
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
        throw new NotFoundError(`có một chút sự cố, vui lòng liên hệ hỗ trợ để được giúp đỡ`);
      }

      // Kiểm tra tồn kho sản phẩm
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const checkStockProduct = await checkProductStockInShop({
        shop_id: foundShop._id,
        quantity: totalQuantity,
        product_id: productId,
      });
      if (checkStockProduct === false){
        throw new BadRequestError(
          `${foundProduct.product_name} hiện tại đang hết hàng. Vui lòng chọn sản phẩm khác`
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
                `Giá trị đơn hàng tối thiểu phải từ ${checkDiscount.min_order_value} không đủ để áp dụng cho sản phẩm ${foundProduct.product_name}`
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
        `Giá trị đơn hàng tối thiểu phải từ ${checkDiscount.min_order_value} không đủ để áp dụng cho tổng đơn hàng`
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
    dineOption
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
    if(!dineOption){
      dineOption = dine_in
    }
    if (selectedDeliveryTime) {
      const checkTime = await checkDeliveryTimeForShop({
        shop_id: shop._id,
        selectedDeliveryTime,
        totalMinutes,
      });
      if (checkTime) {
        estimated_delivery = selectedDeliveryTime;
        options_delivery = "specific_time";
      } else {
        throw new BadRequestError("Thời gian không phù hợp");
      }
    } else {
      if (!userLat || !userLon) {
        throw new BadRequestError("vui lòng bật vị trí của bạn");
      }
      const findLocation = await locationModel.findById(shop.location_id);
      if (!findLocation) {
        throw new NotFoundError("có một chút lỗi xảy ra. Vui lòng liên hệ hỗ trợ để được xử lí");
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
          "Địa chỉ của bạn nằm ngoài phạm vi 5km. Vui lòng chọn một tùy chọn khác"
        );
      }
      const checkTimeImmediate = await checkImmediateDeliveryTime({
        shop_id: shop._id,
        totalMinutes,
      });
      if (checkTimeImmediate === false) {
        throw new BadRequestError("Cửa hàng đang không mở cửa trong thời gian này");
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
      dineOption
    };
    const createOrder = await orderModel.create(payload);
    if (!createOrder) {
      throw new BadRequestError("Không thể đặt hàng, vui lòng liên hệ hỗ trợ để được xử lý");
    }
    const deeplink = await processMoMoPayment({
      orderId: createOrder._id,
      totalPrice: createOrder.order_checkout.finalPrice,
      shop_id: shop._id,
    });
    if (!deeplink) {
       await orderModel.deleteOne({
        _id: createOrder._id
      })
      throw new BadRequestError("không thể thanh toán vui lòng thử lại sau");
    }
    return deeplink;
  }

  static async cancelOrder({ order_id, user }) {
    const order = await orderModel.findOne({
      _id: order_id,
      order_userId: user._id,
      order_status: "pending",
    });
    if (!order) {
      throw new NotFoundError("không tìm thấy đơn hàng của bạn");
    }
    const cancellationCutoffTime = order.order_cancellation_cutoff;
    const currentTime = moment
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DDTHH:mm:ss");
    if (moment(currentTime).isAfter(cancellationCutoffTime)) {
      throw new BadRequestError("không thể hủy vì đã vượt quá thời gian cho phép");
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
      throw new BadRequestError("hủy đơn hàng không thành công. Vui lòng liên hệ hỗ trợ để được giúp đỡ");
    }
  }

  
 
}
module.exports = OrderServiceV5;
