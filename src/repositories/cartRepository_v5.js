const cartModel = require("../models/cartModel");
const {
  checkProductStockInShop,
} = require("../repositories/inventoryRepository");
const {
  checkProductInShop,
  getProductById,
} = require("../repositories/productRepository");
const { NotFoundError, BadRequestError } = require("../core/errorResponse");
const { toObjectId } = require("../utils/index");
const sideDishModel = require("../models/sideDishModel");
const { saveCartToRedis, getCartRedis } = require("../redisDB/redisCart");
// kiểm tra xem là trả về từ redis hay cart model
const isCartFromRedis = async (foundCart) => {
  if (foundCart instanceof cartModel) {
    // Nếu là instance của MongoDB, thực hiện lưu vào cơ sở dữ liệu
    const updateCart = await foundCart.save();
    if (!updateCart) {
      throw new BadRequestError("Update cart failed");
    }
    return foundCart;
  } else {
    // Nếu không phải là instance của MongoDB (tức là đến từ Redis), cập nhật giỏ hàng trong Redis
    const saveRedis = await saveCartToRedis(foundCart.cart_userId, foundCart);
    return saveRedis;
  }
};
// Kiểm tra giỏ hàng xem tồn tại hay không
const getCartByUserId = async (user) => {
  if (!user) throw new NotFoundError("Có 1 chút sự cố, bạn vui lòng thử lại sau");
  const attached = {
    path: "cart_products.product_id",
    select: "product_name product_thumb",
  };
  let foundCart = null;
  foundCart = await getCartRedis(user._id);
  if (foundCart) {
    for (let cartProduct of foundCart.cart_products) {
      // Truy vấn sản phẩm từ MongoDB
      const productDetails = await getProductById(cartProduct.product_id);

      // Bổ sung thông tin sản phẩm vào giỏ hàng
      cartProduct.product_id = {
        _id: productDetails._id,
        product_name: productDetails.product_name,
        product_thumb: productDetails.product_thumb,
      };
    }

    // Cập nhật lại giỏ hàng vào Redis (nếu cần)
    await saveCartToRedis(user._id, foundCart);
    return foundCart; // Trả về giỏ hàng đã được bổ sung thông tin sản phẩm
  }
  foundCart = await cartModel.findOne({ cart_userId: user._id });
  if (foundCart) {
    return foundCart.populate(attached);
  }
};
const getCart = async (user) => {
  if (!user) throw new NotFoundError("Có 1 chút sự cố, bạn vui lòng thử lại sau");
  let foundCart;
  foundCart = await getCartRedis(user._id);
  if (foundCart) {
    return foundCart;
  }
  foundCart = await cartModel.findOne({ cart_userId: user._id });
  return foundCart;
};
const checkStockAndProductInShop = async ({
  product_id,
  shop_id,
  quantity,
}) => {
  // kiểm tra sản phẩm có nằm trong shop này hay không
  const checkProduct = await checkProductInShop(shop_id, product_id);

  if (!checkProduct) {
    throw new NotFoundError("sản phẩm hiện không có tại chi nhánh này");
  }
  // kiểm tra sản phẩm xem có đủ số lượng để thêm vào giỏ hàng hay không
  const checkQuantityProduct = await checkProductStockInShop({
    shop_id,
    product_id,
    quantity,
  });
  if (!checkQuantityProduct) {
    throw new BadRequestError("Xin lỗi, sản phẩm bạn chọn đã hết hàng. Vui lòng chọn sản phẩm khác hoặc quay lại sau");
  }
};
// tạo giỏ hàng
const createUserCart = async ({ user, product, shop }) => {
  const shop_id = shop._id;
  const { product_id, quantity, sideDish_ids = [] } = product;
  console.log(
    "Checking product in shop with shop_id:",
    shop_id,
    "and product_id:",
    product_id
  );
  await checkStockAndProductInShop({ product_id, shop_id, quantity });
  const getProduct = await getProductById(product_id);
  const sideDishes = await sideDishModel.find({
    _id: { $in: sideDish_ids },
  });
  if (sideDishes.length !== sideDish_ids.length) {
    throw new BadRequestError(`topping theo kèm của sản phẩm ${getProduct.product_name} có lỗi. Vui lòng thử lại sau`);
  }
  let totalPriceSideDish = sideDishes.reduce(
    (total, dish) => total + dish.price,
    0
  );

  const sortedSideDishIds = sideDishes
    .map((dish) => dish._id.toString())
    .sort()
    .join("-");
  const uniqueKey = sortedSideDishIds
    ? `${product_id}-${sortedSideDishIds}`
    : `${product_id}`;
  const payload = {
    cart_userId: user._id,
    cart_status: "active",
    cart_products: [
      {
        product_id,
        quantity,
        totalPrice:
          quantity * getProduct.product_price + totalPriceSideDish * quantity,
        sideDishes: sideDishes.map((dish) => ({
          sideDish_id: dish._id,
          quantity: 1,
          sideDish_name: dish.sideDish_name,
        })),
        uniqueKey,
      },
    ],
  };
  const createCart = await cartModel.create(payload);
  if (createCart) {
    await saveCartToRedis(user._id, payload);
  } else {
    throw BadRequestError("Rất tiếc, không thể thêm sản phẩm vào giỏ hàng của bạn. Vui lòng thử lại hoặc liên hệ hỗ trợ để được giúp đỡ");
  }
};
// thêm sản phẩm vào giỏ hàng trống
const addProductToEmptyCartIfAbsent = async ({ user, product, shop }) => {
  const { product_id, quantity, sideDish_ids = [] } = product;
  const shop_id = shop._id;

  await checkStockAndProductInShop({ product_id, shop_id, quantity });
  const foundCart = await getCartByUserId(user);
  const getProduct = await getProductById(product_id);

  const sideDishes = await sideDishModel.find({
    _id: { $in: sideDish_ids },
  });
  if (sideDishes.length !== sideDish_ids.length) {
    throw new BadRequestError(`topping theo kèm của sản phẩm ${getProduct.product_name} có lỗi. Vui lòng thử lại sau`);
  }
  const sortedSideDishIds = sideDishes
    .map((dish) => dish._id.toString())
    .sort()
    .join("-");
  const uniqueKey = sortedSideDishIds
    ? `${product_id}-${sortedSideDishIds}`
    : `${product_id}`;
  const payload = {
      $push: {
        cart_products: {
          product_id,
          quantity,
          totalPrice:
            (getProduct.product_price +
              sideDishes.reduce((sum, dish) => sum + dish.price, 0)) *
            quantity,
          sideDishes: sideDishes.map((dish) => ({
            sideDish_id: dish._id,
            quantity: 1,
            sideDish_name: dish.sideDish_name,
          })),
          uniqueKey,
        },
      },
    },
    options = {
      new: true,
    };
  const updateCart = await cartModel.findOneAndUpdate(
    { cart_userId: user._id },
    payload,
    options
  );

  if (!updateCart) {
    throw new BadRequestError("Rất tiếc, không thể thêm sản phẩm vào giỏ hàng của bạn. Vui lòng thử lại hoặc liên hệ hỗ trợ để được giúp đỡ");
  } else {
    await saveCartToRedis(user._id, updateCart);
  }
};
const updateCartProductQuantity = async ({ user, product, shop }) => {
  try {
    const { product_id, quantity, sideDish_ids = [] } = product;
    const shop_id = shop._id;
    // Kiểm tra tồn kho sản phẩm và số lượng yêu cầu
    await checkStockAndProductInShop({ product_id, shop_id, quantity });

    // Tìm giỏ hàng của người dùng và sản phẩm muốn thêm
    const foundCart = await getCartByUserId(user);
    const getProduct = await getProductById(product_id);

    // Lấy thông tin món phụ và kiểm tra tính hợp lệ
    const sideDishes = await sideDishModel.find({ _id: { $in: sideDish_ids } });
    if (sideDish_ids.length > 0 && sideDishes.length !== sideDish_ids.length) {
      throw new BadRequestError(`topping theo kèm của sản phẩm ${getProduct.product_name} có lỗi. Vui lòng thử lại sau`);
    }
    // tạo key
    const sortedSideDishIds = sideDishes
      .map((dish) => dish._id.toString())
      .sort()
      .join("-");
    const uniqueKey = sortedSideDishIds
      ? `${product_id}-${sortedSideDishIds}`
      : `${product_id}`;
    const existingProduct = foundCart.cart_products.find(
      (product) => product.uniqueKey === uniqueKey
    );
    if (existingProduct) {
      existingProduct.quantity += quantity;
      existingProduct.totalPrice =
        (getProduct.product_price +
          sideDishes.reduce((sum, dish) => sum + dish.price, 0)) *
        existingProduct.quantity;
    } else {
      foundCart.cart_products.push({
        product_id,
        quantity,
        totalPrice:
          (getProduct.product_price +
            sideDishes.reduce((sum, dish) => sum + dish.price, 0)) *
          quantity,
        sideDishes: sideDishes.map((dish) => ({
          sideDish_id: dish._id,
          quantity: 1,
          sideDish_name: dish.sideDish_name,
        })),
        uniqueKey,
      });
    }

    const updateCart = await cartModel.findOneAndUpdate(
      { cart_userId: user._id },
      foundCart,
      { new: true, lean: true }
    );

    if (updateCart) {
      await saveCartToRedis(user._id, foundCart);
    } else {
      throw new BadRequestError("Rất tiếc, không thể thêm sản phẩm vào giỏ hàng của bạn. Vui lòng thử lại hoặc liên hệ hỗ trợ để được giúp đỡ");
    }
  } catch (error) {
    console.log(error);
  }
};

