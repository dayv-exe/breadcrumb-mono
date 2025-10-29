package utils

import (
	"github.com/mmcloughlin/geohash"
)

func GPSToHash(lat, lon float64, precision uint) string {
	return geohash.EncodeWithPrecision(lat, lon, precision)
}

func GPSToHashAuto(lat, lon float64) string {
	return geohash.Encode(lat, lon)
}

func DecodeHash(hash string) (lat, lon float64) {
	return geohash.Decode(hash)
}

func GetHashBounds(hash string) (minLat, maxLat, minLon, maxLon float64) {
	box := geohash.BoundingBox(hash)
	return box.MinLat, box.MaxLat, box.MinLng, box.MaxLng
}

func GetNeighbors(hash string) []string {
	neighbors := []string{
		hash,
		geohash.Neighbor(hash, geohash.North),
		geohash.Neighbor(hash, geohash.South),
		geohash.Neighbor(hash, geohash.East),
		geohash.Neighbor(hash, geohash.West),
		geohash.Neighbor(hash, geohash.NorthEast),
		geohash.Neighbor(hash, geohash.NorthWest),
		geohash.Neighbor(hash, geohash.SouthEast),
		geohash.Neighbor(hash, geohash.SouthWest),
	}
	return neighbors
}
