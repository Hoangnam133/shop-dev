const amqp = require('amqplib');
const {BadRequestError} = require('../../core/errorResponse')
const { sendNotification } = require("../../utils/notification");
const runConsumerNoti = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        const queue_name = 'notification_queue';

        await channel.assertQueue(queue_name, { durable: true });

        console.log('Waiting for messages in %s. To exit press CTRL+C', queue_name);

        channel.consume(queue_name, async (msg) => {
            if (msg !== null) {
                try{
                    const dataNoti = JSON.parse(msg.content.toString())
                    console.log(`Received notification: ${JSON.stringify(dataNoti)}`);
                    await sendNotification(dataNoti.deviceToken, dataNoti.title, dataNoti.body, dataNoti.data)
                    channel.ack(msg);
                    console.log('Message acknowledged and Notification processed successfully');
                }catch (error) {
                    console.error('Error processing order:', error);
                }
            }
        }, {
            noAck: false 
        });
    } catch (error) { 
        console.error(`Error initializing consumer: ${error}`);
    }
};

module.exports = {
    runConsumerNoti
}
