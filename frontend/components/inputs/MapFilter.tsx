import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ScrollView, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import CustomLabel from "../CustomLabel";

const OPACITY = 0
const ELEVATION = 0
const FONT_WEIGHT = "600"
const FONT_OPACITY = 1
const FONT_SIZE = 12

interface props {
  forceDark?: boolean
}

type Filter = {
  labelText: string
  onClick?: () => void
}

const FILTERS: Filter[] = [
  { labelText: "📬 Unopened", },
  { labelText: "🎯 Nearby", },
  { labelText: "🛫 Sent", },
  { labelText: "🔒 Private", },
  { labelText: "💾 Saved", },
]

export default function MapFilter({ forceDark }: props) {
  const themeBgCol = useThemeColor({}, "background")
  const themeTxtCol = useThemeColor({}, "text")

  const bgCol = forceDark ? Colors.dark.background : themeBgCol
  const textCol = forceDark ? Colors.dark.text : themeTxtCol

  return (
    <View style={[{
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-start",
      flexDirection: "row",
    }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 10
        }}
      >
        {
          FILTERS.map(f => (
            <CustomButton key={f.labelText} freed type="text" adaptToTheme handleClick={() => {

            }} customStyle={{
              shadowColor: "#000",
              shadowOffset: { height: 2, width: 2, },
              shadowOpacity: OPACITY,
              shadowRadius: 2,
              marginBottom: 5,
              elevation: ELEVATION,
              marginRight: 7,
              backgroundColor: bgCol,
              padding: 7,
              paddingHorizontal: 10,
            }}>
              <CustomLabel
                labelText={f.labelText}
                customStyle={{
                  fontWeight: FONT_WEIGHT,
                  opacity: FONT_OPACITY,
                  fontSize: FONT_SIZE,
                  color: textCol,
                }}
              />
            </CustomButton>
          ))
        }
      </ScrollView>
    </View>
  )
}