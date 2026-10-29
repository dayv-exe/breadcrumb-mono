import { Crumb } from "@/api/models/crumb";
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatDistance, getDistance, initDistanceFormatter } from "@/utils/distance";
import { useLocationStore } from "@/utils/useLocationStore";
import { useMemo, useState } from "react";
import { View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

interface props {
  crumb: Crumb
}

export default function CrumbSharedItem({ crumb }: props) {
  const fadedBg = useThemeColor({}, "fadedBackground")

  const [singleMileFmt] = useState(() => initDistanceFormatter(1, 1))

  const userCoords = useLocationStore(s => s.coordinates)
  const distanceYards = useMemo(() => {
    return getDistance(crumb.latitude, crumb.longitude, userCoords?.latitude ?? 0, userCoords?.longitude ?? 0, "yards")
  }, [crumb.latitude, crumb.longitude, userCoords?.latitude, userCoords?.longitude])
  const distanceMiles = useMemo(() => {
    return getDistance(crumb.latitude, crumb.longitude, userCoords?.latitude ?? 0, userCoords?.longitude ?? 0, "miles")
  }, [crumb.latitude, crumb.longitude, userCoords?.latitude, userCoords?.longitude])

  const distanceStr = useMemo(() => {
    if (distanceYards <= 350) return `${formatDistance(distanceYards)} yd away`
    else if (distanceMiles < 1) return `${formatDistance(distanceMiles, singleMileFmt)} mi away`
    else return `${formatDistance(distanceMiles)} mi away`
  }, [distanceMiles, distanceYards, singleMileFmt])

  return (
    <CustomButton
      freed
      type="text"
      disabled={!crumb.unlocked}
      customStyle={{
        marginHorizontal: 15,
        borderRadius: 10,
        borderWidth: .275,
        borderColor: fadedBg,
        justifyContent: "flex-start",
        padding: 20,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 15,
          height: 15,
          backgroundColor: crumb.unlocked ? Colors.light.vibrantButton : "transparent",
          borderColor: crumb.unlocked ? "transparent" : Colors.light.vibrantButton,
          borderWidth: 2,
          borderRadius: 3,
          alignItems: "center",
          justifyContent: "center",
        }}
      />

      <Spacer size="small" />
      <View>
        <CustomLabel fontSize={15} adaptToTheme width="auto" bold={crumb.unlocked} labelText={crumb.mailbox === "sent" ? `` : crumb.unlocked ? `Tap to view ${crumb.mediaCount > 1 ? " • " : ""}` : `${distanceStr} • `}
        />
      </View>

      {(crumb.mediaCount > 1 || !crumb.unlocked) && <>
        <CustomLabel fade adaptToTheme fontSize={13} labelText={crumb.unlocked ? crumb.mediaCount + " crumbs" : crumb.formattedAddress} />
      </>
      }
    </CustomButton >
  )
}