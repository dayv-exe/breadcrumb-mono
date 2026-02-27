import { EmojiCategory } from "@/constants/appConstants";
import { MediaData } from "@/constants/media";
import { useDropZone } from "@/hooks/useDropZone";
import { useGesture } from "@/hooks/useGestures";
import { useMediaStore } from "@/utils/mediaStore";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/shallow";
import DeleteZone from "../editor/DeleteZone";
import DraggableStickerOverlay from "../editor/DraggableStickerOverlay";
import DraggableTextOverlay from "../editor/DraggableTextOverlay";
import AudioPreview from "./AudioPreview";
import PreviewControls from "./PreviewControls";
import TextPreview from "./TextPreview";

type PreviewScreenProps = {
  mediaItems: MediaData[];
  onRetake: () => void;
  onSave: (selectedIndex: number) => void;
};

const THUMBNAIL_SIZE = 60;
const THUMBNAIL_SPACING = 8;

// ── Generated emoji sets (module-level, runs once) ─────────────

// People base set (you can expand this over time)
const BASE_PEOPLE = [
  "👶", "🧒", "👦", "👧", "🧑", "👨", "👩",
  "🧔", "👱", "👴", "👵", "🧓", "👲", "👳", "👮", "🕵️", "💂",
  "👷", "🤴", "👸", "👰", "🤵", "🫅", "🫃", "🫄", "👼",
  "🧝", "🧙", "🧛", "🧟", "🧞", "🧜", "🧚"
];

// Profession “role” codes used in ZWJ sequences like 🧑‍💻
const PROFESSION_ROLES = [
  "⚕️", "🎓", "🏫", "💻", "🔧", "🍳", "🌾", "🚒", "✈️", "🚀",
  "⚖️", "🎨", "🎤", "🏭", "🔬", "💼", "🔍", "🍼"
];

function generateProfessionVariants(): string[] {
  const people = ["🧑", "👨", "👩"];
  const out: string[] = [];

  for (const role of PROFESSION_ROLES) {
    for (const p of people) {
      out.push(`${p}‍${role}`); // ZWJ joiner
    }
  }
  return out;
}

const PEOPLE_EMOJIS: string[] = [
  ...BASE_PEOPLE,
  ...generateProfessionVariants(),
];

// ISO 3166-1 alpha-2 country codes (official set is bigger; this is your current list)
const ISO_COUNTRY_CODES = [
  "AF", "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT", "AZ",
  "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BT", "BO", "BA", "BW", "BR", "BN", "BG", "BF", "BI",
  "CV", "KH", "CM", "CA", "CF", "TD", "CL", "CN", "CO", "KM", "CG", "CR", "CI", "HR", "CU", "CY", "CZ",
  "DK", "DJ", "DM", "DO",
  "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET",
  "FJ", "FI", "FR",
  "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT", "GN", "GW", "GY",
  "HT", "HN", "HU",
  "IS", "IN", "ID", "IR", "IQ", "IE", "IL", "IT",
  "JM", "JP", "JO",
  "KZ", "KE", "KI", "KR", "KW", "KG",
  "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU",
  "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MR", "MU", "MX", "FM", "MD", "MC", "MN", "ME", "MA", "MZ", "MM",
  "NA", "NR", "NP", "NL", "NZ", "NI", "NE", "NG", "MK", "NO",
  "OM",
  "PK", "PW", "PA", "PG", "PY", "PE", "PH", "PL", "PT",
  "QA",
  "RO", "RU", "RW",
  "KN", "LC", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "ES", "LK", "SD", "SR", "SE", "CH", "SY",
  "TW", "TJ", "TZ", "TH", "TL", "TG", "TO", "TT", "TN", "TR", "TM", "TV",
  "UG", "UA", "AE", "GB", "US", "UY", "UZ",
  "VU", "VA", "VE", "VN",
  "YE",
  "ZM", "ZW"
];

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
    .join("");
}

const FLAG_EMOJIS: string[] = ISO_COUNTRY_CODES.map(countryCodeToFlag);

