import type { Focus } from "./scoring";

export type Priority = "balanced" | "prevention" | "detection" | "suppression";

export type Environment = {
  id: string;
  name: string;
  detail: string;
  kind: "point" | "region";
  o2_fraction?: number;
  pressure_kpa?: number;
  pressure_psi?: number;
  o2_fraction_min?: number;
  pressure_kpa_min?: number;
  pressure_kpa_max?: number;
  pressure_psi_min?: number;
  pressure_psi_max?: number;
  source: string;
  quote: string;
};

export type ScenarioPreset = {
  id: string;
  name: string;
  summary: string;
  environment: string;
  fuel_focus: Focus;
  priority: Priority;
};

export type StatedGap = { id: string; title: string; text: string; source: string; quote: string };

export type FamilyRef = {
  id: string;
  name: string;
  facility: string;
  fuel: string;
  text: string;
  source: string;
  quote: string;
};

export type EarthTheme = { id: string; name: string; text: string };
