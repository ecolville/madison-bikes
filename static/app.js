let distanceMatrixService;
let map;
let originMarker;
let infowindow;
let circles = [];
let repairStations = [];
// The location of Madison, WI
const MADISON = { lat: 43.0722, lng: -89.4008 };

async function initialize() {
  initMap();

  // Add an info window that pops up when user clicks on an individual
  // location. Content of info window is entirely up to us.
  infowindow = new google.maps.InfoWindow();

  // Fetch and render repair stations as circles on map
  fetchAndRenderRepairStations(MADISON);

  // Initialize the Places Autocomplete Widget
  initAutocompleteWidget();
}

const initMap = () => {
  // TODO: Start Distance Matrix service

  // The map, centered on Madison, WI
  map = new google.maps.Map(document.querySelector("#map"), {
    center: MADISON,
    zoom: 14,
    // mapId: 'YOUR_MAP_ID_HERE',
    clickableIcons: false,
    fullscreenControl: false,
    mapTypeControl: false,
    rotateControl: true,
    scaleControl: false,
    streetViewControl: true,
    zoomControl: true,
  });
};

const fetchAndRenderRepairStations = async (center) => {
  // Fetch the repair stations from the data source
  repairStations = (await fetchRepairStations(center)).features;

  // Create circular markers based on the repair stations
  circles = repairStations.map((station) => stationToCircle(station, map, infowindow));
};

const fetchRepairStations = async (center) => {
  const url = `/data/dropoffs`;
  const response = await fetch(url);
  return response.json();
};

const stationToCircle = (station, map, infowindow) => {
  const coordinates = station.geometry.coordinates;
  const lat = coordinates[1];
  const lng = coordinates[0];

  const circle = new google.maps.Circle({
    radius: 50,
    strokeColor: "#88429d",
    strokeOpacity: 0.8,
    strokeWeight: 5,
    center: { lat, lng },
    map,
  });
  circle.addListener("click", () => {
    // Create the content string for the infowindow
    const contentString = `
      <div>
        <p><strong>Description:</strong> ${station.properties.Description}</p>
        <p><strong>Owner:</strong> ${station.properties.Owner}</p>
        <p><a href="${station.properties.File_Path}" target="_blank">View Image</a></p>
      </div>
    `;

    infowindow.setContent(contentString);
    infowindow.setPosition({ lat, lng });
    infowindow.open(map);
  });

  return circle;
};

const initAutocompleteWidget = () => {
  // Add search bar for auto-complete
  // Build and add the search bar
  const placesAutoCompleteCardElement = document.getElementById("pac-card");
  const placesAutoCompleteInputElement = placesAutoCompleteCardElement.querySelector(
    "input"
  );
  const options = {
    types: ["address"],
    componentRestrictions: { country: "us" },
    map,
  };
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(
    placesAutoCompleteCardElement
  );
  // Make the search bar into a Places Autocomplete search bar and select
  // which detail fields should be returned about the place that
  // the user selects from the suggestions.
  const autocomplete = new google.maps.places.Autocomplete(
    placesAutoCompleteInputElement,
    options
  );
  autocomplete.setFields(["address_components", "geometry", "name"]);
  map.addListener("bounds_changed", () => {
    autocomplete.setBounds(map.getBounds());
  });

  // Respond when a user selects an address
  // Set the origin point when the user selects an address
  originMarker = new google.maps.Marker({ map: map });
  originMarker.setVisible(false);
  let originLocation = map.getCenter();
  autocomplete.addListener("place_changed", async () => {
    // circles.forEach((c) => c.setMap(null)); // clear existing stores
    originMarker.setVisible(false);
    originLocation = map.getCenter();
    const place = autocomplete.getPlace();

    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No address available for input: '" + place.name + "'");
      return;
    }
    // Recenter the map to the selected address
    originLocation = place.geometry.location;
    map.setCenter(originLocation);
    map.setZoom(15);
    originMarker.setPosition(originLocation);
    originMarker.setVisible(true);

    // await fetchAndRenderStores(originLocation.toJSON());
    // TODO: Calculate the closest stores
  });
};