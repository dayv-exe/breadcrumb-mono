import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";

type Friend = {
  id: string;
  name: string;
  avatarUrl?: string; // optional
};

type Props = {
  friends: Friend[];
  visible: boolean;
  // The shutter container is absolute-bottom: 20 and centered.
  // This overlay will be centered on that same point.
  bottomOffset?: number; // default 20
  selectedFriendId?: string | null;
  onSelectFriend: (friendId: string | null) => void;
};

const ITEM_SIZE = 56;
const ITEM_GAP = 12;

export default function FriendCarouselOverlay({
  friends,
  visible,
  bottomOffset = 20,
  selectedFriendId = null,
  onSelectFriend,
}: Props) {
  const listRef = useRef<FlatList<Friend>>(null);
  const [activeId, setActiveId] = useState<string | null>(selectedFriendId);

  useEffect(() => setActiveId(selectedFriendId ?? null), [selectedFriendId]);

  const data = useMemo(() => friends, [friends]);

  const { width } = Dimensions.get("window");
  // We want the carousel centered on the shutter button.
  // We'll position the carousel so its center aligns with screen center.
  const horizontalPadding = (width - ITEM_SIZE) / 2;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // Pick the most centered/visible one (first is fine with snap + viewability threshold)
      const first = viewableItems?.[0]?.item as Friend | undefined;
      if (!first) return;
      setActiveId(first.id);
      onSelectFriend(first.id);
    }
  ).current;

  const scrollToId = (id: string | null) => {
    if (!id) return;
    const idx = data.findIndex((f) => f.id === id);
    if (idx < 0) return;
    listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
  };

  useEffect(() => {
    if (visible && activeId) {
      // give it a tick to mount before scrolling
      setTimeout(() => scrollToId(activeId), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlay,
        {
          bottom: bottomOffset + 40, // sits just above the shutter button "center line"
        },
      ]}
    >
      <View style={styles.pill}>
        <FlatList
          ref={listRef}
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: horizontalPadding }}
          snapToInterval={ITEM_SIZE + ITEM_GAP}
          decelerationRate="fast"
          bounces={false}
          getItemLayout={(_, index) => ({
            length: ITEM_SIZE + ITEM_GAP,
            offset: (ITEM_SIZE + ITEM_GAP) * index,
            index,
          })}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          renderItem={({ item }) => {
            const selected = item.id === activeId;
            return (
              <Pressable
                onPress={() => {
                  setActiveId(item.id);
                  onSelectFriend(item.id);
                  scrollToId(item.id);
                }}
                style={[
                  styles.item,
                  { marginRight: ITEM_GAP },
                  selected ? styles.itemSelected : null,
                ]}
              >
                <View style={styles.avatarWrap}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>
                        {item.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text numberOfLines={1} style={[styles.name, selected ? styles.nameSelected : null]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />

        <Pressable
          onPress={() => {
            setActiveId(null);
            onSelectFriend(null);
          }}
          style={styles.clearBtn}
        >
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 10,
    paddingLeft: 0,
    paddingRight: 10,
  },
  item: {
    width: ITEM_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  itemSelected: {
    transform: [{ scale: 1.08 }],
  },
  avatarWrap: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  avatarFallbackText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  name: {
    marginTop: 6,
    maxWidth: ITEM_SIZE + 10,
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
  },
  nameSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  clearBtn: {
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  clearText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
  },
});
