const MASTER_URL = process.env.SEAWEEDFS_MASTER_URL;
const PUBLIC_URL =
  process.env.SEAWEEDFS_PUBLIC_URL ||
  (MASTER_URL ? MASTER_URL.replace("9333", "8080") : undefined);

interface UploadIntent {
  uploadUrl: string;
  fileId: string;
  publicUrl: string;
}

export async function requestSeaweedUploadIntent(
  filename: string,
  mimeType: string,
): Promise<UploadIntent> {
  if (!MASTER_URL) {
    throw new Error("SEAWEEDFS_MASTER_URL is not configured");
  }

  const assignRes = await fetch(
    `${MASTER_URL.replace(/\/$/, "")}/dir/assign?count=1&pretty=y`,
  );
  if (!assignRes.ok) {
    throw new Error("SeaweedFS assign request failed");
  }
  const assign = (await assignRes.json()) as {
    fileId: string;
    url: string;
    publicUrl?: string;
  };

  const fileId = assign.fileId;
  const uploadUrl = `http://${assign.url}/${fileId}`;

  const publicUrl =
    assign.publicUrl || (PUBLIC_URL ? `${PUBLIC_URL}/${fileId}` : uploadUrl);

  await fetch(uploadUrl, {
    method: "HEAD",
    headers: {
      "X-Requested-Filename": filename,
      "X-Requested-Content-Type": mimeType,
    },
  }).catch(() => {
    /* fire-and-forget meta hint */
  });

  return { uploadUrl, fileId, publicUrl };
}

export function buildSeaweedPublicUrl(objectPath: string) {
  if (objectPath.startsWith("http")) return objectPath;
  if (!PUBLIC_URL) return objectPath;
  return `${PUBLIC_URL.replace(/\/$/, "")}/${objectPath.replace(/^\//, "")}`;
}

