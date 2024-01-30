import { Dispatch, SetStateAction } from "react"

export type LibraryFiltersUIProps = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}
