export interface AlertThresholdsInterface {
  id?: string;
  sku?: string;
  category?: string;
  metric: string; // Ejemplo: "precision", "sales"
  minThreshold: number;
  maxThreshold: number;
  condition: string; // Ejemplo: "below", "above"
}
