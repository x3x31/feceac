-- ============================================================
-- RLS: Habilitar perfil Aluno a cadastrar e editar projetos
-- Problema: "new row violates row-level security policy for table projetos"
-- Causa:politicas RLS so permitiam INSERT/UPDATE para Administrador e Professor,
--        mas o frontend libera cadastrar-projeto.html para Aluno.
-- ============================================================

-- 1. projetos: permitir INSERT e UPDATE para Aluno
CREATE POLICY "projetos_aluno_insert" ON public.projetos
FOR INSERT TO authenticated
WITH CHECK (public.get_tipo_usuario() = 'Aluno');

CREATE POLICY "projetos_aluno_update" ON public.projetos
FOR UPDATE TO authenticated
USING (public.get_tipo_usuario() = 'Aluno')
WITH CHECK (public.get_tipo_usuario() = 'Aluno');

-- 2. projeto_alunos: permitir gerenciamento de alunos do projeto para Aluno
CREATE POLICY "projeto_alunos_aluno_all" ON public.projeto_alunos
FOR ALL TO authenticated
USING (public.get_tipo_usuario() = 'Aluno')
WITH CHECK (public.get_tipo_usuario() = 'Aluno');

-- 3. alunos: permitir INSERT/UPDATE para Aluno (cadastro de novos alunos no projeto)
CREATE POLICY "alunos_aluno_insert" ON public.alunos
FOR INSERT TO authenticated
WITH CHECK (public.get_tipo_usuario() = 'Aluno');

CREATE POLICY "alunos_aluno_update" ON public.alunos
FOR UPDATE TO authenticated
USING (public.get_tipo_usuario() = 'Aluno')
WITH CHECK (public.get_tipo_usuario() = 'Aluno');
