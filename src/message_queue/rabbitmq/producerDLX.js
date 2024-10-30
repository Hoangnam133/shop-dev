const amqp = require('amqplib');
const message = 'hello, rabbitmq for shop mobile';

const runProducerDLX = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        
        const notification_exchange = 'notifications_exchange'; // notification exchange direct
        const notification_queue = 'notifications_queue_process'; // assert queue 
        const notification_exchange_DLX = 'notifications_exchange_DLX'; // dead letter exchange
        const notification_routingkey_DLX = 'notifications_routingKey_DLX'; // routing key

        // Tạo Dead Letter Exchange
        await channel.assertExchange(notification_exchange_DLX, 'direct', {
            durable: true
        });

        // Tạo Queue cho notification
        await channel.assertQueue(notification_queue, {
            durable: true,
            deadLetterExchange: notification_exchange_DLX // Gán DLX cho queue này
        });

        // Bind queue với exchange
        await channel.bindQueue(notification_queue, notification_exchange, '');

        // Gửi tin nhắn vào queue
        channel.sendToQueue(notification_queue, Buffer.from(message), {
            persistent: true // Đảm bảo tin nhắn không bị mất
        });

        console.log(`message sent: ${message}`);
        
        // Đóng kết nối sau khi gửi tin nhắn
        setTimeout(() => {
            connection.close();
        }, 500);
    } catch (error) {
        console.log(`error::: ${error}`);
    }
};

runProducerDLX().catch(console.error);
