import { MediaData } from "@/constants/media";
import { useMediaStore } from "@/utils/mediaStore";
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
  const sharing = useMediaStore(s => s.sharing)

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