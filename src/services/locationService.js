const {createLocation,
    getAllLocations,
    getLocationById,
    updateLocationById,
    deleteLocationById,} = require('../repositories/locatitonRepository')

class LocationService {
    static async createLocation({payload, user}) {
        return await createLocation(payload)
    }
    static async getAllLocations() {
        return await getAllLocations()
    }
    static async getLocationById(locationId) {
        return await getLocationById(locationId)
    }
    static async updateLocationById({location_id, payload, user}) {
        return await updateLocationById({location_id, payload, user})
    }
    static async deleteLocationById({location_id, user}) {
        return await deleteLocationById(location_id)
    }
    

}

module.exports = LocationService