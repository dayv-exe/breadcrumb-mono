import { UserDetails } from "@/api/models/userDetails";
import { Section } from "@/components/views/ElevatedSectionedScrollView";
import SearchResult from "@/components/views/SearchResult";
import { debounce } from "@/utils/debounce";
import { useMemo, useState } from "react";
import { useSearchUserApi } from "./queries/useUserApi";

interface SearchUserState {
  searchStr: string
  setSearchStr: (s: string) => void
  searchPending: boolean
  searchFailed: boolean
  searchError: Error | null
  users: UserDetails[] | undefined
  section: Section
}

export function useSearchUser(): SearchUserState {
  const [searchStr, setSearchStr] = useState("")
  const [debouncedSearchStr, setDebouncedSearchStr] = useState("")

  const debounceInput = useMemo(() => {
    return debounce((value: string) => {
      setDebouncedSearchStr(value);
    }, 300);
  }, []);
  const {
    data: search,
    isPending: searchPending,
    isError,
    error: searchErr
  } = useSearchUserApi(debouncedSearchStr.trim())

  const section: Section =
  {
    key: "users",
    type: "paginated",
    hidden: (search?.length ?? 0) < 1,
    title: "People",
    data: search ?? [],
    hasMore: false,
    isFetchingMore: searchPending,
    keyExtractor: (user: UserDetails) => user.userId!,
    renderItem: (user: UserDetails) => (
      <SearchResult data={{ type: 'user', user }} onSelect={() => { }} />
    ),
    onEndReached: () => { }
  }

  return {
    searchFailed: isError,
    searchError: searchErr,
    searchPending: searchPending,
    searchStr,
    section,
    setSearchStr: (s) => {
      setSearchStr(s)
      debounceInput(s)
    },
    users: search
  }
}