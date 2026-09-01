import { Suggestion } from "@/api/models/placeSearch"
import { UserDetails } from "@/api/models/userDetails"
import { useThemeColor } from "@/hooks/use-theme-color"
import { convertToPreferredDistance } from "@/utils/helpers"
import { BedIcon, BeerIcon, BuildingIcon, BusFrontIcon, CameraIcon, CarTaxiFrontIcon, ClapperboardIcon, CoffeeIcon, CroissantIcon, GemIcon, HeartPulseIcon, InfoIcon, LandmarkIcon, MapPinIcon, ParkingCircleIcon, PlaneTakeoffIcon, SchoolIcon, ShoppingCartIcon, SportShoeIcon, TentIcon, TreesIcon, UtensilsCrossedIcon } from "lucide-react-native"
import { TouchableOpacity, View } from "react-native"
import CustomLabel from "../CustomLabel"
import CustomProfilePictureCircle from "../profile/CustomProfilePictureCircle"

type userSearchResult = {
  user: UserDetails
  type: "user"
}

type placeSearchResult = {
  place: Suggestion
  type: "place"
}

interface props {
  data: userSearchResult | placeSearchResult
  onSelect: (id: string) => void
}

const SearchResult = ({ data, onSelect }: props) => {
  const textCol = useThemeColor({}, "text")
  const strokeWidth = 2.5
  const makiOpacity = .6
  const fillCol = "transparent"
  const getName = (): string => {
    return data.type === "user" ? (data.user.name ? data.user.name : data.user.nickname ?? "<Unknown user>") : data.place.name
  }
  return (
    <TouchableOpacity style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "100%",
      paddingVertical: 10,
      paddingHorizontal: 5,
    }
    }
      onPress={() => {
        onSelect(data.type === "user" ? data.user.userId : data.place.mapbox_id)
      }}
    >
      {data.type === "place" && <View style={
        {
          backgroundColor: "rgba(0, 0, 0, .05)",
          borderRadius: "100%",
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
        }
      }>
        {
          data.place.maki === "school" || data.place.maki === "college" ? (
            <SchoolIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "restaurant" ? (
            <UtensilsCrossedIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "shop" ? (
            <ShoppingCartIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "bus" ? (
            <BusFrontIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "airport" ? (
            <PlaneTakeoffIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "hospital" ? (
            <HeartPulseIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "attraction" ? (
            <CameraIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "fast-food" ? (
            <UtensilsCrossedIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "taxi" ? (
            <CarTaxiFrontIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "bar" ? (
            <BeerIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "information" ? (
            <InfoIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "jewelry-store" ? (
            <GemIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "parking" ? (
            <ParkingCircleIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "museum" ? (
            <LandmarkIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "lodging" ? (
            <BedIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "fitness-centre" ? (
            <SportShoeIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "cinema" ? (
            <ClapperboardIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "town-hall" ? (
            <LandmarkIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "cafe" ? (
            <CoffeeIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "natural" ? (
            <TreesIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "bakery" ? (
            <CroissantIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "building" ? (
            <BuildingIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : data.place.maki === "campsite" ? (
            <TentIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          ) : (
            <MapPinIcon strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={textCol} fill={fillCol} opacity={makiOpacity} />
          )
        }
      </View>}
      {data.type === "user" && <CustomProfilePictureCircle size={40} userId={data.user.userId} customStyle={{
        marginRight: 5,
      }} />}
      < View style={{ flexGrow: 1, flexShrink: 1, marginLeft: 5, }}>
        <CustomLabel labelText={getName()} adaptToTheme fontSize={15} bold customStyle={{
          paddingVertical: 0,
        }} />
        {data.type === "place" && <CustomLabel allowTruncate fade labelText={convertToPreferredDistance(data.place.distance ?? 0) + " • " + (data.place.full_address ?? data.place.place_formatted)} adaptToTheme fontSize={13} customStyle={{
          paddingVertical: 0,
        }} />}
        {data.type === "user" && <CustomLabel allowTruncate fade labelText={data.user.nickname ?? "<Unknown user>"} adaptToTheme fontSize={13} customStyle={{
          paddingVertical: 0,
        }} />}
      </View>
    </TouchableOpacity>
  )
}

export default SearchResult