// thêm sản phẩm vào giỏ hàng
const addTocart = async ({ user, product, shop }) => {
  const foundCart = await getCartByUserId(user);

  if (!foundCart) {
    console.log("Nếu giỏ hàng chưa tồn tại, tạo giỏ hàng mới");
    await createUserCart({ user, product, shop });
  } else if (!foundCart.cart_products) {
    console.log("Nếu giỏ hàng đã tồn tại nhưng không có sản phẩm");
    await addProductToEmptyCartIfAbsent({ user, product, shop });
  } else {
    console.log("Nếu nếu sản phẩm đã tồn tại trong giỏ hàng");
    await updateCartProductQuantity({ user, product, shop });
  }
};

// xóa sản phẩm khỏi giỏ hàng
const removeProductFromCart = async ({ user, product }) => {
  const { product_id, sideDish_ids = [] } = product;

  // Tìm giỏ hàng của người dùng
  const foundCart = await getCartByUserId(user);
  if (!foundCart) throw new NotFoundError("Có 1 chút sự cố, bạn vui lòng thử lại sau");

  // Lấy thông tin món phụ từ DB (nếu có)
  const sideDishes = await sideDishModel.find({ _id: { $in: sideDish_ids } });

  // Sắp xếp các món phụ cần xóa và tạo uniqueKey
  const sortedSideDishIds = sideDishes
    .map((dish) => dish._id.toString())
    .sort()
    .join("-");
  const uniqueKey = sortedSideDishIds
    ? `${product_id}-${sortedSideDishIds}`
    : `${product_id}`;

  // Lọc các sản phẩm trong giỏ hàng và xóa sản phẩm có `uniqueKey` trùng khớp
  foundCart.cart_products = foundCart.cart_products.filter(
    (cartProduct) => cartProduct.uniqueKey !== uniqueKey
  );

  // Cập nhật giỏ hàng sau khi xóa sản phẩm
  const updateCart = await cartModel.findOneAndUpdate(
    { cart_userId: user._id },
    foundCart,
    { new: true, lean: true }
  );

  if (updateCart) {
    await saveCartToRedis(user._id, foundCart);
  } else {
    throw new BadRequestError("Rất tiếc, không thể xóa sản phẩm khỏi giỏ hàng. Vui lòng thử lại hoặc liên hệ hỗ trợ");
  }
};
const incOfDecProductQuantity = async ({ user, product, shop, action }) => {
  const { product_id, sideDish_ids = [] } = product;
  const getProduct = await getProductById(product_id);
  // Kiểm tra dữ liệu shop có tồn tại không
  if (!shop) {
    throw new BadRequestError("Có một chút sự cố. Vui lòng thử lại sau");
  }

  const shop_id = shop._id;

  // Lấy danh sách các món phụ từ DB
  const sideDishes = await sideDishModel.find({ _id: { $in: sideDish_ids } });
  if (sideDish_ids.length > 0 && sideDishes.length !== sideDish_ids.length) {
    throw new BadRequestError(`topping theo kèm của sản phẩm ${getProduct.product_name} có lỗi. Vui lòng thử lại sau`);
  }

  // Tính tổng giá trị món phụ
  const totalPriceSideDish = sideDishes.reduce(
    (total, dish) => total + dish.price,
    0
  );

  // Kiểm tra tồn kho của sản phẩm
  await checkStockAndProductInShop({ product_id, shop_id, quantity: 1 });

  // Lấy giỏ hàng của người dùng và thông tin sản phẩm
  const foundCart = await getCartByUserId(user);


  // Tạo uniqueKey dựa trên sản phẩm và món phụ
  const sortedSideDishIds = sideDishes
    .map((dish) => dish._id.toString())
    .sort()
    .join("-");
  const uniqueKey = sortedSideDishIds
    ? `${product_id}-${sortedSideDishIds}`
    : `${product_id}`;

  // Tìm sản phẩm trong giỏ hàng bằng uniqueKey
  const findProductInCart = foundCart.cart_products.find(
    (cartProduct) => cartProduct.uniqueKey === uniqueKey
  );

  // Nếu không tìm thấy sản phẩm trong giỏ hàng, trả lỗi
  if (!findProductInCart) {
    throw new NotFoundError("Rất tiếc, đang xảy ra sự cố. Vui lòng thử lại hoặc liên hệ hỗ trợ");
  }

  // Lấy số lượng cũ và tính số lượng mới
  const oldQuantity = findProductInCart.quantity;
  let newQuantity = action === "inc" ? oldQuantity + 1 : oldQuantity - 1;

  // Nếu số lượng giảm xuống 0, xóa sản phẩm khỏi giỏ hàng
  if (newQuantity <= 0) {
    return await removeProductFromCart({ user, product });
  }

  // Cập nhật số lượng và tổng giá trị của sản phẩm trong giỏ hàng
  findProductInCart.quantity = newQuantity;
  findProductInCart.totalPrice =
    newQuantity * (getProduct.product_price + totalPriceSideDish);
  // Lưu giỏ hàng đã cập nhật vào DB
  const updateCart = await cartModel.findOneAndUpdate(
    { cart_userId: user._id },
    foundCart,
    { new: true, lean: true }
  );
  if (updateCart) {
    await saveCartToRedis(user._id, foundCart);
  } else {
    throw new BadRequestError("Rất tiếc, hệ thống đang gặp chút sự cố. Vui lòng thử lại hoặc liên hệ hỗ trợ để được giúp đỡ");
  }
};
module.exports = {
  addTocart,
  removeProductFromCart,
  incOfDecProductQuantity,
  getCartByUserId,
  getCart,
};
