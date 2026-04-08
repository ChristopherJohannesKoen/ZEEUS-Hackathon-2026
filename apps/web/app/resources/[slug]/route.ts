import { NextResponse } from 'next/server';
import { getPublicResourceFile } from '../../../lib/public-resource-files';

type Params = Promise<{ slug: string }>;

export async function GET(_request: Request, context: { params: Params }) {
  const { slug } = await context.params;
  const resource = getPublicResourceFile(slug);

  if (!resource) {
    return new NextResponse('Resource not found.', { status: 404 });
  }

  return new NextResponse(resource.content, {
    status: 200,
    headers: {
      'Content-Type': resource.mimeType,
      'Content-Disposition': `attachment; filename="${resource.fileName}"`,
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
