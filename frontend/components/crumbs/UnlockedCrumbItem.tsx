import { Crumb } from "@/api/models/crumb";
import { Colors } from "@/constants/Colors";
import { useOpenCrumb } from "@/hooks/queries/useCrumbsApi";
import { OriginRect } from "@/hooks/types/crumbStack";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ComponentRef, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";
import CrumbStack from "./CrumbStack";

interface props {
  crumb: Crumb
}

export default function UnlockedCrumbShared({ crumb }: props) {
  const fadedBg = useThemeColor({}, "fadedBackground")

  const thumbRef = useRef<ComponentRef<typeof View>>(null)
  const [origin, setOrigin] = useState<OriginRect | null>(null);

  const { data: media, error: mediaError, isPending: mediaIsPending, refetch: mediaRefetch } = useOpenCrumb(crumb.id, crumb.unlocked)

  const openCrumbStack = () => {
    if (mediaIsPending) return
    else if (mediaError) {
      mediaRefetch()
      return
    }
    thumbRef.current?.measureInWindow((x, y, width, height) => {
      setOrigin({ x, y, width, height })
    })
  }

  const promptText = useMemo(() => {
    if (mediaError) return "Tap to reload"
    else if (mediaIsPending) return "Loading"
    else if (media) return "Tap to view"
    else return "open"
  }, [media, mediaError, mediaIsPending])

  return (
    <>
      <CustomButton
        freed
        type="text"
        customStyle={{
          marginHorizontal: 15,
          borderRadius: 10,
          borderWidth: .275,
          borderColor: fadedBg,
          justifyContent: "flex-start",
          padding: 20,
          marginBottom: 10,
        }}
        handleClick={openCrumbStack}
      >
        <View
          ref={thumbRef}
          style={{
            width: 15,
            height: 15,
            backgroundColor: Colors.light.vibrantButton,
            borderColor: "transparent",
            borderWidth: 2,
            borderRadius: 3,
            alignItems: "center",
            justifyContent: "center",
          }}
        />

        <Spacer size="small" />
        <View>
          <CustomLabel fontSize={15} adaptToTheme width="auto" bold labelText={crumb.mailbox === "sent" ? `` : `${promptText} ${crumb.mediaCount > 1 ? " • " : ""}`}
          />
        </View>

        {(crumb.mediaCount > 1) && <>
          <CustomLabel allowTruncate fade adaptToTheme fontSize={13} labelText={crumb.mediaCount + " crumbs"} />
        </>
        }
      </CustomButton>

      {media && origin &&
        <CrumbStack
          crumbs={[crumb]}
          media={media}
          origin={origin}
          onClose={() => setOrigin(null)}
        />
      }
    </>
  )
}