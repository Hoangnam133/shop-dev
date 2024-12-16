const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
const path = require("path");
const {
  syncProductsToElasticsearch,
} = require("../src/configs/syncDataToElasticsearch");
const { runConsumer } = require("../src/message_queue/rabbitmq/consumer");
const {
  runConsumerNoti,
} = require("../src/message_queue/sendNotification/consumerSendNoti");

const { initRedis } = require("../src/redisDB/initRedis_docker");
//const admin = require('../src/configs/firebaseConfig')

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use("/uploads", express.static("uploads")); // init mongodb
require("./configs/initMongodb");

app.use("/", require("./routers/index"));

// handler error
runConsumer();
runConsumerNoti();
initRedis();
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    status: "error",
    code: statusCode,
    stack: error.stack,
    message: error.message || "Internal Server Error",
  });
});
const syncData = async () => {
  try {
    console.log("Đang đồng bộ dữ liệu từ MongoDB lên Elasticsearch...");
    await syncProductsToElasticsearch();
    console.log("Đồng bộ thành công.");
  } catch (error) {
    console.error("Lỗi đồng bộ:", error);
  }
};
syncData();
module.exports = app;
