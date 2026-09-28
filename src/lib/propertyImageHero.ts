import { prisma } from "./prisma";
import { canBeHero } from "./validation/propertyImage";

/**
 * Makes one PHOTO the property's hero/thumbnail and clears the flag on every
 * other image of the same property, in one transaction — so a listing never
 * has two heroes. Returns false (changing nothing) when the image doesn't
 * belong to the property or isn't a real photo.
 */
export async function setPropertyHero(propertyId: string, imageId: string): Promise<boolean> {
  const image = await prisma.propertyImage.findFirst({ where: { id: imageId, propertyId }, select: { id: true, kind: true } });
  if (!image || !canBeHero(image.kind)) return false;

  await prisma.$transaction([
    prisma.propertyImage.updateMany({ where: { propertyId, isHero: true, NOT: { id: imageId } }, data: { isHero: false } }),
    prisma.propertyImage.update({ where: { id: imageId }, data: { isHero: true } }),
  ]);
  return true;
}

export async function clearPropertyHero(propertyId: string, imageId: string): Promise<void> {
  await prisma.propertyImage.updateMany({ where: { id: imageId, propertyId }, data: { isHero: false } });
}
