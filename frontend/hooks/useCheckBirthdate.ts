import { MAX_AGE, MAX_RIDICULOUS_AGE, MIN_AGE } from "@/constants/appConstants";
import { useState } from "react";

export function useCheckBirthdate() {
  const [rawBirthdate, setBirthdate] = useState(new Date())

  const formatDate = (date: Date) =>
    `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear()}`;

  const today = new Date();

  function getAge(): number {
    let age = today.getFullYear() - rawBirthdate.getFullYear();
    const monthDiff = today.getMonth() - rawBirthdate.getMonth();
    const dayDiff = today.getDate() - rawBirthdate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      // to adujust for when bday hasnt happened yet
      age--;
    }

    return age
  }

  function validateBirthdate(): { isValid: boolean, reason: string } {
    let age = getAge()
    if (age < 0) {
      return {
        isValid: false,
        reason: `Unfortunately, you haven't been born yet 😬`
      }
    } else if (age > MAX_RIDICULOUS_AGE) {
      return {
        isValid: false,
        reason: "😂 lol"
      }
    } else if (age > MAX_AGE) {
      return {
        isValid: false,
        reason: `💀💀💀 Unfortunately, you need to be alive to use this app `
      }
    } else if (age < MIN_AGE) {
      return {
        isValid: false,
        reason: "😬 Unfortunately, you're too young to use this app, come back in a few years"
      }
    }

    return {
      isValid: true,
      reason: ""
    }
  }

  return {
    rawBirthdate,
    setBirthdate,
    getAge,
    validateBirthdate,
    birthdateToString: formatDate
  }

}