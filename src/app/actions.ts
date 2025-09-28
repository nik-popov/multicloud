'use server';

import {validateAndFilterUrls} from '@/ai/flows/validate-and-filter-urls';
import {z} from 'zod';
import { storage } from '@/lib/firebase-admin';
import AWS from 'aws-sdk';
import { google } from 'googleapis';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const actionSchema = z.object({
  urls: z.array(z.string().min(1, {message: 'URL cannot be empty.'})).min(1),
});

export type ValidationState = {
  validUrls: string[];
  errors: string[] | null;
};

export async function validateUrlsAction(
  urls: string[]
): Promise<ValidationState> {
  const validatedFields = actionSchema.safeParse({urls});

  if (!validatedFields.success) {
    return {
      validUrls: [],
      errors: validatedFields.error.errors.map(e => e.message),
    };
  }

  try {
    const result = await validateAndFilterUrls({
      urls: validatedFields.data.urls,
    });

    const validUrls = result.validatedUrls
      .filter(item => item.isValid)
      .map(item => item.originalUrl);

    return {validUrls, errors: null};
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      validUrls: [],
      errors: [`An error occurred during validation: ${errorMessage}`],
    };
  }
}

export async function uploadFilesAction(formData: FormData) {
  const files = formData.getAll('files') as File[];
  const urls: string[] = [];

  for (const file of files) {
    const bucket = storage.bucket();
    const destination = `uploads/${file.name}`;
    await bucket.upload(file.path, {
      destination,
    });
    const uploadedFile = bucket.file(destination);
    const [url] = await uploadedFile.getSignedUrl({
      action: 'read',
      expires: '03-09-2491',
    });
    urls.push(url);
  }

  return { urls };
}

export async function importFromS3Action(formData: FormData) {
  const accessKeyId = formData.get('accessKeyId') as string;
  const secretAccessKey = formData.get('secretAccessKey') as string;
  const bucketName = formData.get('bucketName') as string;
  const endpoint = formData.get('endpoint') as string;

  const s3 = new AWS.S3({
    accessKeyId,
    secretAccessKey,
    endpoint,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
  });

  const { Contents } = await s3.listObjectsV2({ Bucket: bucketName }).promise();

  if (!Contents) {
    return { urls: [] };
  }

  const urls = Contents.map((file) => {
    return s3.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: file.Key,
      Expires: 60 * 60 * 24 * 7, // 1 week
    });
  });

  return { urls };
}

export async function importFromGoogleDriveAction() {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Unauthorized');
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const { data } = await drive.files.list({
    pageSize: 100,
    fields: 'files(id, name, webViewLink, webContentLink)',
    q: "mimeType contains 'video/'",
  });

  if (!data.files) {
    return { urls: [] };
  }

  const urls = data.files.map((file) => file.webContentLink || file.webViewLink);

  return { urls };
}
