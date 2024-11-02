const {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocationById,
  deleteLocationById,
} = require("../repositories/locatitonRepository");

class LocationService {
  static async createLocation({ payload, user }) {
    return await createLocation({ payload, user });
  }
  static async getAllLocations() {
    return await getAllLocations();
  }
  static async getLocationById({ location_id }) {
    return await getLocationById({ location_id });
  }
  static async updateLocationById({ location_id, payload, user }) {
    return await updateLocationById({ location_id, payload, user });
  }
  static async deleteLocationById({ location_id, payload, user }) {
    return await deleteLocationById({ location_id, payload, user });
  }
}

module.exports = LocationService;
