//Global variables
let map, infowindow, originMarker, userCurrentLocation;
let distanceMatrixService, directionsService, directionsRenderer;
let markers = [], repairStations = [], distCalcs = [], stationDistCalcs = [], slicedRepairStations = [];

//The location of Madison, WI
const MADISON = { lat: 43.0722, lng: -89.4008 };

//set map styles
const mapStyles = [
  {
    featureType: "poi", // Points of interest
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "transit", // Transit stations
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "road", // Roads
    elementType: "labels", // Only the labels on roads
    stylers: [{ visibility: "off" }]
  },
  // Add more rules as needed
];

// Initialization function
async function initialize() {
  initMap();
  initAutocompleteWidget();   
  initGeolocationWidget();
  await fetchAndRenderRepairStations(MADISON);
  setupEventListeners();
}

function setupEventListeners() {
  const destinationSelect = document.getElementById('destination-select');
  if (destinationSelect) {
    destinationSelect.addEventListener('change', function() {
      const selectedStationIndex = this.value;
      if (selectedStationIndex && userCurrentLocation) {
        const station = repairStations[selectedStationIndex];
        calculateRouteToStation(userCurrentLocation, station);
      } else {
        window.alert("Please select a repair station and ensure your location is known.");
      }
    });
  }
}

const pacCard = document.getElementById("pac-card");
const panel = document.getElementById("panel");
if (pacCard && panel) {
    const pacCardHeight = pacCard.offsetHeight;
    panel.style.top = `${pacCardHeight + 70}px`; // 20px for some margin
    panel.style.display = "block";
}

// Initialize the application after DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);

// Initialize the map
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
      center: MADISON,
      zoom: 14,
      styles: mapStyles,
      clickableIcons: false,
      fullscreenControl: false,
      mapTypeControl: false,
      rotateControl: true,
      scaleControl: false,
      streetViewControl: true,
      zoomControl: true,
  });

  infowindow = new google.maps.InfoWindow();
  originMarker = new google.maps.Marker({ map: map, visible: false });
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);
  distanceMatrixService = new google.maps.DistanceMatrixService();
}

// Function to fetch and render repair stations
async function fetchAndRenderRepairStations(location) {
  // Fetch the repair stations from the data source
  repairStations = (await fetchRepairStations(location)).features;
  
  // Clear existing markers
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  // Create markers based on the repair stations
  repairStations.forEach(station => {
    const marker = stationToMarker(station, map, infowindow);
    if (marker instanceof google.maps.Marker) { // Ensure it's a valid object
      markers.push(marker);
    } else {
      console.error('Invalid marker object created:', marker);
    }
  });
};

// Function to fetch repair stations
async function fetchRepairStations (center) {
  const url = `/data/dropoffs?centerLat=${center.lat}&centerLng=${center.lng}`;
  const response = await fetch(url);
  return response.json();
};

// Function to create a marker for each station
function stationToMarker(station, map, infowindow) {
  const coordinates = station.geometry.coordinates;
  const lat = coordinates[1];
  const lng = coordinates[0];

  const defaultIcon = {
    url: "bike_icon.png",
    scaledSize: new google.maps.Size(25, 25), 
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(15, 15)
  };

  const enlargedIcon = {
    url: "bike_icon.png",
    scaledSize: new google.maps.Size(35, 35), // Larger size
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(15, 15)
  };

  const marker = new google.maps.Marker({
    position: { lat, lng },
    map: map,
    icon: defaultIcon
  });

  // Mouseover event listener to enlarge the icon
  marker.addListener("mouseover", () => {
    marker.setIcon(enlargedIcon);
  });

  // Store the station's unique identifier in the marker
  marker.stationId = station.properties.OBJECTID;

  // Mouseover event listener to highlight corresponding row in the panel
  marker.addListener("mouseover", () => {
    marker.setIcon(enlargedIcon);
    highlightPanelRow(marker.stationId, true); // Highlight the row
  });

  // Mouseout event listener to unhighlight corresponding row in the panel
  marker.addListener("mouseout", () => {
    marker.setIcon(defaultIcon);
    highlightPanelRow(marker.stationId, false); // Unhighlight the row
    });

  // Mouseout event listener to revert the icon size
  marker.addListener("mouseout", () => {
    marker.setIcon(defaultIcon);
  });

  marker.addListener("click", () => {
    if (userCurrentLocation) {
      calculateRouteToStation(userCurrentLocation, station);
    }
    //Create and open the info window for this marker
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
  return marker;
};

function highlightPanelRow(stationId, highlight) {
  console.log("Highlighting Station ID:", stationId, "Highlight:", highlight);
  const panelRows = document.querySelectorAll('.station-row');
  panelRows.forEach(row => {
    if (row.dataset.stationId == stationId) { // Ensure to use == for comparison
      if (highlight) {
        row.style.backgroundColor = 'grey'; // Set the background color for highlighting
      } else {
        row.style.backgroundColor = ''; // Reset the background color
      }
    }
  });
}

// Function to initialize autocomplete widget
function initAutocompleteWidget() {
  // Build and add the autocomplete search bar
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
    markers.forEach((c) => c.setMap(null)); // clear existing repair staions
    originMarker.setVisible(false);
    
    const place = autocomplete.getPlace();
    document.getElementById("panel").style.display = "block";

    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No address available for input: '" + place.name + "'");
      return;
    }

    // Update userCurrentLocation with the selected address
    userCurrentLocation = place.geometry.location.toJSON(); // Convert to a plain object

    // Recenter the map to the origin marker
    map.setCenter(userCurrentLocation);
    map.setZoom(15);
    originMarker.setPosition(userCurrentLocation);
    originMarker.setVisible(true);

    await fetchAndRenderRepairStations(userCurrentLocation);
    
    // Recalculate distances with the new origin
    await calculateDistances(userCurrentLocation, repairStations);
    renderRepairStationsPanel();
  });
}

