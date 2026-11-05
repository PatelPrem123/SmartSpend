import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('smartspend_theme') === 'dark',
  toggleTheme: () =>
    set((state) => {
      const nextTheme = !state.isDark;
      if (nextTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('smartspend_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('smartspend_theme', 'light');
      }
      return { isDark: nextTheme };
    }),
  initTheme: () => {
    const isDark =
      localStorage.getItem('smartspend_theme') === 'dark' ||
      (!localStorage.getItem('smartspend_theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDark });
  },
}));
