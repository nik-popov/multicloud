'use server';

type ImportResult = {
  urls: string[];
};

export async function importFromS3Action(formData: FormData): Promise<ImportResult> {
  const bucketName = formData.get('bucketName')?.toString().trim();
  const endpoint = formData.get('endpoint')?.toString().trim();

  if (!bucketName) {
    return { urls: [] };
  }

  const baseUrl = (endpoint && endpoint.trim().length > 0)
    ? endpoint.replace(/\/$/, '')
    : `https://${bucketName}.example.com`;

  return {
    urls: [`${baseUrl}/sample-video.mp4`],
  };
}

export async function importFromGoogleDriveAction(): Promise<ImportResult> {
  return {
    urls: ['https://drive.google.com/uc?id=sample-video-file'],
  };
}
