const amqp = require('amqplib');
const orderModel = require('../../models/orderModel')
const userModel = require('../../models/userModel')
const rewardSettingModel = require('../../models/rewardSettingModel')
const {deductStockAfterPayment} = require('../../repositories/inventoryRepository')
const {BadRequestError} = require('../../core/errorResponse')
const {deleteCartToRedis} = require('../../redisDB/redisCart')
const cartModel = require('../../models/cartModel')
const runConsumer = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        const queue_name = 'order_queue';

        await channel.assertQueue(queue_name, { durable: true });

        console.log('Waiting for messages in %s. To exit press CTRL+C', queue_name);

        channel.consume(queue_name, async (msg) => {
            if (msg !== null) {
                try {
                 
                    const orderData = JSON.parse(msg.content.toString());
                    console.log(`Received order: ${JSON.stringify(orderData)}`);
                    const {orderInfo, shop_id} = orderData;
                    const newOrder = await orderModel.findByIdAndUpdate(
                        orderInfo, 
                        { 
                          "order_payment.payment_status": "Success" 
                        }, 
                        { new: true } 
                      );
                    if(!newOrder){
                        throw new BadRequestError('order creation failed')
                    }
                    await deleteCartToRedis(newOrder.order_userId)
                    const foundCart = await cartModel.findOne({
                        cart_userId: newOrder.order_userId
                    })
                    if (foundCart) {
                        const updateCart = await cartModel.findByIdAndUpdate(foundCart._id,
                            { $set: { cart_products: [] } },{
                               new: true,
                               lean: true
                           })
                        if (!updateCart) {
                            throw new BadRequestError('Failed to update cart')
                        }
                    }
                    
                    for(const product of newOrder.order_product){
                        const updateStock = await deductStockAfterPayment({shop_id, product_id: product.product_id, quantity: product.quantity})
                        if(!updateStock){
                            throw new BadRequestError('Failed to deduct stock')
                        }
                    }
                    const rewardSetting = await rewardSettingModel.findOne({ isActive: true });
                    let pointsEarned = 0;
                    if (rewardSetting) {
                      const pointRate = rewardSetting.pointRate;
                      pointsEarned = Math.floor(newOrder.order_checkout.finalPrice * pointRate);
                    }
                    const updatePoint = await userModel.findByIdAndUpdate(newOrder.order_userId,{
                        $inc: { points: pointsEarned } 
                    })
                    if (!updatePoint) {
                        throw new BadRequestError('Update user points failed')
                    }
                    channel.ack(msg);
                    console.log('Message acknowledged and order processed successfully');

                    // channel.nack(msg, false, false); // Xóa tin nhắn khỏi hàng đợi
                    // console.log('Message removed from queue due to error');
                } catch (error) {
                
                    console.error('Error processing order:', error);
        
                }
            }
        }, {
            noAck: false // Đảm bảo rằng thông điệp sẽ không bị xóa cho đến khi đã được xử lý
        });
    } catch (error) {
        console.error(`Error initializing consumer: ${error}`);
    }
};

module.exports = {
    runConsumer
}
