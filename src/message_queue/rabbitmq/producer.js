const amqp = require('amqplib');
const orderModel = require('../../models/orderModel');

const runProducer = async (payload) => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        const queue_name = 'order_queue'; // Đặt tên hàng đợi cho đơn hàng
        await channel.assertQueue(queue_name, { durable: true });

     
        const message = JSON.stringify(payload);
        channel.sendToQueue(queue_name, Buffer.from(message));
        console.log(`Message sent: ${message}`);

        // Đóng kết nối
        await channel.close();
        await connection.close();
    } catch (error) {
        console.log(`Error: ${error}`);
    }
}
module.exports = {
    runProducer
}
