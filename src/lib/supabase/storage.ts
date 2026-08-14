import { createClient } from "@/lib/supabase/server";

export async function uploadFile(file: File, bucket: string, path: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    path: data.path,
    publicUrl: publicUrlData.publicUrl,
  };
}

export async function deleteFile(bucket: string, path: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }

  return true;
}
