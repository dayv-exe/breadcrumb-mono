import { MediaItem } from "@/api/getPresignedUrl"
import { useEvent } from "expo"
import { useVideoPlayer, VideoView } from "expo-video"
import { BookmarkIcon, HeartIcon, Reply } from "lucide-react-native"
import { useEffect, useRef, useState } from "react"
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import CustomLabel from "../CustomLabel"
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle"
import Spacer from "../Spacer"

type Props = {
  items: MediaItem[]
  userId: string
  nickname: string
  onClose?: () => void
  onComplete?: () => void
  initialIndex?: number
  imageDuration?: number // ms per image, default 5000
  videoDuration?: number // ms per video if you don't want full playback
}

const { width, height } = Dimensions.get("window")
const DEFAULT_IMAGE_DURATION = 5000

export default function StoryViewer({ items, onClose, onComplete, initialIndex = 0, imageDuration = 5000, videoDuration, userId, nickname }: Props) {
  const [idx, setIdx] = useState(initialIndex)
  const [paused, setPaused] = useState(false)
  const progress = useRef(new Animated.Value(0)).current
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)
  const [mediaReady, setMediaReady] = useState(false)
  const inset = useSafeAreaInsets()

  const current = items[idx]
  const isVideo = current?.type === "video"

  // Player is created once and its source is swapped per item
  const player = useVideoPlayer(isVideo ? current.media : null, p => {
    p.loop = false
    p.timeUpdateEventInterval = 0.1 // seconds
  })

  // Listen for time updates to drive the progress bar
  useEvent(player, "timeUpdate", { currentTime: 0, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 })

  // Swap source when item changes
  useEffect(() => {
    if (isVideo) {
      player.replace(current.media)
      if (!paused) player.play()
    }
  }, [idx, isVideo])

  // Pause/resume
  useEffect(() => {
    if (!isVideo) return
    if (paused) player.pause()
    else player.play()
  }, [paused, isVideo])

  // Drive progress for videos from playback time, for images from timer
  useEffect(() => {
    if (!current || !mediaReady) return
    progress.setValue(0)

    if (isVideo && !videoDuration) {
      // Video progress is driven by a polling effect below
      return
    }

    const duration = isVideo ? videoDuration! : imageDuration
    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    })

    if (!paused) {
      animationRef.current.start(({ finished }) => {
        if (finished) goNext()
      })
    }

    return () => animationRef.current?.stop()
  }, [idx, paused, mediaReady])

  // Poll video position for progress + end detection
  useEffect(() => {
    if (!isVideo || videoDuration) return
    const interval = setInterval(() => {
      if (paused) return
      const dur = player.duration
      const pos = player.currentTime
      if (dur > 0) {
        progress.setValue(Math.min(pos / dur, 1))
        if (pos >= dur - 0.1) goNext()
      }
    }, 100)
    return () => clearInterval(interval)
  }, [idx, isVideo, paused])

  function goNext() {
    if (idx < items.length - 1) setIdx(i => i + 1)
    else {
      onComplete?.()
      onClose?.()
    }
  }

  function goPrev() {
    if (idx > 0) setIdx(i => i - 1)
    else progress.setValue(0)
  }

  if (!current) return null

  return (
    <View style={styles.container}>
      {isVideo ? (
        <VideoView
          player={player}
          style={styles.media}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <Image source={{ uri: current.media }} style={styles.media} resizeMode="cover" onLoad={() => setMediaReady(true)} />
      )}

      {current.overlay && (
        <Image source={{ uri: current.overlay }} style={styles.overlay} />
      )}

      {current.text && (
        <View style={styles.textWrap} pointerEvents="none">
          <Text style={styles.text}>
            {typeof current.text === "string" ? current.text : current.text.content}
          </Text>
        </View>
      )}

      <View style={[styles.progressRow, { top: inset.top }]}>
        {items.map((_, i) => (
          <View key={i} style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width:
                    i < idx
                      ? "100%"
                      : i === idx
                        ? progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                          extrapolate: "clamp",
                        })
                        : "0%",
                },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={[styles.senderDetails, { top: inset.top + 20 }]}>
        <CustomProfilePictureCircle nickname={nickname} userId={userId} size={40} />
        <Spacer size="tiny" />
        <CustomLabel labelText={nickname} textColor={"#fff"} bold />
      </View>

      <View style={[styles.controls, { bottom: inset.bottom + 15, right: 15 }]}>
        <HeartIcon size={35} strokeWidth={3} stroke={"#fff"} fill={"none"} style={{
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { height: 0, width: 0 },
          shadowOpacity: .5,
          shadowRadius: 10,
        }} />
        <Spacer />
        <Reply size={35} strokeWidth={3} stroke={"#fff"} fill={"none"} />
        <Spacer />
        <BookmarkIcon size={35} strokeWidth={3} stroke={"#fff"} fill={"none"} />
      </View>

      <View style={styles.tapZones} pointerEvents="box-none">
        <TouchableWithoutFeedback
          onPress={goPrev}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
        >
          <View style={styles.tapZoneLeft} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback
          onPress={goNext}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
        >
          <View style={styles.tapZoneRight} />
        </TouchableWithoutFeedback>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width, height, backgroundColor: "#000" },
  media: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject },
  textWrap: {
    position: "absolute",
    bottom: 120,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressRow: {
    position: "absolute",
    top: 50,
    left: 15,
    right: 15,
    flexDirection: "row",
    gap: 4,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#fff" },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: "row" },
  tapZoneLeft: { flex: 1 },
  tapZoneRight: { flex: 2 },
  senderDetails: {
    width: "100%",
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    top: 0,
    paddingHorizontal: 15,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    right: 0,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  }
})