const amqp = require('amqplib');
const OrderService = require('../../services/orderService');

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
                    // Nhận và log tin nhắn từ hàng đợi
                    const orderData = JSON.parse(msg.content.toString());
                    console.log(`Received order: ${JSON.stringify(orderData)}`);

                    // Gọi service để xử lý đơn hàng
                    await OrderService.checkOutByUser(orderData);

                    // Xác nhận tin nhắn đã được xử lý thành công
                    channel.ack(msg);
                    console.log('Message acknowledged and order processed successfully');

                } catch (error) {
                    // Xử lý lỗi trong quá trình tiêu thụ tin nhắn
                    console.error('Error processing order:', error);
                    // Có thể không gọi `ack` để giữ tin nhắn lại cho lần xử lý sau
                }
            }
        }, {
            noAck: false // Đảm bảo rằng thông điệp sẽ không bị xóa cho đến khi đã được xử lý
        });
    } catch (error) {
        console.error(`Error initializing consumer: ${error}`);
    }
};

runConsumer();
