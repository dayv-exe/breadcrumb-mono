import { useThemeColor } from "@/hooks/useThemeColor";
import { CheckIcon } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import CustomLabel from "../CustomLabel";
export interface LocationOptionsProps {
  selected: boolean;
  name: string;
  selectedName?: string
  selectedText: string;
  onChanged?: (s: boolean) => void
  onPressed?: (s: boolean) => void
  iconEmoji: string
}
export default function LocationOption({
  name,
  selectedName,
  iconEmoji,
  selectedText,
  selected,
  onChanged,
  onPressed,
}: LocationOptionsProps) {
  const fadedBg = useThemeColor({}, "fadedBackgroundElevated");
  const vibCol = useThemeColor({}, "darkenVibrant");
  const textCol = useThemeColor({}, "text")
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: 7,
      }}
      onPress={() => {
        onChanged?.(!selected)
        onPressed?.(!selected)
      }}
    >
      <View style={{
        backgroundColor: "transparent",
        height: 40,
        width: 40,
        borderRadius: 1000,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        marginRight: 5,
      }}>
        {iconEmoji.trim().length > 0 && <CustomLabel labelText={iconEmoji} fontSize={27} textAlign="center" />}
      </View>
      <View
        style={{
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
        <CustomLabel
          allowTruncate
          customStyle={{ padding: 0, fontSize: 14.5 }}
          labelText={selected ? selectedName ?? name : name}
          bold={selected}
          adaptToTheme
        />
        {selectedText && selected && (
          <CustomLabel
            customStyle={{ padding: 0, marginTop: 1.5, lineHeight: 15 }}
            fontSize={13}
            fade
            labelText={selectedText}
            adaptToTheme
          />
        )}
      </View>
      <View
        style={{
          width: 21,
          height: 21,
          borderColor: selected ? vibCol : fadedBg,
          borderWidth: 2,
          borderRadius: 1000,
          marginRight: 5,
          backgroundColor: selected ? vibCol : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && (
          <CheckIcon size={14} stroke="#fff" strokeWidth={4} />
        )}
      </View>
    </TouchableOpacity>
  );
}