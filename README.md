# Madison CycleCare: Your Guide to Bike Repair 

Madison CycleCare is a web application that allows users to easily find bicycle repair stations in the Madison, Wisconsin area. Bicycle Repair stations are shown on an easy to use web-map so the user can browse locations. Users can also type in an address to calculate which stations are closest, and preview the Google Maps cycling-route directions suggested to each of these stations. CycleCare makes it easy for cyclists in Madison to get to a convenient repair station.

![Madison CycleCare App Screenshot](https://github.com/ecolville/madison-bikes/blob/main/screenshots/Interactions.png)

## Features

- **Interactive Web Map**: Navigate the Madison, Wisconsin area with the familiar Google Maps user-interface.
- **Smart Autocomplete Search for Addresses**: The App uses Google Maps API for smart lookup of nearby addresses with an autocomplete for easier use.
- **Data imported through API**: Bicycle Repair Stations imported via an API call to the City of Madison's data portal which stores data in a **geojson and local cache for efficient client-end use.**
- **Real-time navigation to Bicycle Repair Stations**: Uses Google Maps to calculate real-time directions and directions-based distances to Bicycle Repair Stations, with linked interactions between side panel and map displays.
- **Handy Reference Links to Related Information**: Information on how simple bicycle repair and related City of Madison links are provided.

![Madison CycleCare Autocomplete](https://github.com/ecolville/madison-bikes/blob/main/screenshots/Autocomplete.png)
![Madison CycleCare Linked Directions](https://github.com/ecolville/madison-bikes/blob/main/screenshots/LinkedDirections.png)
![Madison CycleCare About and Tips](https://github.com/ecolville/madison-bikes/blob/main/screenshots/AboutAndTips.png)

## Prerequisites

- Web Browser: A modern web browser that supports JavaScript and ES6+ features. Recommended: Chrome, Firefox, Safari, or Edge.
- The code above is built with Go and Google App Engine in mind. Learn more about this here: [https://cloud.google.com/appengine/docs/standard/go/building-app](https://cloud.google.com/appengine/docs/go)
- The code above will have to be modified to run with other Google Cloud Products such as Google Cloud Run.

## Usage 

1. **Navigate the Map to View Madison Bicycle Repair Stations**: Click around on the web-map to view Bicycle Repair Stations around the City of Madison. The map responds with familiar UI - zoom with the + and - buttons, the scroll wheel, or pinch a touch screen; pan with a mouse click or by moving a touch screen.
2. **Enter an Address to Calculate Distances**: Enter an address to use as the start location. The Application will use the Google Maps distance calcultion service to calculate distance from this start location to the 25 closest as the end distances. These distances will be listed on the right panel in order of smallest to greatest.
3. **Use Current Location to Calculate Distances**: Select the button to use current location and the Application will use the Google Maps geolocation service to find the current location of the user's device. Then the distance calculation will run using current location as a starting location.
4. **View Related Information**: Select the About & Tips button to see related information and links.

## Full-Stack Development Tools 

This App is built on the following tools:

1. Google App Engine
2. Google Maps API
3. Go - Google back-end/server-side language
4. HTML, CSS, and JavaScript - front-end design

## Data Sources 

- **Google Maps**: Provides map backgrounds, user-interface, data handling (displays points on the map), Geolocation, Directions, and Distance calculation services.
- **City of Madison Bicycle Repair Stations**: A regularly updated dataset provided by the City of Madison, hosted here: https://data-cityofmadison.opendata.arcgis.com/datasets/cityofmadison::bike-repair-station/about.

## Acknowledgments 

- Thanks to this wonderful codelabs tutorial that walks through back-end development with Google Maps API: https://developers.google.com/codelabs/maps-platform/full-stack-store-locator#0.

## Authors
- Lisa Siewert & Jessica Steslow UW-Madison GEOG 576 Final Project
