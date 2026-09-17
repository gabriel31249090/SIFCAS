import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Anexo inválido" }, { status: 400 });

  const supabase = await createClient();
  const { data: attachment, error } = await supabase
    .from("publication_attachments")
    .select("storage_path,file_name")
    .eq("id", id)
    .maybeSingle();

  if (error || !attachment) return NextResponse.json({ error: "Anexo não encontrado ou acesso negado" }, { status: 404 });

  const { data, error: signError } = await supabase.storage
    .from("institutional-files")
    .createSignedUrl(attachment.storage_path, 60, { download: attachment.file_name });

  if (signError || !data?.signedUrl) return NextResponse.json({ error: "Não foi possível liberar o arquivo" }, { status: 403 });
  return NextResponse.redirect(data.signedUrl);
}
