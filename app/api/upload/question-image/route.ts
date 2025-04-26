import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const filename = formData.get("filename") as string

    if (!file || !filename) {
      return NextResponse.json(
        { error: "File or filename is missing" },
        { status: 400 }
      )
    }

    // Create the upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "images", "soal")

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Write file to the filesystem
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, fileBuffer)

    // Return success response with filename
    return NextResponse.json({ filename })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
} 
