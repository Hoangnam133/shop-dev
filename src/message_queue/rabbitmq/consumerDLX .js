const amqp = require('amqplib');

const runConsumerDLX = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        
        const notification_exchange_DLX = 'notifications_exchange_DLX'; // Dead letter exchange
        const notification_queue_DLX = 'notifications_queue_DLX'; // Queue cho DLX
        
        // Tạo queue cho DLX
        await channel.assertQueue(notification_queue_DLX, {
            durable: true
        });

        // Bind queue với DLX
        await channel.bindQueue(notification_queue_DLX, notification_exchange_DLX, '');

        console.log(`Waiting for messages in ${notification_queue_DLX}. To exit press CTRL+C`);

        channel.consume(notification_queue_DLX, (message) => {
            if (message !== null) {
                console.log(`Received message from DLX: ${message.content.toString()}`);
                // Xác nhận tin nhắn
                channel.ack(message);
            }
        });
    } catch (error) {
        console.log(`error::: ${error}`);
    }
};

runConsumerDLX().catch(console.error);
