import imageCompression from "browser-image-compression"

export async function compressImage(file: File): Promise<string> {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true
  }
  
  try {
    const compressedFile = await imageCompression(file, options)
    return await fileToBase64(compressedFile)
  } catch (error) {
    console.error("Error comprimiendo imagen:", error)
    throw error
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

