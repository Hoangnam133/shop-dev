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
// Kiểm tra giỏ hàng xem tồn tại hay không
const getCartByUserId = async (user) => {
  if (!user) throw new NotFoundError("User not found");

  const foundCart = await cartModel.findOne({ cart_userId: user._id });

  // if (!foundCart) throw new NotFoundError('Cart not found')

  return foundCart;
};
const getCart = async (user) => {
  if (!user) throw new NotFoundError("User not found");

  const foundCart = await cartModel
    .findOne({ cart_userId: user._id })
    .populate({
      path: "cart_products.product_id",
      select: "product_name product_thumb",
    });

  // if (!foundCart) throw new NotFoundError('Cart not found')

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
    throw new NotFoundError("Product not found in shop");
  }
  // kiểm tra sản phẩm xem có đủ số lượng để thêm vào giỏ hàng hay không
  const checkQuantityProduct = await checkProductStockInShop({
    shop_id,
    product_id,
    quantity,
  });
  if (!checkQuantityProduct) {
    throw new BadRequestError("Not enough product in stock");
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
  const sideDishs = await sideDishModel.find({
    _id: { $in: sideDish_ids },
  });
  if (sideDishs.length !== sideDish_ids.length) {
    throw new BadRequestError("One or more side dish are not valid");
  }
  let totalPriceSideDish = sideDishs.reduce(
    (total, dish) => total + dish.price,
    0
  );
  const payload = {
    cart_userId: user._id,
    cart_status: "active",
    cart_products: [
      {
        product_id,
        quantity,
        totalPrice:
          quantity * getProduct.product_price + totalPriceSideDish * quantity,
        sideDishes: sideDishs.map((dish) => ({
          sideDish_id: dish._id,
          quantity: 1,
          sideDish_name: dish.sideDish_name,
        })),
      },
    ],
  };

  const createCart = await cartModel.create(payload);
  if (!createCart) {
    throw new BadRequestError("Create cart failed");
  }

  return createCart;
};
// thêm sản phẩm vào giỏ hàng trống
const addProductToEmptyCartIfAbsent = async ({ user, product, shop }) => {
  const { product_id, quantity, sideDish_ids = [] } = product;
  const shop_id = shop._id;

  await checkStockAndProductInShop({ product_id, shop_id, quantity });
  const foundCart = await getCartByUserId(user);
  const getProduct = await getProductById(product_id);

  const sideDishs = await sideDishModel.find({
    _id: { $in: sideDish_ids },
  });
  if (sideDishs.length !== sideDish_ids.length) {
    throw new BadRequestError("One or more side dish are not valid");
  }
  let totalPriceSideDish = 0;
  for (let i = 0; i < sideDishs.length; i++) {
    totalPriceSideDish += sideDishs[i].price;
  }
  const payload = {
      $push: {
        cart_products: {
          product_id,
          quantity,
          totalPrice:
            quantity * getProduct.product_price + totalPriceSideDish * quantity,
          sideDishes: sideDishs.map((dish) => ({
            sideDish_id: dish._id,
            quantity: 1,
            sideDish_name: dish.sideDish_name,
          })),
        },
      },
    },
    options = {
      new: true,
    };
  const updateCart = await cartModel.findByIdAndUpdate(
    foundCart._id,
    payload,
    options
  );
  if (!updateCart) {
    throw new BadRequestError("Add product to cart failed");
  }
  return updateCart;
};
const updateCartProductQuantity = async ({ user, product, shop }) => {
  const { product_id, quantity, sideDish_ids = [] } = product;
  const shop_id = shop._id;

  await checkStockAndProductInShop({ product_id, shop_id, quantity });
  const foundCart = await getCartByUserId(user);
  const getProduct = await getProductById(product_id);

  const sideDishes = await sideDishModel.find({
    _id: { $in: sideDish_ids },
  });
  if (sideDishes.length !== sideDish_ids.length) {
    throw new BadRequestError("One or more side dishes are not valid");
  }

  let totalPriceSideDish = 0;
  for (let i = 0; i < sideDishes.length; i++) {
    totalPriceSideDish += sideDishes[i].price;
  }

  // Chuẩn hóa danh sách món phụ để dễ so sánh
  const sortedNewSideDishes = sideDishes
    .map((dish) => dish._id.toString())
    .sort();

  // Tìm sản phẩm có cùng product_id và sideDishes trong giỏ hàng
  let findProductInCart = foundCart.cart_products.find(
    (product) =>
      product.product_id.toString() === product_id.toString() &&
      product.sideDishes
        .map((d) => d.sideDish_id.toString())
        .sort()
        .every((id, index) => id === sortedNewSideDishes[index])
  );

  if (findProductInCart) {
    // Cập nhật số lượng nếu món phụ trùng khớp
    console.log(" chạy vào // Cập nhật số lượng nếu món phụ trùng khớp");
    const newQuantity = findProductInCart.quantity + quantity;
    const newTotalPrice =
      newQuantity * getProduct.product_price + newQuantity * totalPriceSideDish;

    const payload = {
      $set: {
        "cart_products.$[elem].quantity": newQuantity,
        "cart_products.$[elem].totalPrice": newTotalPrice,
      },
    };
    const options = {
      arrayFilters: [
        {
          "elem.product_id": product_id,
          "elem.sideDishes": { $size: sortedNewSideDishes.length }, // Ensures the correct count of side dishes
          "elem.sideDishes.sideDish_id": { $all: sortedNewSideDishes }, // Matches sideDish_id values directly
        },
      ],
      new: true,
    };

    const updateCart = await cartModel.findOneAndUpdate(
      { _id: foundCart._id },
      payload,
      options
    );
    if (!updateCart) {
      throw new BadRequestError("Update product quantity in cart failed");
    }
    return updateCart;
  }

  // Nếu món phụ khác nhau hoặc sản phẩm chưa tồn tại trong giỏ, thêm sản phẩm mới
  console.log(
    " chạy vào // Nếu món phụ khác nhau hoặc sản phẩm chưa tồn tại trong giỏ, thêm sản phẩm mới"
  );
  const payload = {
    $push: {
      cart_products: {
        product_id,
        quantity,
        totalPrice:
          quantity * getProduct.product_price + totalPriceSideDish * quantity,
        sideDishes: sideDishes.map((dish) => ({
          sideDish_id: dish._id,
          quantity: 1,
          sideDish_name: dish.sideDish_name,
        })),
      },
    },
  };
  const options = { new: true };
  const filter = { _id: foundCart._id };

  const updateCart = await cartModel.findOneAndUpdate(filter, payload, options);
  if (!updateCart) {
    throw new BadRequestError("Add product to cart failed");
  }
  return updateCart;
};

