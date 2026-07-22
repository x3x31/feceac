-- Migration: Trigger para remover usuario de auth.users ao excluir de public.usuarios
-- Data: 2026-07-22

-- Funcao que exclui o usuario do auth.users
CREATE OR REPLACE FUNCTION public.handle_usuario_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: AFTER DELETE na tabela usuarios
CREATE OR REPLACE TRIGGER on_usuario_deleted
  AFTER DELETE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_usuario_delete();
