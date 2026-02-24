import { MediaData } from "@/constants/media";
import { AudioModule, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import AudioWaveIcon from "../misc/AudioWaveForm";

type Props = { media: MediaData };

export default function AudioPreview({ media }: Props) {
  AudioModule.setAudioModeAsync({
    playsInSilentMode: true,

    shouldRouteThroughEarpiece: false,

    interruptionModeAndroid: "doNotMix",
    interruptionMode: "doNotMix",
  })
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const playProperly = () => {
    player.play();

    player.volume = 1
    player.muted = false
    player.loop = true
  }

  useEffect(() => {
    if (media?.uri) {
      player.replace(media.uri);
      playProperly()
    }
  }, [media?.uri, player]);

  const onPress = () => {
    if (!status.isLoaded) return;

    if (status.playing) {
      player.pause();
      return;
    }

    // expo-audio does NOT auto-rewind when it finishes
    // so if we're at/near the end, seek to 0 before playing again
    const nearEnd =
      status.duration > 0 && status.currentTime >= status.duration - 0.05;

    if (nearEnd) player.seekTo(0);
    playProperly()
  };

  return (
    <View style={styles.container}>
      <Pressable onPressIn={() => player.pause()} onPressOut={playProperly}>
        <AudioWaveIcon size={250} animating={status.playing} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});