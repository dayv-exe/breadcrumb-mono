import { StyleSheet, TouchableOpacity, View } from "react-native";
import CustomImageButton from "../buttons/CustomImageButton";
import RecordingIndicator from "../recordingIndicator";
import Spacer from "../Spacer";

type CameraOverlayProps = {
  isRecording: boolean;
  router: any;
  onFlipCamera: () => void;
  canFlip: boolean;
};

export default function CameraOverlay({ 
  isRecording, 
  router, 
  onFlipCamera, 
  canFlip 
}: CameraOverlayProps) {
  return (
    <>
      {isRecording && <RecordingIndicator />}
      
      {!isRecording && (
        <View style={styles.topControls}>
          <View style={styles.controlButton}>
            <CustomImageButton 
              fitToContent 
              type="text" 
              src={require("../../assets/images/icons/searchfriends_sel_light.png")} 
              size={22} 
              handleClick={() => router.push("/find-friends")} 
            />
          </View>
          <View style={styles.controlButton}>
            <CustomImageButton 
              type="text" 
              src={require("../../assets/images/icons/walls_sel_light.png")} 
              size={22} 
              handleClick={() => router.push("/create-wall")} 
              fitToContent 
            />
          </View>
        </View>
      )}

      <View style={styles.sideControls}>
        <TouchableOpacity>
          <CustomImageButton 
            type="text" 
            src={require("../../assets/images/icons/noflash_sel_light.png")} 
            size={25} 
            fitToContent 
          />
          <Spacer size="tiny" />
        </TouchableOpacity>
        
        {canFlip && (
          <TouchableOpacity>
            <Spacer />
            <CustomImageButton 
              type="text" 
              src={require("../../assets/images/icons/flipcamera_sel_light.png")} 
              size={25} 
              fitToContent 
              handleClick={onFlipCamera}
            />
            <Spacer size="tiny" />
          </TouchableOpacity>
        )}
      </View>

      {!isRecording && (
        <View style={styles.galleryButton}>
          <CustomImageButton 
            type="text" 
            src={require("../../assets/images/icons/gallery_unsel_light.png")} 
            size={30} 
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  topControls: {
    position: "absolute",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    top: 15,
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: "rgba(0, 0, 0, 0)",
    padding: 2,
    borderRadius: 100,
  },
  sideControls: {
    position: "absolute",
    right: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 100,
    paddingTop: 13,
    paddingHorizontal: 10,
    paddingBottom: 10,
    opacity: 0.9,
  },
  galleryButton: {
    position: "absolute",
    alignItems: "center",
    bottom: 75,
    left: 45,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 5,
    borderRadius: 100,
    opacity: 0.9,
  },
});