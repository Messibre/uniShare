import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { verifyAccessToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Multer needs the raw Node request stream, so Next's body parser is disabled.
export const config = {
  api: { bodyParser: false },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("INVALID_FILE_TYPE"));
    }
  },
});

type MulterRequest = NextApiRequest & { file?: Express.Multer.File };

function runMulter(req: MulterRequest, res: NextApiResponse) {
  return new Promise<void>((resolve, reject) => {
    upload.single("file")(req as never, res as never, (err?: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function uploadToCloudinary(buffer: Buffer) {
  return new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "unishare/items",
          resource_type: "image",
          transformation: [{ width: 1600, height: 1600, crop: "limit" }],
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve(result);
        },
      );
      stream.end(buffer);
    },
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    verifyAccessToken(token);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await runMulter(req as MulterRequest, res);
  } catch (error) {
    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Image must be 5MB or smaller"
          : error.message;
      return res.status(400).json({ error: message });
    }
    if (error instanceof Error && error.message === "INVALID_FILE_TYPE") {
      return res
        .status(400)
        .json({ error: "Only JPG, PNG or WebP images are allowed" });
    }
    logger.error({ err: error }, "POST /api/v1/upload multer error");
    return res.status(400).json({ error: "Could not read the uploaded file" });
  }

  const file = (req as MulterRequest).file;
  if (!file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  if (!process.env.CLOUDINARY_URL) {
    logger.error({}, "CLOUDINARY_URL is not configured");
    return res.status(500).json({ error: "Image storage is not configured" });
  }

  try {
    const result = await uploadToCloudinary(file.buffer);
    return res
      .status(201)
      .json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    logger.error({ err: error }, "POST /api/v1/upload cloudinary error");
    return res.status(502).json({ error: "Failed to upload image" });
  }
}
