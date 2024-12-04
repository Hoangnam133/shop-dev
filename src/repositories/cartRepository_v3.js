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

  const sideDishes = await sideDishModel.find({
    _id: { $in: sideDish_ids },
  });
  if (sideDishes.length !== sideDish_ids.length) {
    throw new BadRequestError("One or more side dish are not valid");
  }
  const payload = {
      $push: {
        cart_products: {
          product_id,
          quantity,
          totalPrice:
          (getProduct.product_price + sideDishes.reduce((sum, dish) => sum + dish.price, 0)) *
          quantity,
          sideDishes: sideDishes.map((dish) => ({
            sideDish_id: dish._id,
            quantity: 1,
            sideDish_name: dish.sideDish_name,
          })),
        },
      },
    },
    options =  {
        new: true
       
    }
    const updateCart = await cartModel.findByIdAndUpdate(foundCart._id, payload, options)
    if(!updateCart){
        throw new BadRequestError('Add product to cart failed')
    }
    return updateCart
}
const updateCartProductQuantity = async ({ user, product, shop }) => {
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
        throw new BadRequestError('Một hoặc nhiều món phụ không hợp lệ');
    }
    // tạo key
    const sortedSideDishIds = sideDishes
        .map(dish => dish._id.toString())
        .sort()
        .join("-");
    const uniqueKey = sortedSideDishIds ? `${product_id}-${sortedSideDishIds}` : `${product_id}`;
    const existingProduct = foundCart.cart_products.find(product => product.uniqueKey === uniqueKey)
    if (existingProduct) {
      existingProduct.quantity += quantity
      existingProduct.totalPrice = 
          (getProduct.product_price + sideDishes.reduce((sum, dish) => sum + dish.price, 0)) * existingProduct.quantity
    }
    else{
        foundCart.cart_products.push({
          product_id,
          quantity,
          totalPrice:
              (getProduct.product_price + sideDishes.reduce((sum, dish) => sum + dish.price, 0)) *
              quantity,
          sideDishes: sideDishes.map(dish => ({
              sideDish_id: dish._id,
              quantity: 1,
              sideDish_name: dish.sideDish_name,
          })),
          uniqueKey,
      })
    }
  const updateCart = await foundCart.save()
  if (!updateCart) {
    throw new BadRequestError('Update cart failed');
  }
  return updateCart
};


// thêm sản phẩm vào giỏ hàng
const addTocart = async({user, product, shop}) => {
    let foundCart = await getCartByUserId(user)
    const attached = {
        path: 'cart_products.product_id',
        select: 'product_name product_thumb'
    }

    if (!foundCart) {
        console.log('Nếu giỏ hàng chưa tồn tại, tạo giỏ hàng mới')
        foundCart = await createUserCart({ user, product, shop})
        return foundCart.populate(attached)
    }

   
    if (!foundCart.cart_products.length) {
        console.log('Nếu giỏ hàng đã tồn tại nhưng không có sản phẩm')
        const updateCart = await addProductToEmptyCartIfAbsent({ user, product, shop})
        return updateCart.populate(attached)
    }
    console.log('Nếu nếu sản phẩm đã tồn tại tro giỏ hàng')
    const updateCart =  await updateCartProductQuantity({ user, product, shop})
    return  updateCart.populate(attached)
   
}

// xóa sản phẩm khỏi giỏ hàng
const removeProductFromCart = async ({ user, product }) => {
  const { product_id, sideDish_ids = [] } = product;

  // Tìm giỏ hàng của người dùng
  const foundCart = await getCartByUserId(user);
  if (!foundCart) throw new NotFoundError('Cart not found');

  // Lấy thông tin món phụ từ DB (nếu có)
  const sideDishes = await sideDishModel.find({ _id: { $in: sideDish_ids } });

  // Sắp xếp các món phụ cần xóa và tạo uniqueKey
  const sortedSideDishIds = sideDishes
      .map(dish => dish._id.toString())
      .sort()
      .join("-");
  const uniqueKey = sortedSideDishIds ? `${product_id}-${sortedSideDishIds}` : `${product_id}`;

  // Lọc các sản phẩm trong giỏ hàng và xóa sản phẩm có `uniqueKey` trùng khớp
  foundCart.cart_products = foundCart.cart_products.filter(cartProduct => cartProduct.uniqueKey !== uniqueKey);

  // Cập nhật giỏ hàng sau khi xóa sản phẩm
  const updatedCart = await foundCart.save();
  if (!updatedCart) {
      throw new BadRequestError('Failed to remove product from cart');
  }
  return updatedCart;
}
const incOfDecProductQuantity = async ({ user, product, shop, action }) => { 
  const { product_id, sideDish_ids = [] } = product;

  // Kiểm tra dữ liệu shop có tồn tại không
  if (!shop) {
      throw new BadRequestError('Shop data is missing');
  }

  const shop_id = shop._id;

  // Lấy danh sách các món phụ từ DB
  const sideDishes = await sideDishModel.find({ _id: { $in: sideDish_ids } });
  if (sideDish_ids.length > 0 && sideDishes.length !== sideDish_ids.length) {
      throw new BadRequestError('Một hoặc nhiều món phụ không hợp lệ');
  }

  // Tính tổng giá trị món phụ
  const totalPriceSideDish = sideDishes.reduce((total, dish) => total + dish.price, 0);

  // Kiểm tra tồn kho của sản phẩm
  await checkStockAndProductInShop({ product_id, shop_id, quantity: 1 });

  // Lấy giỏ hàng của người dùng và thông tin sản phẩm
  const foundCart = await getCartByUserId(user);
  const getProduct = await getProductById(product_id);

  // Tạo uniqueKey dựa trên sản phẩm và món phụ
  const sortedSideDishIds = sideDishes.map(dish => dish._id.toString()).sort().join("-");
  const uniqueKey = sortedSideDishIds ? `${product_id}-${sortedSideDishIds}` : `${product_id}`;

  // Tìm sản phẩm trong giỏ hàng bằng uniqueKey
  const findProductInCart = foundCart.cart_products.find(cartProduct => cartProduct.uniqueKey === uniqueKey);

  // Nếu không tìm thấy sản phẩm trong giỏ hàng, trả lỗi
  if (!findProductInCart) {
      throw new NotFoundError('Product not found in cart');
  }

  // Lấy số lượng cũ và tính số lượng mới
  const oldQuantity = findProductInCart.quantity;
  let newQuantity = action === 'inc' ? oldQuantity + 1 : oldQuantity - 1;

  // Nếu số lượng giảm xuống 0, xóa sản phẩm khỏi giỏ hàng
  if (newQuantity <= 0) {
      return await removeProductFromCart({ user, product });
  }

  // Cập nhật số lượng và tổng giá trị của sản phẩm trong giỏ hàng
  findProductInCart.quantity = newQuantity;
  findProductInCart.totalPrice = newQuantity * (getProduct.product_price + totalPriceSideDish);

  // Lưu giỏ hàng đã cập nhật vào DB
  const updatedCart = await foundCart.save()

  if (!updatedCart) {
      throw new BadRequestError('Error while updating cart');
  }

  return updatedCart;
}
module.exports = {
    addTocart,
    removeProductFromCart,
    incOfDecProductQuantity,
    getCartByUserId,
    getCart
}
