package models

import "testing"

func TestCellsCoveringViewport_Small(t *testing.T) {
	v := Viewport{
		SWLat: 50.90,
		SWLon: -1.45,
		NELat: 50.95,
		NELon: -1.40,
		Zoom:  12,
	}
	hashes := GeohashPrefixesForViewport(v)
	if len(hashes) == 0 {
		t.Fatal("expected hashes")
	}
}

func TestInViewport_Antimeridian(t *testing.T) {
	v := Viewport{
		SWLat: -10,
		SWLon: 170,
		NELat: 10,
		NELon: -170,
	}
	if !InViewport(0, 175, v) {
		t.Fatal("expected 175 to be inside")
	}
	if !InViewport(0, -175, v) {
		t.Fatal("expected -175 to be inside")
	}
	if InViewport(0, 0, v) {
		t.Fatal("expected 0 to be outside")
	}
}
