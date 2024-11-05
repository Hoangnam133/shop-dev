const cartModel = require('../models/cartModel')
const {checkProductStockInShop} = require('../repositories/inventoryRepository')
const {checkProductInShop, getProductById} = require('../repositories/productRepository')
const {NotFoundError, BadRequestError} = require('../core/errorResponse')
const {toObjectId} = require('../utils/index')
/*
    1. create cart and add product to cart
    2. reduce product quantity
    3. increase product quantity
    4. get cart
    6. delete item
    7. update quantity product in cart
    8. delete cart (delete all items)
*/
// Kiểm tra giỏ hàng xem tồn tại hay không
const getCartByUserId  = async(user) => {
    if (!user) throw new NotFoundError('User not found');
    
    const foundCart = await cartModel.findOne({ cart_userId: user._id })
  
    // if (!foundCart) throw new NotFoundError('Cart not found')

    return foundCart
}
const checkStockAndProductInShop = async({product_id, shop_id, quantity})=>{
    // kiểm tra sản phẩm có nằm trong shop này hay không
    const checkProduct = await checkProductInShop(shop_id, product_id)
    if(!checkProduct){
        throw new NotFoundError('Product not found in shop')
    }
    // kiểm tra sản phẩm xem có đủ số lượng để thêm vào giỏ hàng hay không
    const checkQuantityProduct = await checkProductStockInShop({shop_id, product_id, quantity})
    if(!checkQuantityProduct){
        throw new BadRequestError('Not enough product in stock')
    }
}
// tạo giỏ hàng 
const createUserCart = async({user, product, shop})=>{
    const shop_id = shop._id
    const {product_id, quantity} = product
    console.log('Checking product in shop with shop_id:', shop_id, 'and product_id:', product_id);
    await checkStockAndProductInShop({product_id, shop_id, quantity})
    const getProduct = await getProductById(product_id)

    const payload = {
        cart_userId: user._id,
        cart_status: 'active',
        cart_products:[{
                product_id,
                quantity,
                totalPrice: quantity * getProduct.product_price
        }]
    }

    const createCart = await cartModel.create(payload)
    if(!createCart){
        throw new BadRequestError('Create cart failed')
    }

    return createCart
}
// thêm sản phẩm vào giỏ hàng trống
const addProductToEmptyCartIfAbsent = async({user, product, shop})=>{
    const {product_id, quantity} = product
    const shop_id = shop._id

    await checkStockAndProductInShop({product_id, shop_id, quantity})
    const foundCart = await getCartByUserId (user)
    const getProduct = await getProductById(product_id)
    const payload = {
        $push: {
            cart_products: {
                product_id,
                quantity,
                totalPrice: quantity * getProduct.product_price
            }
        }
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
// cập nhật lại số lượng trong giỏ hàng
const updateCartProductQuantity =  async({user, product, shop})=>{
    const {product_id, quantity} = product
    const shop_id = shop._id

    await checkStockAndProductInShop({product_id, shop_id, quantity})
    const foundCart = await getCartByUserId (user)
    const getProduct = await getProductById(product_id)
    console.log('giỏ hàng fffdfdf', foundCart.cart_products)
    const findProductInCart = foundCart.cart_products.find(product => product.product_id.toString() === product_id.toString())
    if(!findProductInCart){
        throw new NotFoundError('Product not found in cart')
    }

    const oldQuantity = findProductInCart.quantity
    ,newQuantity = oldQuantity + quantity
    ,newTotalPrice = newQuantity *  getProduct.product_price

    const payload = {
        $set: {
            'cart_products.$.quantity': newQuantity,
            'cart_products.$.totalPrice': newTotalPrice
        }
    },
    options =  {
        new: true
       
    },
    filter = {
        _id: foundCart._id,
        'cart_products.product_id': product_id
    }
    const updateCart = await cartModel.findOneAndUpdate(filter, payload, options)
    if(!updateCart){
        throw new BadRequestError('Update product quantity in cart failed')
    }
    return updateCart
}
// thêm sản phẩm vào giỏ hàng
const addTocart = async({user, product, shop}) => {
    let foundCart = await getCartByUserId(user)
    const attached = {
        path: 'cart_products.product_id',
        select: 'product_name product_thumb'
    }
    // Nếu giỏ hàng chưa tồn tại, tạo giỏ hàng mới
    if (!foundCart) {
        foundCart = await createUserCart({ user, product, shop })
        return foundCart.populate(attached)
    }

    // Nếu giỏ hàng đã tồn tại nhưng không có sản phẩm
    if (!foundCart.cart_products.length) {
        const updateCart =  await addProductToEmptyCartIfAbsent({ user, product, shop })
        return updateCart.populate(attached)
    }

    // Nếu giỏ hàng đã tồn tại và đã có sản phẩm, cập nhật lại số lượng
    const updateQuantity = await updateCartProductQuantity({ user, product, shop })
    return updateQuantity.populate(attached)
};

// xóa sản phẩm khỏi giỏ hàng
const deleteProductInCart = async({user, product})=>{
    const {product_id} = product
    await getCartByUserId (user)
    const filter = {
        cart_userId: toObjectId(user._id),
        cart_status: 'active'
    },
    update = {
        $pull: {
            cart_products: {
                product_id: toObjectId(product_id)
            }
        }
    },
    options = {
        new: true
       
    }
    const deleteItem = await cartModel.findOneAndUpdate(filter, update, options)

    if(!deleteItem){
        throw new BadRequestError('Failed to remove the product from the cart')
    }
    return deleteItem
}
const incOfDecProductQuantity = async({user, product, shop, action})=>{

    const {product_id} = product
    const {shop_id} = shop._id
    
    console.log('incOfProductQuantity shopId', shop_id)
    await checkStockAndProductInShop({product_id, shop_id, quantity: 1})
    const foundCart = await getCartByUserId (user)
    const getProduct = await getProductById(product_id)

    const findProductInCart = foundCart.cart_products.find(product => product.product_id.toString() === product_id.toString())
    if(!findProductInCart){
        throw new NotFoundError('Product not found in cart')
    }

    const oldQuantity = findProductInCart.quantity
    let newQuantity = 0
    if(action === 'inc'){
        newQuantity = oldQuantity + 1
    }
    else{
        newQuantity = oldQuantity - 1
        if(newQuantity <= 0){
            await deleteProductInCart({user, product})
        }
    }

    const payload = {
        $set: {
            'cart_products.$.quantity': newQuantity,
            'cart_products.$.totalPrice': newQuantity * getProduct.product_price
        }
    },
    options =  {
        new: true
        
    }

    const updateCart = await cartModel.findByIdAndUpdate(foundCart._id, payload, options)
    if(!updateCart){
        throw new BadRequestError('Update product quantity in cart failed')
    }
    return await updateCart
}
module.exports = {
    addTocart,
    deleteProductInCart,
    incOfDecProductQuantity,
    getCartByUserId
}