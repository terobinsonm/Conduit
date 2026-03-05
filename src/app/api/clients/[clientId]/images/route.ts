import { put, del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const productId = formData.get("productId") as string | null;
    const folder = formData.get("folder") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    let filename: string;

    if (productId) {
      // Product image - use product number as filename
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      filename = `${params.clientId}/${product.productNumber}.${extension}`;

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      });

      // Update product with image URL
      await prisma.product.update({
        where: { id: productId },
        data: { imageUrl: blob.url },
      });

      return NextResponse.json({ url: blob.url });
    } else {
      // Generic image (licensed configs, etc.) - use folder + unique ID
      const folderPath = folder || "misc";
      const uniqueId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      filename = `${params.clientId}/${folderPath}/${uniqueId}.${extension}`;

      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      });

      return NextResponse.json({ url: blob.url });
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { productId, url } = await request.json();

    if (productId) {
      // Delete product image
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product || !product.imageUrl) {
        return NextResponse.json({ error: "No image to delete" }, { status: 404 });
      }

      await del(product.imageUrl);

      await prisma.product.update({
        where: { id: productId },
        data: { imageUrl: null },
      });
    } else if (url) {
      // Delete generic image by URL
      await del(url);
    } else {
      return NextResponse.json({ error: "No productId or url provided" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
