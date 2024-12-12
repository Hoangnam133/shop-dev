const express = require("express");
const { authentication, authorizeRoles } = require("../../auth/authUtils");
const router = express.Router();

const orderControllerV5 = require("../../controllers/orderControllerV5");
const roles = require("../../utils/roles");

const { asynHandler } = require("../../utils/handler");
// all stores
router.get(
  "/getStatisticsOfShop",authentication,authorizeRoles(roles.BRANCH_MANAGER,roles.EMPLOYEE),
  asynHandler(orderControllerV5.getStatisticsOfShop)
);
router.get(
  "/getBestSellingProductsOfShop",authentication,authorizeRoles(roles.BRANCH_MANAGER,roles.EMPLOYEE),
  asynHandler(orderControllerV5.getBestSellingProductsOfShop)
);
router.get("/getCategorySalesOfShop",authentication,authorizeRoles(roles.BRANCH_MANAGER,roles.EMPLOYEE),
   asynHandler(orderControllerV5.getCategorySalesOfShop));

router.get(
  "/getCategorySales",
  asynHandler(orderControllerV5.getCategorySales)
);
router.get(
  "/getBestSellingProducts",
  asynHandler(orderControllerV5.getBestSellingProducts)
);
router.get("/getStatistics", asynHandler(orderControllerV5.getStatistics));

// branch
router.get(
  "/getTotalRevenueInShop/:shop_id",
  asynHandler(orderControllerV5.getTotalRevenueInShop)
);
router.get(
  "/listBestSellingProductsInShop/:shop_id",
  asynHandler(orderControllerV5.listBestSellingProductsInShop)
);
router.use(authentication);
router.get(
  "/getOrderDetail/:order_id",
  asynHandler(orderControllerV5.getOrderDetail)
);

router.get(
  "/getTotalRevenueInShop/:shop_id",
  asynHandler(orderControllerV5.getTotalRevenueInShop)
);

router.get(
  "/listBestSellingProductsInShop/:shop_id",
  asynHandler(orderControllerV5.listBestSellingProductsInShop)
);
router.use(authentication);
router.get(
  "/getOrderDetail/:order_id",
  asynHandler(orderControllerV5.getOrderDetail)
);

router.patch(
  "/cancelOrder/:order_id",
  asynHandler(orderControllerV5.cancelOrder)
);
router.post("/checkoutPreview", asynHandler(orderControllerV5.checkoutPreview));
router.post("/checkout", asynHandler(orderControllerV5.checkout));

router.get(
  "/listOrderCancelledOfUser",
  asynHandler(orderControllerV5.listOrderCancelledOfUser)
);
router.get(
  "/listOrderCompletedOfUser",
  asynHandler(orderControllerV5.listOrderCompletedOfUser)
);
router.get(
  "/listOrderPendingOfUser",
  asynHandler(orderControllerV5.listOrderPendingOfUser)
);
router.get(
  "/listOrderSuccessOfUser",
  asynHandler(orderControllerV5.listOrderSuccessOfUser)
);

router.use(authorizeRoles(roles.EMPLOYEE));
router.patch(
  "/updateStatusCompleted/:order_id",
  asynHandler(orderControllerV5.updateStatusCompleted)
);
router.patch(
  "/updateStatusCancelled/:order_id",
  asynHandler(orderControllerV5.updateStatusCancelled)
);
router.patch(
  "/updateStatusSuccess/:order_id",
  asynHandler(orderControllerV5.updateStatusSuccess)
);
router.get(
  "/listOrderPending",
  asynHandler(orderControllerV5.listOrderPending)
);
router.get(
  "/listOrderCompleted",
  asynHandler(orderControllerV5.listOrderCompleted)
);
router.get(
  "/listOrderCancelled",
  asynHandler(orderControllerV5.listOrderCancelled)
);
router.get(
  "/listOrderSuccess",
  asynHandler(orderControllerV5.listOrderSuccess)
);

module.exports = router;
