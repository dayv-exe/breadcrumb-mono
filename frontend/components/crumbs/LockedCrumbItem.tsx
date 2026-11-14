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

export default function LockedCrumbShared({ crumb }: props) {
  const [showFullAddress, setShowFullAddress] = useState(false)

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

  const getFormattedAddr = () => {
    if (!crumb.placename || crumb.formattedAddress.toLowerCase().includes(crumb.placename.toLowerCase())) return crumb.formattedAddress

    return `${crumb.placename}, ${crumb.formattedAddress}`
  }

  return (
    <>
      <CustomButton
        freed
        type="text"
        pressedOpacity={1}
        customStyle={{
          marginHorizontal: 15,
          borderRadius: 10,
          borderWidth: .275,
          borderColor: fadedBg,
          justifyContent: "space-between",
          paddingVertical: 20,
          paddingHorizontal: 15,
          marginBottom: 10,
        }}
        handleClick={() => setShowFullAddress(s => !s)}
      >
        <View
        style={{
          width: "auto",
          flexDirection: 'row',
          alignItems: "center",
          justifyContent: "flex-start",
        }}
        >
          <View
            style={{
              width: 15,
              height: 15,
              backgroundColor: "transparent",
              borderColor: Colors.light.vibrantButton,
              borderWidth: 2,
              borderRadius: 3,
              alignItems: "center",
              justifyContent: "center",
            }}
          />

          <Spacer size="small" />
          <View>
            <CustomLabel fontSize={15} adaptToTheme width="auto" labelText={crumb.mailbox === "sent" ? `` : `${distanceStr} • `}
            />
          </View>

          <CustomLabel allowTruncate={!showFullAddress} fade adaptToTheme fontSize={13} labelText={getFormattedAddr()} />
        </View>
        <View
          style={{
            width: "auto"
          }}
        >
          <CustomLabel adaptToTheme fontSize={15} labelText="🔒" />
        </View>
      </CustomButton>
    </>
  )
}