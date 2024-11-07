

  if (!user) {
    throw new BadRequestError("User not found");
  }
  if (!product_id) {
    throw new BadRequestError("Product_id not found");
  }
  const findProduct = await productModel.findById(product_id);
  if (!findProduct) {
    throw new NotFoundError("Product not found");
  }
  const userFavorites = await favoritesModel.findOne({
    user_id: user._id,
    product_id: product_id,
  });
  if (userFavorites) {
    await deleteProductInFavorites({ user, product_id });
  } else {
    await addFavorite({ user, product_id });
  }
};

const addFavorite = async ({ user, product_id }) => {
  const newFavorite = await favoritesModel.create({
    user_id: user._id,
    product_id: product_id,
  });
  if (!newFavorite) {
    throw new InternalServerError("Failed to add product to favorites");
  }
  return newFavorite;
};


module.exports = {
  toggleFavorite,
  getFavorite,
  deleteProductInFavorites,
};
