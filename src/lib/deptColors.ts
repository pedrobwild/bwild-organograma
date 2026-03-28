const DEFAULT_COLORS: Record<string, { bg: string; text: string; light: string; border: string }> = {
  Diretoria: { bg: "#1B4F72", text: "#FFFFFF", light: "rgba(27,79,114,0.12)", border: "rgba(27,79,114,0.3)" },
  Jurídico: { bg: "#6C3483", text: "#FFFFFF", light: "rgba(108,52,131,0.12)", border: "rgba(108,52,131,0.3)" },
  "Business Operations": { bg: "#1A5276", text: "#FFFFFF", light: "rgba(26,82,118,0.12)", border: "rgba(26,82,118,0.3)" },
  Vendas: { bg: "#117A65", text: "#FFFFFF", light: "rgba(17,122,101,0.12)", border: "rgba(17,122,101,0.3)" },
  Marketing: { bg: "#922B21", text: "#FFFFFF", light: "rgba(146,43,33,0.12)", border: "rgba(146,43,33,0.3)" },
  Operações: { bg: "#B9770E", text: "#FFFFFF", light: "rgba(185,119,14,0.12)", border: "rgba(185,119,14,0.3)" },
  Arquitetura: { bg: "#148F77", text: "#FFFFFF", light: "rgba(20,143,119,0.12)", border: "rgba(20,143,119,0.3)" },
};

let _dynamicColors: Record<string, { bg: string; text: string; light: string; border: string }> = {};

export function setDeptColorMap(map: Record<string, { bg: string; text: string; light: string; border: string }>) {
  _dynamicColors = map;
}

export function getDeptColor(dept: string) {
  return _dynamicColors[dept] || DEFAULT_COLORS[dept] || DEFAULT_COLORS["Diretoria"];
}

// Keep DEPT_COLORS export for backwards compatibility
export const DEPT_COLORS = DEFAULT_COLORS;
