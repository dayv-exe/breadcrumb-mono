import { Crumb } from "@/api/models/crumb";
import { UserDetails } from "@/api/models/userDetails";
import { useGetUser } from "@/hooks/queries/useUserApi";
import { useThemeColor } from "@/hooks/useThemeColor";
import { colorForUserId } from "@/utils/userColor";
import { StyleSheet, View } from "react-native";
import CustomLabel from "../CustomLabel";
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle";
import Skeleton from "../skeletons/Skeleton";
import Spacer from "../Spacer";
import FloatingCrumb from "./FloatingCrumb";

interface props {
  userid: string
  crumbs: Crumb[]
}

function ClusterSkeleton() {
  return (
    <View style={[styles.container]}>
      <Skeleton />
    </View>
  )
}

export default function CrumbCluster({ userid, crumbs }: props) {
  const { data: user, isPending: userIsPending, error: userError } = useGetUser(userid)
  const userCol = colorForUserId(userid)
  const bgcol = useThemeColor({}, "background")
  const textCol = useThemeColor({}, "text")
  const darkBgCol = useThemeColor({}, "darkBackground")

  const resolveName = (user: UserDetails): string => {
    if (user.email) return "Me"
    else if (user.name) return user.name
    else if (user.nickname) return user.nickname
    else return "<no name>"
  }

  return (
    <>
      {user && <View style={[styles.container]}>
        <View style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          marginBottom: 10,
        }}>
          <CustomProfilePictureCircle size={20} userId={user.userId} customStyle={{
            marginLeft: -6,
            marginRight: 5,
          }} />
          <CustomLabel
            labelText={resolveName(user)}
            fontSize={16}
            bold
            padding={0}
            customStyle={{
              color: userCol,
              width: "auto",
            }}
          />
        </View>
        <View style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <View style={{
            width: 3,
            height: "100%",
            backgroundColor: userCol,
            borderRadius: 1000,
          }} />
          <Spacer size="small" />
          <View style={{
            flexShrink: 1,
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
          }}>
            {crumbs.map((crumb, i) => {
              return (
                <>
                  <FloatingCrumb key={crumb.id} crumb={crumb} userColor={userCol} />
                  {i + 1 !== crumbs.length && (
                    <Spacer key={crumb.id + "spacer"} size="small" />
                  )}
                </>
              )
            })}

          </View>
        </View>
      </View>}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    marginBottom: 15,
  }
})