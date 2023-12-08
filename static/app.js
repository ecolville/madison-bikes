let distanceMatrixService;
let map;
let originMarker;
let infowindow;
let circles = [];
let repairStations = [];
let distCalcs = [];
let stationDistCalcs = [];
let slicedRepairStations = [];

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
  distanceMatrixService = new google.maps.DistanceMatrixService();

  // The map, centered on Madison, WI
  map = new google.maps.Map(document.querySelector("#map"), {
    center: MADISON,
    zoom: 14,
    // mapId: 'YOUR_MAP_ID_HERE', // used for optional Maps styling
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
  const url = `/data/dropoffs?centerLat=${center.lat}&centerLng=${center.lng}`;
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
    infowindow.setOptions({ pixelOffset: new google.maps.Size(0, -10) });
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
    circles.forEach((c) => c.setMap(null)); // clear existing repair staions
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

    await fetchAndRenderRepairStations(originLocation.toJSON());
    
    // Use the selected address as the origin to calculate distances
    // to each of the store locations
    await calculateDistances(originLocation, repairStations);
    renderRepairStationsPanel()
  });
};

async function calculateDistances(origin, repairStations) {
  
  // Reduce number of repairStations from entire list to rough calculation of 25 closest
    for (let i = 0; i < repairStations.length; i++){
    let a = origin.toJSON().lat - repairStations[i].geometry.coordinates[1];
    let b = origin.toJSON().lng - repairStations[i].geometry.coordinates[0];
    let c = Math.sqrt(a**2 + b**2)
    let distCalc = c;
    distCalcs.push(distCalc);

    let obj = {};
    obj = {'station': repairStations[i], 'distanceCalc': distCalc};
    stationDistCalcs.push(obj);
  }
  
  stationDistCalcs.sort((a,b) => a.distanceCalc - b.distanceCalc); // sorts by lowest to greatest distanceCalc
  const slicedStationDistCalcs = stationDistCalcs.slice(0, 25); // creates a new array of the lowest 25 

  // builds a new array of just the repairStations from the lowest 25
  slicedStationDistCalcs.forEach((element) => { slicedRepairStations.push(element.station) });

  // Retrieve the distances of each store from the origin
  // The returned list will be in the same order as the destinations list
  const response = await getDistanceMatrix({
    origins: [origin],
    destinations: slicedRepairStations.map((station) => {
      const [lng, lat] = station.geometry.coordinates;
      return { lat, lng };
    }),
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.METRIC,
  });
  response.rows[0].elements.forEach((element, index) => {
    slicedRepairStations[index].properties.distanceText = element.distance.text;
    slicedRepairStations[index].properties.distanceValue = element.distance.value;
  });
}

const getDistanceMatrix = (request) => {
  return new Promise((resolve, reject) => {
    const callback = (response, status) => {
      if (status === google.maps.DistanceMatrixStatus.OK) {
        resolve(response);
      } else {
        reject(response);
      }
    };
    distanceMatrixService.getDistanceMatrix(request, callback);
  });
};

function renderRepairStationsPanel() {
  const panel = document.getElementById("panel");

  if (slicedRepairStations.length == 0) {
    panel.classList.remove("open");
    return;
  }

  // Clear the previous panel rows
  while (panel.lastChild) {
    panel.removeChild(panel.lastChild);
  }
  slicedRepairStations
    .sort((a, b) => a.properties.distanceValue - b.properties.distanceValue)
    .forEach((station) => {
      panel.appendChild(stationToPanelRow(station));
    });
  // Open the panel
  panel.classList.add("open");
  panel.insertAdjacentHTML("beforebegin",'<div id="pac-title">Locations sorted by distance</div>');
  return;
}

const stationToPanelRow = (station) => {
  // Add station details with text formatting
  const rowElement = document.createElement("div");
  const nameElement = document.createElement("p");
  nameElement.classList.add("place");
  nameElement.textContent = station.properties.Description;
  rowElement.appendChild(nameElement);
  const distanceTextElement = document.createElement("p");
  distanceTextElement.classList.add("distanceText");
  distanceTextElement.textContent = station.properties.distanceText;
  rowElement.appendChild(distanceTextElement);
  return rowElement;
};
