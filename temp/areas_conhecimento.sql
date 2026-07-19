-- ============================================================
-- Importacao de areas de conhecimento
-- Fonte: temp/areas_conhecimento.txt (19 registros)
-- ============================================================

INSERT INTO public.areas_conhecimento (id, nome, tipo_projeto_id) VALUES
  (1, 'Ciências Biológicas e da Saúde', 1),
  (2, 'Exatas e Engenharia', 1),
  (3, 'Linguagens e suas Tecnologias', 1),
  (4, 'Ciências Humanas e Sociais Aplicadas', 1),
  (5, 'Aplicativo', 2),
  (6, 'Artesanato', 2),
  (7, 'Cordel', 2),
  (8, 'Curta metragem', 2),
  (9, 'Desenho', 2),
  (10, 'Fotografia', 2),
  (11, 'Literatura', 2),
  (12, 'Maquete', 2),
  (13, 'Meio ambiente e sustentabilidade', 2),
  (14, 'Mural', 2),
  (15, 'Música', 2),
  (16, 'Pintura', 2),
  (17, 'Poesia autoral', 2),
  (18, 'Protótipos', 2),
  (19, 'Outro', 2)
ON CONFLICT (nome) DO NOTHING;