export const CATEGORIES: EmojiCategory[] = [
  {
    id: "smileys",
    label: "Smileys & Emotion",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
      "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢",
      "🫣", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥",
      "😏", "😒", "🙄", "😬", "🤥", "🫠", "😌", "😔", "😪", "🤤",
      "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥴", "😵",
      "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "🫤", "😟",
      "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨",
      "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩",
      "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️",
      "👻", "👽", "🤖", "💩", "🤡", "👹", "👺"
    ],
  },
  {
    id: "gestures",
    label: "Hands & Gestures",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "🫷",
      "🫸", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙",
      "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊",
      "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏",
      "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀",
      "🫁", "👀", "👁️", "👅", "👄", "🦷", "🦴"
    ],
  },
  {
    id: "animals",
    label: "Animals & Nature",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨",
      "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊",
      "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉",
      "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌",
      "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🦂", "🐢",
      "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡",
      "🐠", "🐟", "🐬", "🐳", "🐋", "🦭", "🦈", "🌵", "🌲", "🌴",
      "🌳", "🌸", "🌼", "🌻", "🌺", "🍀", "🌿", "🍁", "🍂", "🌎"
    ],
  },
  {
    id: "food",
    label: "Food & Drink",
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
      "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑",
      "🫛", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄",
      "🧅", "🥔", "🍠", "🫘", "🥐", "🥖", "🍞", "🧀", "🥚", "🍳",
      "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟",
      "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗", "🥘",
      "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🍤", "🍙", "🍚", "🍘",
      "🍥", "🥟", "🥠", "🥡", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂",
      "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "🥛",
      "☕", "🫖", "🍵", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸"
    ],
  },
  {
    id: "travel",
    label: "Travel & Places",
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐",
      "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🛹", "🛼",
      "✈️", "🛫", "🛬", "🚀", "🛸", "🚁", "⛵", "🚤", "🛥️", "🛳️",
      "⛴️", "🚢", "🚂", "🚆", "🚄", "🚅", "🚇", "🚉", "🚊", "🚝",
      "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪",
      "🏫", "🏬", "🏭", "🏯", "🏰", "💒", "🗼", "🗽", "⛰️", "🏔️",
      "🏖️", "🏝️", "🏜️", "🌋", "🌁", "🌆", "🌃", "🌇", "🌉"
    ],
  },
  {
    id: "objects",
    label: "Objects",
    emojis: [
      "⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "💾", "💿",
      "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠",
      "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️",
      "💡", "🔦", "🕯️", "🧯", "🛢️", "💸", "💵", "💴", "💶", "💷",
      "🪙", "💰", "💳", "💎", "⚖️", "🧰", "🔧", "🔨", "⚒️", "🛠️",
      "🧱", "🪛", "🔩", "⚙️", "🧲", "🪜", "🪑", "🛏️", "🚪", "🪞",
      "🧴", "🧷", "🧹", "🧺", "🪣", "🧻", "🪥", "🧼", "🧽", "🛒"
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
      "⭐", "🌟", "✨", "⚡", "🔥", "💫", "🎵", "🎶", "💤", "💢",
      "💬", "👁️‍🗨️", "🗯️", "💭", "🕳️", "✅", "☑️", "✔️", "❌", "❎",
      "➕", "➖", "➗", "✖️", "♾️", "‼️", "⁉️", "❓", "❔", "❕",
      "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚪", "⚫", "🟥", "🟦",
      "🔺", "🔻", "🔸", "🔹", "🔷", "🔶", "🔳", "🔲", "©️", "®️", "™️"
    ],
  },
  {
    id: "people",
    label: "People & Professions",
    emojis: PEOPLE_EMOJIS,
  },
  {
    id: "flags",
    label: "Flags",
    emojis: FLAG_EMOJIS,
  },
];

