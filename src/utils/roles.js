const dotenv = require('dotenv')
dotenv.config()
const roles = {
  ADMIN: process.env.ROLES_ADMIN,
  USER: process.env.ROLES_USER,
  EMPLOYEE: process.env.ROLES_EMPLOYEE,
  BRANCH_MANAGER: process.env.ROLES_BRANCH_MANAGER,
}
module.exports = roles
