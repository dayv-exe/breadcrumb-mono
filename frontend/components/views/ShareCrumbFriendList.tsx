import { UserDetails } from "@/api/models/userDetails";
import { useGetFriends } from "@/hooks/queries/useFriendsApi";
import { useGetUser } from "@/hooks/queries/useUserApi";
import { iRecipient } from "@/hooks/useShareCrumb";
import { View } from "react-native";
import CustomButton from "../buttons/CustomButton";
import { FriendShareItem } from "../crumbs/FriendShareItem";
import CustomLabel from "../CustomLabel";

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
  } = useGetFriends("")

  const {
    data: currentUser,
    error: currentUserError,
    isPending: currentUserPending,
  } = useGetUser("")

  type FriendOption = {
    isCurrentUser: boolean
  } & UserDetails;

  const friends: FriendOption[] = [
    { ...currentUser!, isCurrentUser: true },
    ...(friendsResponse?.pages.flatMap((page) =>
      page.Friends.map((f): FriendOption => ({ ...f, isCurrentUser: false }))
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
        {friends.map(friend => {
          return (
            <FriendShareItem
              key={friend.userId}
              isSelected={recipients.some(r => r.id === friend.userId)}
              name={`${friend.userId === currentUser?.userId ? "(Me)" : ""} ${deriveFriendName(friend.name, friend.nickname)}`}
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

      {friendsHasNextPage && <CustomButton
        type="text"
        slim
        labelText="Load more"
        handleClick={friendsFetchNextPage}
      />}
    </View>
  )
}