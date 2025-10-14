import CustomButton from "@/components/buttons/CustomButton";
import CustomImageButton from "@/components/buttons/CustomImageButton";
import Spacer from "@/components/Spacer";
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, View } from "react-native";

export default function MediaPreview() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const mediaPath = params.mediaPath as string;
  const mediaType = params.mediaType as 'photo' | 'video';
  const mediaUri = `file://${mediaPath}`;

  const player = useVideoPlayer(mediaType === 'video' ? mediaUri : '', player => {
    player.loop = true;
    player.play();
  });

  useEffect(() => {
    return () => {
      player.release();
    };
  }, []);

  async function handleSave() {
    setIsSaving(true);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant media library permissions to save media',
          [{ text: 'OK', onPress: () => setIsSaving(false) }]
        );
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(mediaUri);

      // Optionally create an album and add the asset to it
      const album = await MediaLibrary.getAlbumAsync('Camera');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('Camera', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert(
        'Success',
        `${mediaType === 'photo' ? 'Photo' : 'Video'} saved to gallery!`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error(`Failed to save ${mediaType}:`, error);
      Alert.alert('Error', `Failed to save ${mediaType}`);
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscard() {
    Alert.alert(
      'Discard Media',
      `Are you sure you want to discard this ${mediaType}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back()
        }
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Close button */}
      <View style={styles.topControls}>
        <CustomImageButton
          type="text"
          src={require("../../assets/images/icons/close_unsel_light.png")}
          size={28}
          handleClick={handleDiscard}
          fitToContent
        />
      </View>

      {/* Media preview */}
      <View style={styles.mediaContainer}>
        {mediaType === 'photo' ? (
          <Image
            source={{ uri: mediaUri }}
            style={styles.media}
            resizeMode="contain"
          />
        ) : (
          <VideoView
            player={player}
            style={styles.media}
            contentFit="contain"
            fullscreenOptions={{
              enable: false
            }}
            nativeControls={false}
            onTouchStart={() => {
              if (player.playing) {
                player.pause()
              } else {
                player.play()
              }
            }}
          />
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.bottomControls}>
        <View style={styles.buttonContainer}>
          <CustomButton
            type="text"
            labelText="Discard"
            handleClick={handleDiscard}
            width={140}
          />
          <Spacer size="medium" />
          <CustomButton
            type="prominent"
            labelText={isSaving ? "Saving..." : "Save"}
            handleClick={handleSave}
            width={140}
            disabled={isSaving}
          />
        </View>
        {isSaving && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    padding: 8,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    marginTop: 15,
  },
});