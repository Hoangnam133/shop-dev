const calculateDistance = ({ userLat, userLon, facilityLat, facilityLon }) => {
  const toRad = (value) => (value * Math.PI) / 180; // Chuyển độ sang radian
  const R = 6371; // Bán kính Trái Đất (km)

  console.log("Inputs: ", { userLat, userLon, facilityLat, facilityLon });

  const dLat = toRad(facilityLat - userLat);
  const dLon = toRad(facilityLon - userLon);

  console.log("Delta Lat/Lon: ", { dLat, dLon });

  const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLat)) * Math.cos(toRad(facilityLat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

  console.log("Intermediate value (a): ", a);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  console.log("Intermediate value (c): ", c);

  const distance = R * c; // Khoảng cách (km)
  console.log("Calculated distance----------------------------------------------: ", distance);
  return distance;
};

module.exports = {
    calculateDistance
}
  