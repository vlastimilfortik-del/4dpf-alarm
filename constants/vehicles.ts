import { Feather } from "@expo/vector-icons";

export interface VehicleBrand {
  id: string;
  name: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

export const VEHICLE_BRANDS: VehicleBrand[] = [
  {
    id: "vw",
    name: "Volkswagen",
    icon: "circle",
    color: "#00A0DE",
  },
  {
    id: "audi",
    name: "Audi",
    icon: "circle",
    color: "#BB0A30",
  },
  {
    id: "skoda",
    name: "Skoda",
    icon: "circle",
    color: "#4BA82E",
  },
  {
    id: "seat",
    name: "Seat",
    icon: "circle",
    color: "#E53935",
  },
  {
    id: "cupra",
    name: "Cupra",
    icon: "circle",
    color: "#95572B",
  },
];

export const getVehicleBrand = (id: string): VehicleBrand | undefined => {
  return VEHICLE_BRANDS.find((brand) => brand.id === id);
};
