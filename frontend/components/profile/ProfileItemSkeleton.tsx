import { View } from "react-native";
import Skeleton from "../skeletons/Skeleton";
import Spacer from "../Spacer";

export default function ProfileItemSkeleton() {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "100%"
    }}>
      <Skeleton width={60} height={60} borderRadius={100} />
      <Spacer size="small" />
      <View>
        <Skeleton height={16} borderRadius={100} />
        <Spacer size="small" />
        <Skeleton width={100} height={16} borderRadius={100} />
      </View>
    </View>
  )
}