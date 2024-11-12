function checkRequiredFields(model) {
  return (req, res, next) => {
    const requiredFields = [];

    // Duyệt qua các path của schema để lấy các trường có thuộc tính `required`
    for (const [key, value] of Object.entries(model.schema.paths)) {
      if (value.isRequired) requiredFields.push(key);
    }

    // Lọc các trường bị thiếu trong yêu cầu
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
