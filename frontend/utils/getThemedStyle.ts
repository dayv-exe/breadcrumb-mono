import { useColorScheme } from '@/hooks/useColorScheme';

type Theme = 'light' | 'dark';
export function useThemedStyle<T extends Record<string, any>>(styles: T, baseKey: string): T[keyof T] {
  const theme: Theme = useColorScheme() ?? 'light';
  const key = `${theme}${capitalize(baseKey)}` as keyof T;

  return styles[key];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
