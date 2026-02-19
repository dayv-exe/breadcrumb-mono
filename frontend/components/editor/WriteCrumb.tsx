import { TEXT_CRUMB_LIMIT } from "@/constants/appConstants";
import { countVisibleCharacters } from "@/utils/graphemeCluster";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import CustomInput from "../inputs/CustomInput";
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle";
import Spacer from "../Spacer";

type props = {
  handleCancel: () => void
}

export default function WriteCrumb({ handleCancel }: props) {
  const [crumb, setCrumb] = useState("")

  return (
    <View style={[style.container]}>
      <Spacer />
      <View style={style.topButtons}>
        <CustomButton labelText="Cancel" type="less-vibrant-text" handleClick={handleCancel} customTextStyle={style.cancelButton} slim />

        <CustomButton labelText="Add" type="less-prominent" customStyle={style.postButton} slim disabled={countVisibleCharacters(crumb) < 1} />
      </View>
      <Spacer />
      <View style={style.typingArea}>
        <View style={{
          height: "100%"
        }}>
          <CustomProfilePictureCircle size={55} />
        </View>
        <CustomInput
          value={crumb}
          setValue={setCrumb}
          customInputStyle={[style.input]}
          customStyle={style.inputContainer}
          multiline
          hideActiveBorders
          allowNewLines={false}
          placeholder="Write a crumb..."
          labelText=""
          adaptToTheme
        />
      </View>
      <Spacer />
      <CustomLabel labelText={`${countVisibleCharacters(crumb)}/${TEXT_CRUMB_LIMIT} characters`} fontSize={14} adaptToTheme fade />
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postButton: {
    paddingHorizontal: 30,
  },
  cancelButton: {
    color: "red"
  },
  inputContainer: {
    maxWidth: "80%",
    marginLeft: 10,
    flexShrink: 1,
    padding: 0,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  input: {
    backgroundColor: "transparent",
    padding: 0,
    fontWeight: "400",
    lineHeight: 21
  },
  typingArea: {
    width: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
})