//Function to handle distance calculations
async function calculateDistances(origin, repairStations) {

   // Check if origin is a LatLng object and convert to a plain object if necessary
   const originCoords = origin instanceof google.maps.LatLng ? origin.toJSON() : origin;

  // Reduce number of repairStations from entire list to rough calculation of 25 closest
  for (let i = 0; i < repairStations.length; i++) {
    let a = originCoords.lat - repairStations[i].geometry.coordinates[1];
    let b = originCoords.lng - repairStations[i].geometry.coordinates[0];
    let c = Math.sqrt(a**2 + b**2); // Pythagorean calculation
    let distCalc = c;
    distCalcs.push(distCalc);

    let obj = {'station': repairStations[i], 'distanceCalc': distCalc};
    stationDistCalcs.push(obj);
  }
  
  stationDistCalcs.sort((a,b) => a.distanceCalc - b.distanceCalc); // sorts by lowest to greatest distanceCalc
  const slicedStationDistCalcs = stationDistCalcs.slice(0, 25); // creates a new array of the lowest 25 

  // builds a new array of just the repairStations (station object only) from the array of station & distance calc objects using the lowest 25 distance calcs
  slicedStationDistCalcs.forEach((element) => { slicedRepairStations.push(element.station) });

  // Retrieve the distances of each store from the origin
  // The returned list will be in the same order as the destinations list
  const response = await getDistanceMatrix({
    origins: [origin],
    destinations: slicedRepairStations.map((station) => {
      const [lng, lat] = station.geometry.coordinates;
      return { lat, lng };
    }),
    travelMode: google.maps.TravelMode.BICYCLING,
    unitSystem: google.maps.UnitSystem.IMPERIAL,
  });
  response.rows[0].elements.forEach((element, index) => {
    slicedRepairStations[index].properties.distanceText = element.distance.text;
    slicedRepairStations[index].properties.distanceValue = element.distance.value;
  });
}

// Promise wrapper for distance matrix service
function getDistanceMatrix (request) {
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

//Function to render repair stations panel
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
  panel.appendChild(panelTitle());
  slicedRepairStations
    .sort((a, b) => a.properties.distanceValue - b.properties.distanceValue)
    .forEach((station) => {
      panel.appendChild(stationToPanelRow(station));
    });
  // Open the panel
  panel.classList.add("open");

  return;
}

//Function to create title for the repair stations panel
function panelTitle() {
  const rowElement = document.createElement("div");
  const nameElement = document.createElement("p");
  nameElement.classList.add("panel-title");
  nameElement.textContent = "Bicycle Repair Stations by distance to address";
  rowElement.appendChild(nameElement)
  return rowElement;
};

function stationToPanelRow(station, index) {
  // Add station details with text formatting
  const rowElement = document.createElement("div");
  rowElement.classList.add("station-row");
  rowElement.setAttribute("data-station-index", index);
  rowElement.dataset.stationId = station.properties.OBJECTID;

  const nameElement = document.createElement("p");
  nameElement.classList.add("place");
  nameElement.textContent = station.properties.Description;
  rowElement.appendChild(nameElement);

  const distanceTextElement = document.createElement("p");
  distanceTextElement.classList.add("distanceText");
  distanceTextElement.textContent = station.properties.distanceText;
  rowElement.appendChild(distanceTextElement);

  // Add click event listener to each row
  rowElement.addEventListener('click', () => {
    if (userCurrentLocation) {
      calculateRouteToStation(userCurrentLocation, station);
    } else {
      alert('Please set your current location first.');
    }
  });
  return rowElement;
};

//Function to initialize geolocation widget
function initGeolocationWidget() {
  let locationButton = document.getElementById("location-button");
  if (!locationButton) {
    locationButton = document.createElement("button");
    locationButton.id = "location-button";
    locationButton.textContent = "Use current location?";
  locationButton.classList.add("custom-map-control-button");
  document.getElementById("pac-card").appendChild(locationButton);
  
  // Respond when a user selects the geolocation button
  locationButton.addEventListener("click", () => {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          //store the user's current position
          const userCurrentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        
          console.log("Location found");
          //infoWindow.setContent("Location found.");        
        
          // Make the panel visible
          document.getElementById("panel").style.display = "block";
        },
        async() => {
          //put the pos value in the address bar
          //need to convert lat lang to an address
          
          markers.forEach((c) => c.setMap(null)); // clear existing repair staions
          originMarker.setVisible(false);
          originLocation = map.getCenter();
          const place = autocomplete.getPlace();
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
        },
      );
    } else {
      // Browser doesn't support Geolocation
      window.alert(
        browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation.",
      );
    }
  });
}
};

// Function to calculate the route to the selected station
function calculateRouteToStation(origin, station) {
  const destination = {
    lat: station.geometry.coordinates[1],
    lng: station.geometry.coordinates[0]
  };

  directionsService.route({
    origin: origin,
    destination: destination,
    travelMode: google.maps.TravelMode.BICYCLING 
  }, function(response, status) {
    if (status === 'OK') {
      directionsRenderer.setDirections(response);
    } else {
      console.error('Directions request failed due to ' + status);
      window.alert('Directions request failed due to ' + status);
    }
  });
}

// Event listener for station selection
document.getElementById('destination-select').addEventListener('change', function() {
  const selectedStationIndex = this.value;
  if (selectedStationIndex && userCurrentLocation) {
    const station = repairStations[selectedStationIndex];
    calculateRouteToStation(userCurrentLocation, station);
  } else {
    window.alert("Please select a repair station and ensure your location is known.");
  }
});