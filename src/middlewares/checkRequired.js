function checkRequiredFields(model) {
  return (req, res, next) => {
    const requiredFields = [];

    // Lấy các trường được đánh dấu `required` trong schema của model
    for (const [key, value] of Object.entries(model.schema.paths)) {
      if (value.options && value.options.required) {
        requiredFields.push(key);
      }
    }

    // Kiểm tra các trường bị thiếu trong yêu cầu
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
      });
    }

    next();
  };
}

module.exports = checkRequiredFields;
