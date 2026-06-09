import { useFavorites as useFavoritesContext } from "@/context/FavoritesContext";

export function useFavorites() {
  return useFavoritesContext();
}
