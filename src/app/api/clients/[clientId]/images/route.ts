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
    const productId = formData.get("productId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get product to use productNumber as filename
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Determine file extension
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${params.clientId}/${product.productNumber}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "private",
      addRandomSuffix: false,
    });

    // Update product with image URL
    await prisma.product.update({
      where: { id: productId },
      data: { imageUrl: blob.url },
    });

    return NextResponse.json({ url: blob.url });
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
    const { productId } = await request.json();

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.imageUrl) {
      return NextResponse.json({ error: "No image to delete" }, { status: 404 });
    }

    // Delete from Vercel Blob
    await del(product.imageUrl);

    // Clear image URL on product
    await prisma.product.update({
      where: { id: productId },
      data: { imageUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
