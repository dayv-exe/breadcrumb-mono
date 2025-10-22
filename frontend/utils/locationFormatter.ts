import * as Location from 'expo-location';
import { Platform } from 'react-native';

function getCountryFlag(countryCode?: string): string {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function formatAddress(location: Location.LocationGeocodedAddress, showSecondaryAddress: boolean = true, showCountryFlag = false) {
  let address: string | null = null

  if (Platform.OS === "android") {
    if (location.formattedAddress) {
      address = location.formattedAddress.split(',')[0]
    }
  } else if (Platform.OS === "ios") {
    if (location.name) {
      address = location.name.split(",")[0]
    }
  }

  if (address && showSecondaryAddress) {
    if (location.city && location.city !== address) {
      address += `, ${location.city}`;
    } else if (location.district && location.district !== address) {
      address += `, ${location.district}`;
    } else if (location.subregion && location.subregion !== address) {
      address += `, ${location.subregion}`;
    } else if (location.region && location.region !== address) {
      address += `, ${location.region}`;
    }
  }

  if (!address) {
    if (location.street) {
      address = location.street

      if (showSecondaryAddress) {
        if (location.city) {
          address += `, ${location.city}`;
        } else if (location.district) {
          address += `, ${location.district}`;
        } else if (location.region) {
          address += `, ${location.region}`;
        }
      }

    } else if (location.city) {
      address = location.city
      if (location.country) {
        address += `, ${location.country}`;
      }
    } else if (location.country) {
      address = location.country
    }
  }

  if (address) {
    if (showCountryFlag) {
      const flag = getCountryFlag(location.isoCountryCode || '');
      if (flag) {
        address = `${flag} ${address}`;
      }
    } else {
      address = `📍 ${address}`;
    }
  }

  return address
}