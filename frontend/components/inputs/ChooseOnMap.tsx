import Mapbox from "@rnmapbox/maps";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "../buttons/CustomButton";
import Spacer from "../Spacer";
import CustomSearchInput from "./CustomSearchInput";

interface props {
  handleCancel: () => void
  handleChooseLocation: (latitude: number, longitude: number) => void
}

export default function ChooseOnMap({ handleCancel, handleChooseLocation }: props) {
  const insets = useSafeAreaInsets()
  const searchRef = useRef(null)
  const [searchStr, setSearchStr] = useState("")

  return (
    <View style={styles.container}>
      <View style={[styles.tools, {
        top: insets.top
      }]}>
        <CustomSearchInput solidAppearance placeholder="Search places..." customStyle={[styles.searchBar, {
        }]} ref={searchRef} handleChange={setSearchStr} value={searchStr} />
        <Spacer size="small" />
        <CustomButton customStyle={[
          styles.cancelBtn, {
            backgroundColor: "red"
          }
        ]} slim labelText="Cancel" type="less-prominent" handleClick={handleCancel} />
      </View>
      <Mapbox.MapView
        focusable
        rotateEnabled={true}
        compassFadeWhenNorth
        compassEnabled
        compassPosition={{ top: 65, right: 12 }}
        scaleBarEnabled={false}
        style={styles.map}
      >

      </Mapbox.MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  tools: {
    alignSelf: "center",
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "95%",
  },

  cancelBtn: {
    zIndex: 1000
  },

  searchBar: {
    zIndex: 1000,
  }
})