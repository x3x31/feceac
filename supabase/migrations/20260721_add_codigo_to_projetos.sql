-- Migration: Adicionar campo codigo a tabela projetos
-- Data: 2026-07-21

-- Adiciona a coluna codigo (nullable para dados existentes)
ALTER TABLE public.projetos ADD COLUMN codigo text;

-- Gera codigos automaticos para projetos existentes (Formato: FEC-AAAA-NNNN)
-- Ex: FEC-2026-0001
UPDATE public.projetos
SET codigo = 'FEC-' || ano || '-' || LPAD(id::text, 4, '0')
WHERE codigo IS NULL;

-- Torna o campo unico e nao nulo apos popular os existentes
ALTER TABLE public.projetos ALTER COLUMN codigo SET NOT NULL;
ALTER TABLE public.projetos ADD CONSTRAINT projetos_codigo_unique UNIQUE (codigo);

-- RLS: Nao precisa de politicas novas pois a tabela projetos ja tem RLS habilitado
-- e as politicas existentes de SELECT/INSERT/UPDATE ja cobrem a nova coluna.
