export const primary = {
  50: '#F0F4F9',
  100: '#DDE5F2',
  200: '#BBCBE5',
  300: '#92ACD5',
  400: '#6287C2',
  500: '#3163AF',
  600: '#0D47A1',
  700: '#0B3C89',
  800: '#093271',
  900: '#072759',
  950: '#051C40',
} as const;

export const secondary = {
  50: '#FFF6F0',
  100: '#FFEBDB',
  200: '#FFD6B8',
  300: '#FFBD8C',
  400: '#FFA059',
  500: '#FF8326',
  600: '#FF6D00',
  700: '#D95D00',
  800: '#B24C00',
  900: '#8C3C00',
  950: '#662C00',
} as const;

export const tertiary = {
  50: '#F4F5F5',
  100: '#E5E6E7',
  200: '#CBCECF',
  300: '#ADB1B3',
  400: '#8A9094',
  500: '#677074',
  600: '#495358',
  700: '#333E44',
  800: '#263238',
  900: '#1E282D',
  950: '#171E22',
} as const;

export const neutral = {
  50: '#F5F7F9',
  100: '#EEF0F2',
  200: '#E1E3E5',
  300: '#D0D2D4',
  400: '#B0B2B3',
  500: '#8E8F90',
  600: '#676869',
  700: '#454546',
  800: '#272828',
  900: '#141414',
  950: '#0A0A0A',
} as const;

export const colors = { primary, secondary, tertiary, neutral } as const;
