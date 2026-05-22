import { NextRequest, NextResponse } from 'next/server';
const pdfParse = require('pdf-parse');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = '';
    const fileType = file.type || file.name.split('.').pop()?.toLowerCase();

    if (fileType === 'application/pdf' || fileType === 'pdf') {
      // Parse PDF
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else if (
      fileType === 'text/plain' ||
      fileType === 'txt' ||
      fileType === 'text/markdown' ||
      fileType === 'md'
    ) {
      // Parse Text/Markdown
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or TXT file.' },
        { status: 400 }
      );
    }

    // Clean up text slightly (remove excessive newlines/spaces)
    const cleanedText = text
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    return NextResponse.json({ text: cleanedText, name: file.name, type: fileType });
  } catch (error: any) {
    console.error('Error parsing document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse document' },
      { status: 500 }
    );
  }
}
