package models

import "github.com/mmcloughlin/geohash"

type Viewport struct {
	SWLat float64 `json:"swLat"`
	SWLon float64 `json:"swLon"`
	NELat float64 `json:"neLat"`
	NELon float64 `json:"neLon"`
	Zoom  float64 `json:"zoom"`
}

func geohashPrecisionForZoom(zoom float64) uint {
	switch {
	case zoom < 3:
		return 1
	case zoom < 5:
		return 2
	case zoom < 7:
		return 3
	case zoom < 9:
		return 4
	case zoom < 11:
		return 5
	case zoom < 13:
		return 6
	case zoom < 15:
		return 7
	case zoom < 17:
		return 8
	default:
		return 9
	}
}

func GeohashPrefixesForViewport(v Viewport) []string {
	precision := geohashPrecisionForZoom(v.Zoom)
	return cellsCoveringViewport(v, precision)
}

// cellsCoveringViewport samples the four corners and the centre of the
// viewport at the given precision and returns the distinct geohash cells.
func CellsCoveringViewport(v Viewport, precision uint) []string {
	centreLat := (v.SWLat + v.NELat) / 2
	centreLon := (v.SWLon + v.NELon) / 2

	candidates := []string{
		geohash.EncodeWithPrecision(v.SWLat, v.SWLon, precision),
		geohash.EncodeWithPrecision(v.SWLat, v.NELon, precision),
		geohash.EncodeWithPrecision(v.NELat, v.SWLon, precision),
		geohash.EncodeWithPrecision(v.NELat, v.NELon, precision),
		geohash.EncodeWithPrecision(centreLat, centreLon, precision),
	}

	seen := make(map[string]struct{}, len(candidates))
	unique := make([]string, 0, len(candidates))
	for _, c := range candidates {
		if _, ok := seen[c]; ok {
			continue
		}
		seen[c] = struct{}{}
		unique = append(unique, c)
	}
	return unique
}

func InViewport(lat, lon float64, v Viewport) bool {
	if lat < v.SWLat || lat > v.NELat {
		return false
	}
	if v.SWLon <= v.NELon {
		return lon >= v.SWLon && lon <= v.NELon
	}
	// Antimeridian crossing.
	return lon >= v.SWLon || lon <= v.NELon
}
