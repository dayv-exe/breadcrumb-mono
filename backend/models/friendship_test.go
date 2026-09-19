package models

import (
	"backend/constants"
	"backend/utils"
	"testing"
)

func TestNewFriendship(t *testing.T) {
	current := User{
		UserDisplayInfo: UserDisplayInfo{
			Userid:   "user-1",
			Name:     "Alice",
			Nickname: "Al",
		},
		UserPersonalInfo: UserPersonalInfo{
			ProfilePicture: CrumbMedia{ThumbnailKey: "alice.jpg"},
		},
	}
	other := User{
		UserDisplayInfo: UserDisplayInfo{
			Userid:   "user-2",
			Name:     "Bob",
			Nickname: "Bobby",
		},
		UserPersonalInfo: UserPersonalInfo{
			ProfilePicture: CrumbMedia{ThumbnailKey: "bob.jpg"},
		},
	}

	forCurrent, forOther := NewFriendship(current, other, 0)

	// Friendship on the current user's side describes the OTHER user.
	if forCurrent.FriendId != other.Userid ||
		forCurrent.Name != other.Name ||
		forCurrent.Nickname != other.Nickname ||
		forCurrent.PictureUrl != other.ProfilePicture.ThumbnailKey {
		t.Errorf("current side mapped wrong user: %+v", forCurrent)
	}

	// Reciprocal side describes the CURRENT user.
	if forOther.FriendId != current.Userid ||
		forOther.Name != current.Name ||
		forOther.Nickname != current.Nickname ||
		forOther.PictureUrl != current.ProfilePicture.ThumbnailKey {
		t.Errorf("reciprocal side mapped wrong user: %+v", forOther)
	}

	// Both sides share one timestamp and are created active.
	if forCurrent.Timestamp != forOther.Timestamp {
		t.Errorf("timestamps differ: %d vs %d", forCurrent.Timestamp, forOther.Timestamp)
	}
	if forCurrent.Status != constants.FRIENDSHIP_STATUS_ACTIVE ||
		forOther.Status != constants.FRIENDSHIP_STATUS_ACTIVE {
		t.Error("status should be active")
	}
}

func TestApplyPrefixes(t *testing.T) {
	utils.ResolveAuthenticatedUserForTesting("user-1")

	f := &Friendship{FriendId: "friend-9", Timestamp: 1700000000}
	f.ApplyPrefixes()

	if want := "USER#user-1"; f.Pk != want {
		t.Errorf("Pk = %q, want %q", f.Pk, want)
	}
	if want := "FRIENDSHIP_TIMESTAMP#1700000000FRIEND_ID#friend-9"; f.Sk != want {
		t.Errorf("Sk = %q, want %q", f.Sk, want)
	}
	if want := "USER#user-1"; f.Gsi != want {
		t.Errorf("Gsi = %q, want %q", f.Gsi, want)
	}
	if want := "FRIEND_ID#friend-9FRIENDSHIP_TIMESTAMP#1700000000"; f.GsiSk != want {
		t.Errorf("GsiSk = %q, want %q", f.GsiSk, want)
	}
}
