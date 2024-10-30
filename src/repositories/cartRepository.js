const { NotFoundError, BadRequestError } = require('../core/errorResponse');
const cartModel = require('../models/cartModel');
const productModel = require('../models/productModel');
const inventoryModel = require('../models/inventoryModel');

const checkQuantityProduct = async (product) => {
    const { productId, quantity } = product;

    const foundProduct = await productModel.findById(productId).lean();
    if (!foundProduct) throw new NotFoundError('Product not found');

    const foundInventory = await inventoryModel.findOne({ inven_productId: productId });
    if (!foundInventory) throw new NotFoundError('Product not found in inventory');

    if (quantity > foundInventory.inven_stock) {
        throw new BadRequestError('The quantity of product requested exceeds the quantity in stock.');
    }

    return foundProduct;
};

const findProductInCart = async ({ userId, productId }) => {
    return await cartModel.findOne({
        cart_userId: userId,
        'cart_products.productId': productId,
        cart_status: 'active'
    }).lean();
};

const createCart = async ({ user, product }) => {
    const { productId, quantity } = product;

    const foundProduct = await productModel.findById(productId).lean();
    if (!foundProduct) throw new NotFoundError('Product not found');

    const payload = {
        cart_userId: user._id,
        cart_status: 'active',
        cart_products: [{
            productId: foundProduct._id,
            name: foundProduct.product_name,
            quantity,
            totalPrice: quantity * foundProduct.product_price,
            product_thumb: foundProduct.product_thumb,
        }]
    };

    const newCart = await cartModel.create(payload);
    if (!newCart) throw new BadRequestError('Create cart failed');

    return newCart;
};

const getCartByUser = async ({ user }) => {
    if (!user) throw new BadRequestError('User data missing');

    const existingCart = await cartModel.findOne({ cart_userId: user._id }).lean();
    if (!existingCart) throw new NotFoundError('Cart not found');

    return existingCart;
};

const updateProductQuantityInCart = async ({ user, product }) => {
    const { productId, quantity } = product;

    const foundProduct = await productModel.findById(productId).lean();
    if (!foundProduct) throw new NotFoundError('Product not found');

    const userCart = await cartModel.findOne({
        cart_userId: user._id,
        cart_status: 'active',
        'cart_products.productId': productId
    }).lean();

    if (!userCart) throw new NotFoundError('Cart not found');

    const productInCart = userCart.cart_products.find(p => p.productId.toString() === productId.toString());
    if (!productInCart) throw new NotFoundError('Product not found in cart');

    const newQuantity = productInCart.quantity + quantity;

    const foundInventory = await inventoryModel.findOne({ inven_productId: productId });
    if (!foundInventory || newQuantity > foundInventory.inven_stock) {
        throw new BadRequestError('The quantity of product requested exceeds the quantity in stock.');
    }
    
    const update = {
        $set: {
            'cart_products.$.quantity': newQuantity,
            'cart_products.$.totalPrice': newQuantity * foundProduct.product_price,
            'cart_products.$.product_thumb': foundProduct.product_thumb,
            'cart_products.$.name': foundProduct.product_name,
        }
    };

    const updatedCart = await cartModel.findOneAndUpdate(
        { cart_userId: user._id, cart_status: 'active', 'cart_products.productId': productId },
        update,
        { new: true, lean: true }
    );

    if (!updatedCart) throw new NotFoundError('Product not found in cart');
    return updatedCart;
};

const insertNewProductInCart = async ({ userCart, product }) => {
    const { productId, quantity } = product;

    const checkProduct =  await checkQuantityProduct(product);

    const updatedCart = await cartModel.findByIdAndUpdate(
        userCart._id,
        {
            $push: {
                cart_products: {
                    productId,
                    name: checkProduct.product_name,
                    quantity,
                    totalPrice: checkProduct.product_price * quantity,
                    product_thumb: checkProduct.product_thumb,
                }
            }
        },
        { new: true, lean: true }
    );

    return updatedCart;
};

const addToCart = async ({ user, product }) => {
    if (!product) throw new BadRequestError('Product data is missing');

    const { productId, quantity } = product;

    const foundProduct = await productModel.findById(productId).lean();
    if (!foundProduct) throw new NotFoundError('Product not found');

    const productInStock = await inventoryModel.findOne({ inven_productId: productId });
    if (!productInStock) throw new NotFoundError('Inventory record not found for the product');

    const userCart = await cartModel.findOne({
        cart_userId: user._id,
        cart_status: 'active'
    }).lean();

    if (!userCart) {
        return await createCart({ user, product });
    }

    const productInCart = userCart.cart_products.find(p => p.productId.toString() === productId.toString());
    if (productInCart) {
        if ((quantity + productInCart.quantity) > productInStock.inven_stock) {
            throw new BadRequestError('Excess quantity in stock');
        }
        return await updateProductQuantityInCart({ user, product });
    } else {
        return await insertNewProductInCart({ userCart, foundProduct, product });
    }
};

const deleteProductCart = async ({ user, product }) => {
    const { productId } = product;

    const updatedCart = await cartModel.findOneAndUpdate(
        { cart_userId: user._id, cart_status: 'active' },
        { $pull: { cart_products: { productId } } },
        { new: true, lean: true }
    );

    if (!updatedCart) throw new NotFoundError('Product not found in cart');
    return updatedCart;
};

const fillQuantityInBlank = async ({ user, product }) => {
    if (!product) throw new BadRequestError('Product data is missing');

    const { productId, newQuantity } = product;

    const foundProduct = await productModel.findById(productId).lean();
    if (!foundProduct) throw new NotFoundError('Product not found');

    const productInStock = await inventoryModel.findOne({ inven_productId: productId });
    if (!productInStock || newQuantity > productInStock.inven_stock) {
        throw new BadRequestError('Excess quantity in stock');
    }

    // Ensure the product exists in the user's cart
    const userCart = await cartModel.findOne({
        cart_userId: user._id,
        cart_status: 'active',
        'cart_products.productId': productId
    }).lean();

    if (!userCart) throw new NotFoundError('Cart not found');

    
    const cart = await cartModel.findOneAndUpdate(
        { cart_userId: user._id, cart_status: 'active', 'cart_products.productId': productId },
        {
            $set: {
                'cart_products.$.quantity': newQuantity,
                'cart_products.$.totalPrice': newQuantity * foundProduct.product_price,
                'cart_products.$.product_thumb': foundProduct.product_thumb,
                'cart_products.$.name': foundProduct.product_name
            }
        },
        { new: true, lean: true }
    );

    if (!cart) throw new NotFoundError('Cart not found');
    return cart;
};


module.exports = {
    checkQuantityProduct,
    findProductInCart,
    createCart,
    getCartByUser,
    updateProductQuantityInCart,
    insertNewProductInCart,
    addToCart,
    deleteProductCart,
    fillQuantityInBlank,
};
