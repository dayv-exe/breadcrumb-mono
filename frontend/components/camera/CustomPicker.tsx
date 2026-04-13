import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type PickerAsset = {
  id: string;
  uri: string; // thumbnail/source uri from MediaLibrary
  mediaType: MediaLibrary.MediaTypeValue;
  duration?: number;
};

const NUM_COLUMNS = 3;
const PAGE_SIZE = 60;

export default function CustomMediaPicker({
  onDone,
  maxSelection = 10,
}: {
  onDone: (files: { assetId: string; uri: string; mediaType: string }[]) => void;
  maxSelection?: number;
}) {
  const [hasPerm, setHasPerm] = useState<boolean | null>(null);
  const [assets, setAssets] = useState<PickerAsset[]>([]);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);

  const [selected, setSelected] = useState<Map<string, PickerAsset>>(new Map());
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPerm(status === "granted");
    })();
  }, []);

  useEffect(() => {
    if (hasPerm) {
      void loadNextPage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPerm]);

  const selectedCount = selected.size;

  const loadNextPage = async (reset = false) => {
    if (loadingPage) return;
    if (!hasNextPage && !reset) return;

    setLoadingPage(true);
    try {
      const page = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        first: PAGE_SIZE,
        after: reset ? undefined : endCursor ?? undefined,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      const next = page.assets.map((a) => ({
        id: a.id,
        uri: a.uri,
        mediaType: a.mediaType,
        duration: a.duration,
      }));

      setAssets((prev) => (reset ? next : [...prev, ...next]));
      setEndCursor(page.endCursor ?? null);
      setHasNextPage(page.hasNextPage);
    } finally {
      setLoadingPage(false);
    }
  };

  const toggleSelect = (a: PickerAsset) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(a.id)) {
        next.delete(a.id);
        return next;
      }
      if (next.size >= maxSelection) return next;
      next.set(a.id, a);
      return next;
    });
  };

  const selectedList = useMemo(() => Array.from(selected.values()), [selected]);

  const resolveToLocalFiles = async () => {
    // Show your own spinner overlay here (works because this is your UI, not Apple's picker).
    setPreparing(true);
    try {
      const results = await Promise.all(
        selectedList.map(async (a) => {
          // Key: getAssetInfoAsync can yield a local file on iOS, downloading from iCloud if needed
          const info = await MediaLibrary.getAssetInfoAsync(a.id, {
            shouldDownloadFromNetwork: Platform.OS === "ios",
          });

          const localUri = info.localUri ?? info.uri; 
          if (!localUri) throw new Error("Could not resolve asset to a usable URI.");

          return {
            assetId: a.id,
            uri: localUri,
            mediaType: a.mediaType,
          };
        })
      );

      onDone(results);
    } finally {
      setPreparing(false);
    }
  };

  if (hasPerm === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (hasPerm === false) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Photos permission is required.</Text>
        <Text style={{ opacity: 0.7 }}>
          Enable it in Settings to pick photos and videos.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Gallery</Text>

        <Pressable
          onPress={resolveToLocalFiles}
          disabled={selectedCount === 0 || preparing}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            opacity: selectedCount === 0 || preparing ? 0.4 : 1,
            backgroundColor: "black",
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>
            Done {selectedCount > 0 ? `(${selectedCount})` : ""}
          </Text>
        </Pressable>
      </View>

      {/* Grid */}
      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        onEndReached={() => void loadNextPage(false)}
        onEndReachedThreshold={0.8}
        ListFooterComponent={loadingPage ? <View style={{ padding: 16 }}><ActivityIndicator /></View> : null}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);

          return (
            <Pressable
              onPress={() => toggleSelect(item)}
              style={{ width: `${100 / NUM_COLUMNS}%`, aspectRatio: 1, padding: 1 }}
            >
              <Image source={{ uri: item.uri }} style={{ flex: 1 }} />

              {/* Selection badge */}
              <View style={{ position: "absolute", top: 6, right: 6 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: "white",
                    backgroundColor: isSelected ? "black" : "rgba(0,0,0,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSelected ? <Text style={{ color: "white", fontSize: 12 }}>✓</Text> : null}
                </View>
              </View>

              {/* Video badge */}
              {item.mediaType === MediaLibrary.MediaType.video ? (
                <View style={{ position: "absolute", left: 6, bottom: 6, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: "white", fontSize: 12 }}>VIDEO</Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />

      {/* Preparing overlay */}
      {preparing ? (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.35)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ padding: 14, borderRadius: 12, backgroundColor: "white" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Preparing…</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}