import 'dotenv/config';

export default {
  expo: {
    name: "Breadcrumb",
    slug: "Breadcrumb",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "breadcrumb",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.dayv-exe.Breadcrumb",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.dayvexe.breadcrumb",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "$(PRODUCT_NAME) needs access to your camera to take photos and videos.",
          "enableMicrophonePermission": true,
          "microphonePermissionText": "$(PRODUCT_NAME) needs access to your microphone to record audio."
        }
      ],
      [
        "expo-contacts",
        {
          "contactsPermission": "Allow $(PRODUCT_NAME) to access your contacts."
        }
      ],
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: process.env.SECRET_MAPBOX_KEY,
        },
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "This app needs access to location to display crumbs near you and also show your position on the map."
        },
      ],
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-secure-store",
      "expo-font",
      "expo-web-browser",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "61495ae6-1567-4d89-bf20-d8ce948ee96c",
      },
      mapboxToken: process.env.SECRET_MAPBOX_KEY,
      userPoolId: process.env.secretUserPoolId,
      clientPoolId: process.env.secretClientPoolId,
      baseUrl: process.env.secretBaseUrl,
      darkMapUrl: process.env.secretMapDarkStyleUrl,
      lightMapUrl: process.env.secretMapLightStyleUrl,
      satelliteUrl: process.env.secretMapSatelliteUrl
    },
  },
};