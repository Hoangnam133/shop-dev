const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/locationController')
const { asynHandler } = require('../../utils/handler')
const { authentication, authorizeRoles} = require("../../auth/authUtils")
const roles = require('../../utils/roles')
//USER
router.get('/getAll', asynHandler(locationController.getAllLocation))
router.get('/getById/:location_id', asynHandler(locationController.getLocationById))
//ADMIN
router.use(authentication)
router.post('/create',authorizeRoles(roles.ADMIN),asynHandler(locationController.createLocation))
router.patch('/update/:location_id',authorizeRoles(roles.ADMIN),asynHandler(locationController.updateLocation))
router.patch('/delete/:location_id',authorizeRoles(roles.ADMIN),asynHandler(locationController.deleteLocation))
module.exports = router;
