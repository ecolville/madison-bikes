package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
)

var GeoJSON = make(map[string][]byte)

// cacheGeoJSON loads files under data into `GeoJSON`.
func cacheGeoJSON() {
	filenames, err := filepath.Glob("data/*")
	if err != nil {
		log.Fatal(err)
	}

	for _, f := range filenames {
		name := filepath.Base(f)
		dat, err := os.ReadFile(f)
		if err != nil {
			log.Fatal(err)
		}
		GeoJSON[name] = dat
	}
}

func main() {
	// Cache the JSON so it doesn't have to be reloaded every time a request is made.
	cacheGeoJSON()

	// Request for data should be handled by Go.  Everything else should be directed
	// to the folder of static files.
	http.HandleFunc("/data/dropoffs", dropoffsHandler)
	http.Handle("/", http.FileServer(http.Dir("./static/")))

	// Open up a port for the webserver.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Listening on port %s", port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func dropoffsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-type", "application/json")
	w.Write(GeoJSON["Bike_Repair_Station.geojson"])
}