// thêm sản phẩm vào giỏ hàng
const addTocart = async ({ user, product, shop }) => {
  let foundCart = await getCartByUserId(user);
  const attached = {
    path: "cart_products.product_id",
    select: "product_name product_thumb",
  };

  if (!foundCart) {
    console.log(" chạy vào //// Nếu giỏ hàng chưa tồn tại, tạo giỏ hàng mới");
    foundCart = await createUserCart({ user, product, shop });
    return foundCart.populate(attached);
  }

  if (!foundCart.cart_products.length) {
    console.log(" chạy vào // Nếu giỏ hàng đã tồn tại nhưng không có sản phẩm");
    const updateCart = await addProductToEmptyCartIfAbsent({
      user,
      product,
      shop,
    });
    return updateCart.populate(attached);
  }
  console.log(" chạy vào // Nếu nếu sản phẩm đã tồn tại trogn giỏ hàng");
  return await updateCartProductQuantity({ user, product, shop });
};

// xóa sản phẩm khỏi giỏ hàng
const deleteProductInCart = async ({ user, product }) => {
  const { product_id } = product;
  await getCartByUserId(user);
  const filter = {
      cart_userId: toObjectId(user._id),
      cart_status: "active",
    },
    update = {
      $pull: {
        cart_products: {
          product_id: toObjectId(product_id),
        },
      },
    },
    options = {
      new: true,
    };
  const deleteItem = await cartModel.findOneAndUpdate(filter, update, options);

  if (!deleteItem) {
    throw new BadRequestError("Failed to remove the product from the cart");
  }
  return deleteItem;
};
const incOfDecProductQuantity = async ({ user, product, shop, action }) => {
  if (!shop) {
    throw new BadRequestError("Shop data is missing");
  }

  const { product_id } = product;
  const shop_id = shop._id;

  await checkStockAndProductInShop({ product_id, shop_id, quantity: 1 });
  const foundCart = await getCartByUserId(user);
  const getProduct = await getProductById(product_id);

  const findProductInCart = foundCart.cart_products.find(
    (product) => product.product_id.toString() === product_id.toString()
  );
  if (!findProductInCart) {
    throw new NotFoundError("Product not found in cart");
  }

  const oldQuantity = findProductInCart.quantity;
  let newQuantity = 0;
  if (action === "inc") {
    newQuantity = oldQuantity + 1;
  } else {
    newQuantity = oldQuantity - 1;
    if (newQuantity <= 0) {
      // Nếu số lượng giảm xuống 0, xóa sản phẩm khỏi giỏ hàng
      return await deleteProductInCart({ user, product });
    }
  }

  const payload = {
    $set: {
      "cart_products.$.quantity": newQuantity,
      "cart_products.$.totalPrice": newQuantity * findProductInCart.totalPrice,
    },
  };
  const options = { new: true };
  const filter = {
    _id: foundCart._id,
    "cart_products.product_id": product_id,
  };

  const updateCart = await cartModel
    .findOneAndUpdate(filter, payload, options)
    .populate({
      path: "cart_products.product_id",
      select: "product_name product_thumb",
    });
  if (!updateCart) {
    throw new BadRequestError("Update product quantity in cart failed");
  }
  return updateCart;
};

module.exports = {
  addTocart,
  deleteProductInCart,
  incOfDecProductQuantity,
  getCartByUserId,
  getCart,
};
