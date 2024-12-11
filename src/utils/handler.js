const asynHandler = (fn) => {
  console.log("fdasfdasd");

  return (req, res, next) => {
    console.log("dsafafdsafd");

    fn(req, res, next).catch(next);
  };
};
module.exports = {
  asynHandler,
};
