import { MAX_BIO_CHARS } from "@/constants/appConstants";
import { inputMode } from "@/constants/customInputModeTypes";
import { useState } from "react";

export function useCheckBio(initBio?: string){
  const [bio, setBio] = useState(initBio ?? "")

  const bioInfoText = bio.length > MAX_BIO_CHARS ? `🚫 cannot be greater than ${MAX_BIO_CHARS} characters` : ``

  const bioValid: boolean = bio.length > MAX_BIO_CHARS ? false : true
  
  const bioInputMode: inputMode = !bioValid ? "warn" : "normal"


  return{
    bio,
    setBio,
    bioInfoText,
    bioInputMode,
    bioValid
  }
}