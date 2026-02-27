import React, { useCallback } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CATEGORIES } from "../camera/PreviewScreen";
import Spacer from "../Spacer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 7;
const H_PADDING = 30; // matches your header padding-ish
const EMOJI_CELL_SIZE = (SCREEN_WIDTH - H_PADDING) / NUM_COLUMNS;

interface EmojiPickerProps {
  onSelect?: (emoji: string) => void;
  onClose?: () => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const handleSelect = useCallback(
    (emoji: string) => {
      onSelect?.(emoji);
    },
    [onSelect]
  );

  return (
    <>
      {CATEGORIES.map((category) => (
        <View key={category.id}>
          <Text style={styles.headerText}>{category.label}</Text>

          <View style={styles.centerWrap}>
            <FlatList
              data={category.emojis}
              keyExtractor={(_, i) => `${category.id}-${i}`}
              numColumns={NUM_COLUMNS}
              scrollEnabled={false} // IMPORTANT: parent scroll handles it
              renderItem={({ item: emoji }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(emoji)}
                  style={[styles.emojiCell, { width: EMOJI_CELL_SIZE, height: EMOJI_CELL_SIZE }]}
                  activeOpacity={0.5}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.gridContent}
              removeClippedSubviews
              initialNumToRender={48}
              windowSize={5}
            />
          </View>

          <Spacer />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 6,
    textAlign: "left",
  },
  centerWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  gridContent: {
    paddingHorizontal: 10,
  },
  emojiCell: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  emoji: {
    fontSize: 31,
  },
});