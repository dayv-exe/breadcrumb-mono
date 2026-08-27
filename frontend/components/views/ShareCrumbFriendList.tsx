import { UserDetails } from "@/api/models/userDetails";
import { useGetFriends } from "@/hooks/queries/useFriendsApi";
import { iRecipient } from "@/hooks/useUploadCrumbMetadata";
import { ActivityIndicator, View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import { FriendShareItem } from "../crumbs/FriendShareItem";
import CustomLabel from "../CustomLabel";
import Spacer from "../Spacer";

interface props {
  recipients: iRecipient[]
  setRecipients: (r: iRecipient[]) => void
}

export default function ShareCrumbFriendList({ recipients, setRecipients }: props) {
  const {
    data: friendsResponse,
    error: friendsError,
    isPending: friendsPending,
    hasNextPage: friendsHasNextPage,
    fetchNextPage: friendsFetchNextPage,
    isFetchingNextPage: friendsIsFetchingNextPage,
    isFetchNextPageError: friendsIsFetchingNextPageError,
    refetch: friendsRefetch,
  } = useGetFriends("", true)

  const friends: UserDetails[] = [
    ...(friendsResponse?.pages.flatMap((page) =>
      page.Friends.map((f): UserDetails => ({ ...f }))
    ) ?? []),
  ];

  function deriveFriendName(name: string | null, nickname: string | null, defaultName: string = "<no name>") {
    if (name) return name
    else if (nickname) return nickname
    else return defaultName
  }

  return (
    <View
      style={{
        paddingHorizontal: 15,
      }}
    >
      <CustomLabel labelText="Share with" fontSize={16} bold customStyle={{
        paddingHorizontal: 10,
      }} />
      <View
        style={{
          marginTop: 10,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {!friendsError && !friendsPending && friends.map(friend => {
          return (
            <FriendShareItem
              key={friend.userId}
              isSelected={recipients.some(r => r.id === friend.userId)}
              name={`${friend.currentUser ? "(Me)" : ""} ${deriveFriendName(friend.name, friend.nickname)}`}
              onChange={s => {
                if (s) {
                  // select
                  if (!friend.userId) return
                  setRecipients([...recipients, {
                    id: friend.userId!,
                    name: deriveFriendName(friend.name, friend.nickname)
                  }]);
                } else {
                  // unselect
                  setRecipients(recipients.filter((f) => f.id !== friend.userId));
                }
              }}
              userid={friend.userId ?? ""}
            />
          )
        })}
      </View>

      <View
      >
        {(friendsPending || friendsIsFetchingNextPage) &&
          <ActivityIndicator
            color={"white"}
          />
        }

        {friendsError &&
          <View
            style={{
              width: "100%",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 15,
            }}
          >
            <CustomLabel labelText="😭" fontSize={23} />
            <Spacer size="tiny" />
            <CustomLabel labelText="failed to load friends" />
            <Spacer size="small" />
            <CustomButton type="faded" freed labelText="Try Again" handleClick={friendsRefetch} disabled={friendsPending} customStyle={{
              paddingHorizontal: 10,
              paddingVertical: 7,
            }} />
          </View>
        }
      </View>

      {friendsHasNextPage && <CustomButton
        type="text"
        slim
        labelText="Load more"
        handleClick={friendsFetchNextPage}
      />}
    </View>
  )
}