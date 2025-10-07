import { getIconImage } from '@/app/(protected)/(main)/_layout';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme.web';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CustomTabIconProps = {
  name: string;
  focused: boolean;
  darkMode: boolean;
  size?: number;
};

type CustomTabLabelProps = {
  text: string;
  color: string;
  focused?: boolean;
};

function CustomTabIcon({ name, focused, darkMode, size = 21 }: CustomTabIconProps) {
  return (
    <Image
      source={getIconImage(name as any, focused, darkMode)}
      style={{
        width: size,
        height: size,
      }}
      resizeMode="contain"
    />
  );
}

function CustomTabLabel({ text, color, focused }: CustomTabLabelProps) {
  return (
    <Text
      style={[
        styles.tabLabel,
        {
          color: color,
          fontWeight: focused ? '600' : '400',
          opacity: focused ? 1 : 0.7
        }
      ]}
    >
      {text}
    </Text>
  );
}

export default function CustomFloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const mode = useColorScheme()
  const theme = useThemeColor

  const isDark = mode === 'dark';
  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const borderColor = isDark ? '#333' : '#e0e0e0';
  const shadowColor = isDark ? '#000' : '#000';

  // Separate main tabs from create tab
  const mainTabData = [
    { key: 'index', name: 'map', label: 'Map' },
    { key: 'messages', name: 'crumbs', label: 'Chat' },
    { key: 'walls', name: 'walls', label: 'Walls' },
  ];

  const createTabData = { key: 'add', name: 'add', label: 'Create' };

  const handleCreatePress = () => {
    const createRoute = state.routes.find(route => route.name === 'add');
    if (createRoute) {
      const event = navigation.emit({
        type: 'tabPress',
        target: createRoute.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate('add', createRoute.params);
      }
    }
  };

  const handleCreateLongPress = () => {
    const createRoute = state.routes.find(route => route.name === 'add');
    if (createRoute) {
      navigation.emit({
        type: 'tabLongPress',
        target: createRoute.key,
      });
    }
  };

  const isCreateFocused = state.routes[state.index]?.name === 'add';

  return (
    <View style={[styles.container, ]}>
      {/* Main Tab Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor,
            borderColor,
            shadowColor,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const tabInfo = mainTabData.find(tab => tab.key === route.name);
          if (!tabInfo) return null; // Skip the create tab here

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabButton,
                isFocused && {
                  backgroundColor: theme({}, "fadedBackground"),
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <CustomTabIcon
                  name={tabInfo.name}
                  focused={isFocused}
                  darkMode={isDark}
                  size={22}
                />
                {/* <CustomTabLabel
                  text={tabInfo.label}
                  color={theme({}, 'text')}
                  focused={isFocused}
                /> */}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Separate Create FAB */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={isCreateFocused ? { selected: true } : {}}
        accessibilityLabel="Create"
        onPress={handleCreatePress}
        onLongPress={handleCreateLongPress}
        style={[
          styles.createFab,
          {backgroundColor: theme({}, "background"),},
          isCreateFocused && {
            backgroundColor: theme({}, "fadedBackground"),
          }
        ]}
        activeOpacity={0.7}
      >
        <CustomTabIcon
          name={createTabData.name}
          focused={isCreateFocused}
          darkMode={isDark}
          size={24}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
  },
  tabBar: {
    flexDirection: 'row',
    flex: 1,
    height: 65,
    borderRadius: 35,
    borderWidth: 0,
    marginBottom: Platform.OS === 'ios' ? 10 : 20,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
    padding: 10
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    borderRadius: 30,
    marginHorizontal: 0,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
  },
  createFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 15 : 25,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
});