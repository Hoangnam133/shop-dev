const _ = require("lodash");
const mongoose = require("mongoose");

const toObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid ObjectId format");
  }
  return new mongoose.Types.ObjectId(id); // Trả về ObjectId
};

const convertIoToObjectId = (id) => {
  return mongoose.Types.ObjectId(id);
};
const getInfoData = ({ fileds = [], object = {} }) => {
  return _.pick(object, fileds);
};
const getSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 1]));
};
const unGetSelectData = (data, select = []) => {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !select.includes(key))
  );
};
const unGetSelectListData = (data, select = []) => {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !select.includes(key))
  );
};
const getSelectListData = (data, select = []) => {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => select.includes(key))
  );
};

// const removeUndefinedObject = obj =>{
//     Object.keys(obj).forEach(k =>{
//         if(obj[k] == null){
//             delete  obj[k]
//         }
//     })
//     return obj
// }
const removeUndefinedObject = (obj) => {
  if (!obj || typeof obj !== "object") {
    return {}; // Trả về đối tượng rỗng nếu obj là null hoặc undefined
  }
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== undefined) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};
const updateNestedObjectParser = (obj) => {
  const final = {};
  Object.keys(obj).forEach((k) => {
    if (typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      const response = updateNestedObjectParser(obj[k]);
      Object.keys(response).forEach((a) => {
        final[`${k}.${a}`] = response[a];
      });
    } else {
      final[k] = obj[k];
    }
  });
  return final;
};
const isDuplicateNameOnCreate = async ({ model, fieldName, name }) => {
  const existing = await model.findOne({ [fieldName]: name });
  return !!existing;
};

const isDuplicateUpdateField = async ({
  model,
  fieldName,
  excludeId,
  value,
}) => {
  // Tìm kiếm một tài liệu có trường fieldName trùng với giá trị value và ID khác với excludeId
  const existing = await model.findOne({
    [fieldName]: value,
    _id: { $ne: excludeId },
  });
  return !!existing; // Trả về true nếu có bản ghi trùng lặp, ngược lại là false
};

module.exports = {
  getInfoData,
  getSelectData,
  unGetSelectData,
  removeUndefinedObject,
  updateNestedObjectParser,
  convertIoToObjectId,
  unGetSelectListData,
  getSelectListData,
  toObjectId,
  isDuplicateNameOnCreate,
  isDuplicateUpdateField,
};
