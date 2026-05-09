import { getProductMetadata, type ProductMetadata } from "./productMetadata";

export const WORKING_PRIORITY_PRODUCT_IDS = [
  "aceto-balsamico-di-modena",
  "bresaola-della-valtellina",
  "gorgonzola",
  "grana-padano",
  "mozzarella-di-bufala-campana",
] as const;

const workingPriorityProductIds = new Set<string>(WORKING_PRIORITY_PRODUCT_IDS);

export function isWorkingPriorityProduct(productId: string): boolean {
  return workingPriorityProductIds.has(productId);
}

export function getWorkingPriorityProductMetadata(): ProductMetadata[] {
  return getProductMetadata().filter((product) => isWorkingPriorityProduct(product.id));
}
