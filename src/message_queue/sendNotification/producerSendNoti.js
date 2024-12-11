const amqp = require('amqplib');

const runProducerNoti = async (payload) => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        const queue_name = 'notification_queue'; 
        await channel.assertQueue(queue_name, { durable: true });

     
        const message = JSON.stringify(payload);
        channel.sendToQueue(queue_name, Buffer.from(message));
        console.log(`Message sent: ${message}`);


        await channel.close();
        await connection.close();
    } catch (error) {
        console.log(`Error: ${error}`);
    }
}
module.exports = {
    runProducerNoti
}
