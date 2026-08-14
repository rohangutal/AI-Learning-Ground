import mammoth from "mammoth";

/**
 * Extracts raw text from a PDF buffer.
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamically import pdf-parse to prevent bundle-time evaluation errors
    const pdf = await import("pdf-parse");
    
    // Convert Buffer to Uint8Array as required by this version of pdf-parse
    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    
    // Instantiate PDFParse constructor
    const parser = new pdf.PDFParse(uint8Array);
    
    // Extract text directly (internally triggers loading)
    const result = await parser.getText();
    return result.text || "";
  } catch (error) {
    console.error("[Parser] Failed to parse PDF:", error);
    throw new Error(`Failed to extract text from PDF: ${(error as Error).message}`);
  }
}

/**
 * Extracts raw text from a DOCX buffer.
 */
export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("[Parser] Failed to parse DOCX:", error);
    throw new Error(`Failed to extract text from DOCX: ${(error as Error).message}`);
  }
}

/**
 * Encodes a buffer to a base64 Data URL.
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}
