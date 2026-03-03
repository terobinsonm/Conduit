import SFTPClient from "ssh2-sftp-client";
import { Client } from "@prisma/client";

interface SFTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  basePath: string;
}

function getSftpConfig(client: Client): SFTPConfig | null {
  if (!client.sftpHost || !client.sftpUsername || !client.sftpPassword) {
    return null;
  }

  return {
    host: client.sftpHost,
    port: client.sftpPort || 22,
    username: client.sftpUsername,
    password: client.sftpPassword,
    basePath: client.sftpBasePath || "/images",
  };
}

export async function uploadImage(
  client: Client,
  buffer: Buffer,
  productNumber: string,
  extension: string
): Promise<{ success: boolean; remotePath?: string; publicUrl?: string; error?: string }> {
  const config = getSftpConfig(client);

  if (!config) {
    return { success: false, error: "SFTP not configured for this client" };
  }

  const sftp = new SFTPClient();

  try {
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
    });

    // Filename must match productNumber exactly
    const filename = `${productNumber}.${extension}`;
    const remotePath = `${config.basePath}/${filename}`;

    // Ensure directory exists
    const dir = config.basePath;
    const dirExists = await sftp.exists(dir);
    if (!dirExists) {
      await sftp.mkdir(dir, true);
    }

    // Upload file
    await sftp.put(buffer, remotePath);

    // Construct public URL
    const baseUrl = process.env.IMAGE_BASE_URL || "https://images.repspark.net";
    const publicUrl = `${baseUrl}/${client.slug}/${filename}`;

    return {
      success: true,
      remotePath,
      publicUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SFTP upload failed",
    };
  } finally {
    try {
      await sftp.end();
    } catch {
      // Ignore close errors
    }
  }
}

export async function deleteImage(
  client: Client,
  remotePath: string
): Promise<{ success: boolean; error?: string }> {
  const config = getSftpConfig(client);

  if (!config) {
    return { success: false, error: "SFTP not configured for this client" };
  }

  const sftp = new SFTPClient();

  try {
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
    });

    await sftp.delete(remotePath);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SFTP delete failed",
    };
  } finally {
    try {
      await sftp.end();
    } catch {
      // Ignore close errors
    }
  }
}

export async function testSftpConnection(
  client: Client
): Promise<{ success: boolean; error?: string }> {
  const config = getSftpConfig(client);

  if (!config) {
    return { success: false, error: "SFTP not configured" };
  }

  const sftp = new SFTPClient();

  try {
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
    });

    // Try to list the base directory
    await sftp.list(config.basePath).catch(async () => {
      // Directory might not exist, try to create it
      await sftp.mkdir(config.basePath, true);
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SFTP connection failed",
    };
  } finally {
    try {
      await sftp.end();
    } catch {
      // Ignore close errors
    }
  }
}
