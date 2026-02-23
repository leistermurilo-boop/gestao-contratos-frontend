-- MIGRATION 014: RLS policies para o bucket de logos
-- O bucket foi criado como público (leitura pública automática).
-- Esta migration adiciona as policies de INSERT/UPDATE/DELETE para
-- usuários autenticados da mesma empresa.

-- INSERT: usuário autenticado pode fazer upload na pasta da sua empresa
CREATE POLICY "logos_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = (
    SELECT empresa_id::text
    FROM public.usuarios
    WHERE id = auth.uid()
  )
);

-- UPDATE: usuário autenticado pode substituir arquivos da sua empresa
CREATE POLICY "logos_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = (
    SELECT empresa_id::text
    FROM public.usuarios
    WHERE id = auth.uid()
  )
);

-- DELETE: usuário autenticado pode remover arquivos da sua empresa
CREATE POLICY "logos_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = (
    SELECT empresa_id::text
    FROM public.usuarios
    WHERE id = auth.uid()
  )
);

-- SELECT público: já garantido pelo bucket ser público,
-- mas policy explícita para evitar ambiguidade
CREATE POLICY "logos_select_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');
