const amqp = require('amqplib');
const OrderService = require('../../services/orderService_v6');
const orderModel = require('../../models/orderModel')
const {deductStockAfterPayment} = require('../../repositories/inventoryRepository')
const {BadRequestError} = require('../../core/errorResponse')
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
                  
                    const newOrder = await orderModel.create(orderData);
                    if(!newOrder){
                        throw new BadRequestError('order creation failed')
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