function VideoPreview({ uri, isActive }: { uri: string; isActive: boolean }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.currentTime = 0;
    if (isActive) {
      player.play();
    }
  });

  useEffect(() => {
    if (isActive) {
      player.currentTime = 0;
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <VideoView
      player={player}
      style={styles.previewMedia}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

function Thumbnail({
  item,
  isSelected,
  onPress,
}: {
  item: MediaData;
  isSelected: boolean;
  onPress: () => void;
}) {
  const thumbnailUri =
    item.type === "video" && item.thumbnail ? item.thumbnail : item.uri;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.thumbnail, isSelected && styles.thumbnailSelected]}
    >
      {item.type === "photo" ? (
        <Image
          source={{ uri: item.uri }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.thumbnailVideo}>
          <Image
            source={{ uri: thumbnailUri }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
          <View style={styles.videoIndicator}>
            <View style={styles.playIcon} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CustomImage({ media }: { media: MediaData }) {
  return (
    <>
      {media.resizeMode === "contain" && (
        <Image
          key={media.uri}
          src={media.uri}
          style={styles.previewMedia}
          resizeMode="contain"
        />
      )}
      {media.resizeMode === "cover" && (
        <Image
          key={media.uri}
          src={media.uri}
          style={styles.previewMedia}
          resizeMode="cover"
        />
      )}
    </>
  );
}

export default function PreviewScreen({
  mediaItems,
  onRetake,
  onSave,
}: PreviewScreenProps) {
  const {
    editing,
    setShowMediaPreviews,
    setCurrentMediaIndex,
    currentMediaIndex,
    addTextOverlayToCurrentMedia,
    removeOverlay,
    nextPreview,
    previousPreview
  } = useMediaStore(
    useShallow(s => ({
      editing: s.editing,
      setShowMediaPreviews: s.setShowMediaPreviews,
      setCurrentMediaIndex: s.setCurrentMediaIndex,
      currentMediaIndex: s.currentMediaIndex,
      addTextOverlayToCurrentMedia: s.addTextOverlayToCurrentMedia,
      removeOverlay: s.removeOverlayFromCurrentMedia,
      nextPreview: s.goToNextPreview,
      previousPreview: s.goToPreviousPreview,
    }))
  );
  const currentMedia = mediaItems[currentMediaIndex];
  const currentOverlayDragId = useRef<string | null>(null)
  const insets = useSafeAreaInsets();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const focusIndex = useRef(-1)
  const deleteZone = useDropZone({
    hitSlop: 10,
    onDrop: () => removeOverlay(currentOverlayDragId.current ?? ""),
  });

  const spawnTextOverlay = () => {
    focusIndex.current = currentMedia.overlays?.length ?? 0
    addTextOverlayToCurrentMedia("", 0, 0)
  }

  const { gesture } = useGesture({
    onTap: ({ x, y }) => {
      if (editing) return;
      if (currentMedia.type !== "photo" && currentMedia.type !== "video") return
      focusIndex.current = currentMedia.overlays?.length ?? 0
      const centerRelativeX = x - containerSize.width / 2;
      const centerRelativeY = y - containerSize.height / 2;
      addTextOverlayToCurrentMedia("", centerRelativeX, centerRelativeY)
    },
  });

  const renderThumbnail = useCallback(
    ({ item, index }: { item: MediaData; index: number }) => (
      <Thumbnail
        item={item}
        isSelected={index === currentMediaIndex}
        onPress={() => {
          setCurrentMediaIndex(index);
        }}
      />
    ),
    [currentMediaIndex]
  );

  const getPreviewComponent = () => {
    if (currentMedia.type === "photo") {
      return (
        <CustomImage media={currentMedia} />
      )
    } else if (currentMedia.type === "video") {
      return (
        <VideoPreview uri={currentMedia.uri} isActive={true} />
      )
    } else if (currentMedia.type === "text") {
      return (
        <TextPreview media={currentMedia} />
      )
    } else if (currentMedia.type === "audio") {
      return (
        <AudioPreview media={currentMedia} />
      )
    }
  }

  if (!currentMedia) {
    return null;
  }

  return (
    <View style={styles.previewContainer}>

      <GestureDetector gesture={gesture}>
        <View
          style={[styles.previewMediaWrapper, { marginTop: insets.top }]}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setContainerSize({ width, height });
          }}
        >
          {getPreviewComponent()}
        </View>
      </GestureDetector>

      {/* Text overlays */}
      {currentMedia.overlays && (
        <View
          style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}
          pointerEvents="box-none"
        >
          {currentMedia.overlays.map((overlay, index) => {
            if (overlay.type === "text") {
              return (
                <DraggableTextOverlay handleRemoveOverlay={() => removeOverlay(overlay.id)} focusOnMount={focusIndex.current === index} overlay={overlay} key={overlay.id} onBlur={() => {
                  focusIndex.current = -1
                }} onDragEnd={(x, y) => {
                  deleteZone.handleDragEnd(x, y)
                  // currentOverlayDragId.current = null
                }} onDragMove={deleteZone.handleDragMove} onDragStart={() => {
                  deleteZone.handleDragStart()
                  currentOverlayDragId.current = overlay.id
                }} />
              );
            } else if (overlay.type === "sticker") {
              return (
                <DraggableStickerOverlay
                  key={overlay.id}
                  overlay={overlay}
                  onDragEnd={(x, y) => {
                    deleteZone.handleDragEnd(x, y)
                  }} onDragMove={deleteZone.handleDragMove} onDragStart={() => {
                    deleteZone.handleDragStart()
                    currentOverlayDragId.current = overlay.id
                  }}
                />
              )
            }

            if (focusIndex.current === index) {
              focusIndex.current = -1
            }
            return null;
          })}
        </View>
      )}

      <DeleteZone
        visible={deleteZone.isVisible}
        active={deleteZone.isActive}
        onLayout={deleteZone.onLayout}
      />

      {!editing && <PreviewControls media={currentMedia} spawnTextOverlay={spawnTextOverlay} />}

      {/* Thumbnail strip */}
      {mediaItems.length > 1 && (
        <View style={styles.previewControls}>
          <FlatList
            data={mediaItems}
            renderItem={renderThumbnail}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 75,
    left: 15,
    zIndex: 100,
    padding: 8,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "black",
    borderColor: "green",
    borderWidth: 0,
  },
  previewMediaWrapper: {
    flex: 1,
    width: "100%",
    borderColor: "orange",
    borderWidth: 0,
  },
  previewMedia: {
    width: "100%",
    height: "100%",
  },
  thumbnailContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
  },
  thumbnailList: {
    paddingHorizontal: 20,
    gap: THUMBNAIL_SPACING,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "black",
  },
  thumbnailSelected: {
    borderColor: "white",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  thumbnailVideo: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  videoIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "white",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  previewControls: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  textInputOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  textInput: {
    color: "white",
    width: "100%",
    textAlign: "center",
    borderRadius: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
});