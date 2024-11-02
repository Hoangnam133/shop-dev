const JWT = require("jsonwebtoken");
const {
  Unauthorized,
  BadRequestError,
  NotFoundError,
} = require("../core/errorResponse");
const dotenv = require("dotenv");
const keyTokenService = require("../services/keyTokenService");
dotenv.config();
const { asynHandler } = require("../utils/handler");
const { findById } = require("../repositories/userRepository");
const shopModel = require("../models/shopModel");
const HEADER = {
  AUTHORIZATION: "authorization",
  REFRESHTOKEN: "x_rtoken_id",
};
const { toObjectId } = require("../utils/index");
const { isNull } = require("lodash");
const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    const accessToken = JWT.sign(payload, publicKey, { expiresIn: "2 days" });
    const refreshToken = JWT.sign(payload, privateKey, { expiresIn: "7 days" });
    JWT.verify(accessToken, publicKey, (err, decoded) => {
      if (err) {
        console.log("Error verifying access token:", err);
      } else {
        console.log("Access token decoded:", decoded);
      }
    });
    return { accessToken, refreshToken };
  } catch (error) {
    console.log("Error creating token pair:", error);
    throw new Error("Token creation failed");
  }
};

const authentication = asynHandler(async (req, res, next) => {
  const accessToken = req.headers[HEADER.AUTHORIZATION];
  if (!accessToken) {
    throw new Unauthorized("Unauthorized - No access token provided");
  }
  const token = accessToken;
  try {
    const decoded = JWT.verify(token, process.env.PUBLIC_KEY);

    const existingUser = await findById(decoded.userId);
    if (!existingUser) {
      throw new BadRequestError("Access token invalid - User not found");
    }

    const findKeyStore = await keyTokenService.findByUserId(decoded.userId);
    if (!findKeyStore) {
      throw new NotFoundError("KeyStore not found for this user");
    }

    let shop = "";
    if (decoded.shop_id && mongoose.Types.ObjectId.isValid(decoded.shop_id)) {
      const findShop = await shopModel.findById(decoded.shop_id);
      if (!findShop) {
        throw new NotFoundError("Not found shop");
      }
      shop = findShop;
    }

    req.shop = shop;
    req.keyStore = findKeyStore;
    req.user = existingUser;

    next();
  } catch (error) {
    console.log("Authentication error:", error);
    throw new Unauthorized("Invalid access token");
  }
});

const handleRefreshToken = asynHandler(async (req, res, next) => {
  const refreshToken = req.headers[HEADER.REFRESHTOKEN];
  if (!refreshToken)
    throw new Unauthorized("Unauthorized - No refresh token provided");
  const token = refreshToken;
  try {
    const decoded = JWT.verify(token, process.env.PRIVATE_KEY);
    const userId = decoded.userId;
    const existingUser = await findById(userId);
    if (!existingUser) throw new BadRequestError("User not found");

    const findKeyStore = await keyTokenService.findByUserId(decoded.userId);
    if (!findKeyStore) {
      throw new NotFoundError("KeyStore not found for this user");
    }

    req.keyStore = findKeyStore;
    req.refreshToken = token;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.log("Authentication error:", error);
    throw new Unauthorized("Invalid refresh token");
  }
});

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.roles)) {
      return next(new Unauthorized("forbidden"));
    }
    next();
  };
};

module.exports = {
  createTokenPair,
  authentication,
  authorizeRoles,
  handleRefreshToken,
};
