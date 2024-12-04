const { getCartByUserId, getCart } = require("../repositories/cartRepository_v4");
const { BadRequestError, NotFoundError } = require("../core/errorResponse");
const mongoose = require("mongoose");
const userModel = require("../models/userModel");
const shopModel = require("../models/shopModel");
const rewardSettingModel = require("../models/rewardSettingModel");
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
} = require("../repositories/orderRepository");
const { runProducer } = require("../message_queue/rabbitmq/producer");
const moment = require("moment-timezone");
const {calculateDistance} = require('../utils/Distance')
const locationModel = require("../models/locationModel");
const { toObjectId } = require("../utils");
class OrderServiceV5 {
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
  static async updateStatusCancelled(order_id) {
    return await updateStatusCancelled(order_id);
  }
  static async updateStatusCompleted(order_id) {
    return await updateStatusCompleted(order_id);
  }
  static async listOrderPending({ limit = 10, page = 1 }) {
    return await listOrderPending({ limit, page });
  }
  static async listOrderSuccess({ limit = 10, page = 1 }) {
    return await listOrderSuccess({ limit, page });
  }
  static async listOrderCancelled({ limit = 10, page = 1 }) {
    return await listOrderCancelled({ limit, page });
  }
  static async listOrderCompleted({ limit = 10, page = 1 }) {
    return await listOrderCompleted({ limit, page });
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
      var checkDiscount
      if(discount_code){
        checkDiscount = await getDiscountByCode(discount_code);
        if(!checkDiscount){
          throw new BadRequestError("Invalid discount code");
        }
      }
      // **Nhóm các sản phẩm trong giỏ hàng theo `product_id`**
      // const groupedProducts = cart.cart_products.reduce((group, item) => {
      //   if (!group[item.product_id]) {
      //     group[item.product_id] = [];
      //   }
      //   group[item.product_id].push(item);
      //   return group;
      // }, {});
      // Nhóm các sản phẩm trong giỏ hàng theo `product_id`
      const groupedProducts = cart.cart_products.reduce((group, item) => {
        let productId = item.product_id; 
    

        console.log("product_id:", productId);
        console.log("Type of product_id:", typeof productId);
    
        if (typeof productId === 'object' && productId._id) {
            console.log("Extracting _id from object");
            productId = productId._id;
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new BadRequestError(`Invalid product_id: ${JSON.stringify(productId)}`);
        }
        const validProductId = toObjectId(productId);
    
        if (!group[validProductId]) {
            group[validProductId] = [];
        }
        group[validProductId].push(item);
        return group;
    }, {});
    

    // **Áp dụng giảm giá cho từng nhóm sản phẩm**
    for (const [productId, items] of Object.entries(groupedProducts)){
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
        throw new BadRequestError(`${foundProduct.product_name} not enough stock`);
      }
  
      // Tính tổng giá trị nhóm sản phẩm
      const totalPriceForProduct = items.reduce((sum, item) => sum + item.totalPrice, 0);
   
      // Kiểm tra và áp dụng giảm giá
      let discountForProduct = 0;
      if (checkDiscount && checkDiscount.applicable_to === "product") {
        const checkTypeDiscount = await checkDiscountApplicable(checkDiscount, "product");
        if (checkTypeDiscount) {
          const applicableProducts = await checkproductAppliedDiscount(
            checkTypeDiscount,
            foundProduct
          );
  
          if (applicableProducts) {
            if(checkDiscount && (totalPriceForProduct < checkDiscount.min_order_value)){
              throw new BadRequestError(`Min order value ${checkDiscount.min_order_value} is not enough for product ${foundProduct.product_name}`);
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
  
      // Phân bổ giảm giá cho từng mục trong nhóm
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
    if(checkDiscount && (totalPrice < checkDiscount.min_order_value)){
      throw new BadRequestError(`Min order value ${checkDiscount.min_order_value} is not enough for total order`);
    }
    // **Giảm giá toàn đơn hàng (nếu cần)**
    if (checkDiscount && totalDiscount === 0) {
      const checkTypeDiscount = await checkDiscountApplicable(checkDiscount, "order");
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
  
    // **Tính điểm thưởng (nếu có hệ thống điểm)**
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
    userLon 
  }) {
    const {
      productCheckout,
      totalPrice,
      totalDiscount,
      finalPrice,
      totalMinutes,
      pointsEarned,
    } = await OrderServiceV5.checkoutPreview({ user, shop, discount_code });
    let estimated_delivery, options_delivery;
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
    }else {
      if(!userLat || !userLon) {
        throw new BadRequestError("User location is required");
      }
      const findLocation = await locationModel.findById(shop.location_id)
      if (!findLocation) {
        throw new NotFoundError("Location not found");
      }
      const caDistance = calculateDistance({userLat, userLon, facilityLat: findLocation.latitude, facilityLon: findLocation.longitude})
      const minAllowedDistance  = process.env.ALLOWED_RADIUS
      if (caDistance > minAllowedDistance) {
        throw new BadRequestError("You are outside the delivery radius for immediate pickup. Please choose another option.");
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
        payment_status: "success",
      },
      options_delivery,
      order_product: productCheckout,
      order_status: "pending",
      order_discount_code: discount_code,
      estimated_delivery_time: estimated_delivery,
      order_time,
      order_userId: user._id,
      note,
      points_earned: pointsEarned,
    };
    const foundUser = await userModel.findById(user._id); // Lấy người dùng từ cơ sở dữ liệu
    if (!foundUser) {
      throw new NotFoundError("User not found");
    }

    if (pointsEarned > 0) {
      foundUser.points += pointsEarned; // Chỉ cộng điểm nếu có
      await foundUser.save();
      console.log("Updated points successfully:", foundUser.points); // Lưu thay đổi vào database
    }
    console.log(foundUser);

    console.log("đã  chạy đến đây LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL");
    await runProducer(payload);
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
    // xử lý sản phẩm trong kho (viết ở repository) ok
    // tích hợp món phụ vào
    // tích hợp thanh toán
    // send thông báo khi đặt hàng thành công
    // đổi điểm nữa
    static async cancelOrder ({order_id, user}){
        const order = await orderModel.findOne({
            _id: order_id,
            order_userId: user._id,
            order_status: 'pending'
        });
        if (!order) {
            throw new NotFoundError('Order not found');
        }
        const cancellationCutoffTime = order.order_cancellation_cutoff
        const currentTime = moment.tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DDTHH:mm:ss')
        if (moment(currentTime).isAfter(cancellationCutoffTime)) {
            throw new BadRequestError('Cancellation time has passed')
        }
        const updateOrder = await orderModel.findOneAndUpdate({
            _id: order_id,
            order_userId: user._id
        },{
            $set: {
                order_status: 'cancelled'
            }
        },{
            new: true,
            lean: true
        })
        if (!updateOrder) {
            throw new BadRequestError('Failed to cancel order')
        }
    }
}
module.exports = OrderServiceV5;
