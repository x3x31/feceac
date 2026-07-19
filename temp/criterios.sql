-- ============================================================
-- Importacao de criterios de avaliacao
-- Fonte: temp/criterios.txt (11 registros)
-- ============================================================

INSERT INTO public.criterios (id, descricao, peso, observacoes, tipo_projeto_id) VALUES
  (1, 'Uso da Metodologia Científica', 3.00,
   E'• O problema é apresentado de forma clara e precisa?\n• Se o uso de amostras de controle for necessário, o estudante soube descobrir esta necessidade? Ele utilizou esta informação de forma correta?\n• As informações coletadas foram suficientes para sustentar as conclusões apresentadas?\n• A solução é plausível em relação ao problema estudado? Como foi o processo para se chegar nessa solução?\n• Os dados coletados e os resultados da pesquisa foram adequadamente apresentados e analisados? A conclusão apresentada é coerente com os objetivos, hipótese e resultados?\n• O estudante possui planos de continuar o projeto? Se sim, qual seria a próxima fase?',
   1),
  (2, 'Criatividade e Inovação', 3.00,
   E'• O trabalho demonstra habilidade criativa e originalidade?\n• A solução proposta para o problema é inovadora?\n• A análise e interpretação dos dados demonstram criatividade?\n• O protótipo ou produto desenvolvido apresenta características inovadoras?\n• Considerando a Educação Básica, qual o grau de inovação da solução apresentada?',
   1),
  (3, 'Atitude Científica e Habilidades', 2.00,
   E'• O estudante demonstra entusiasmo e comprometimento com o projeto?\n• Demonstra capacidade para analisar criticamente dados e informações?\n• Compreende diferentes pontos de vista e situações novas?\n• Reconhece os limites do próprio projeto?\n• Consegue comparar sua experiência com trabalhos semelhantes?\n• Demonstrou iniciativa, perseverança, planejamento e capacidade de articulação?\n• Conseguiu envolver família, escola ou comunidade no desenvolvimento do projeto?',
   1),
  (4, 'Profundidade da Pesquisa', 2.00,
   E'• O problema estudado foi resolvido?\n• O estudante apresenta documentação do desenvolvimento do trabalho (diário de bordo, relatório)?\n• A documentação registra detalhadamente as atividades realizadas?\n• Há evidências de planejamento e organização?\n• As dificuldades encontradas e suas soluções foram registradas?\n• Existem comentários ou feedback do orientador?\n• Houve atualizações regulares durante o desenvolvimento da pesquisa?',
   1),
  (5, 'Clareza e Objetividade na Exposição do Projeto', 1.00,
   E'• Durante a apresentação o estudante demonstra segurança e domínio do conteúdo?\n• A apresentação oral foi organizada e coerente?\n• O material escrito demonstra conhecimento sobre o projeto?\n• As etapas do desenvolvimento foram apresentadas de forma clara e organizada?',
   1),
  (6, 'Relevância Social e Ambiental', 1.00,
   E'• O problema estudado está relacionado ao contexto social do estudante?\n• O projeto possui potencial para transformar a realidade da comunidade?\n• Foram adotadas práticas de reciclagem ou reutilização de materiais?\n• O trabalho promove educação e conscientização ambiental?\n• O projeto possui potencial de aplicação prática?',
   1),
  (7, 'Criatividade e Originalidade', 1.00,
   E'• O trabalho apresenta uma proposta inovadora?\n• A ideia desenvolvida é original e demonstra autenticidade?\n• Os estudantes apresentaram soluções ou abordagens diferenciadas em relação ao tema?',
   2),
  (8, 'Fundamentação e Pesquisa', 1.00,
   E'• Os estudantes demonstram domínio do tema apresentado?\n• O trabalho evidencia pesquisa consistente sobre aspectos históricos, culturais, científicos ou tecnológicos relacionados ao tema?\n• As informações apresentadas são claras, corretas e bem fundamentadas?',
   2),
  (9, 'Inclusão, Relevância Social e Ambiental', 1.00,
   E'• O trabalho adotou práticas de reciclagem, reutilização ou uso consciente de materiais?\n• O projeto valoriza a cultura local, regional, nacional ou outras manifestações culturais?\n• O trabalho considera aspectos de acessibilidade e inclusão para diferentes públicos?\n• A proposta demonstra relevância social e/ou ambiental?',
   2),
  (10, 'Impacto Visual e Qualidade Técnica', 1.00,
   E'• O trabalho apresenta boa qualidade visual e organização estética?\n• A apresentação desperta o interesse e a atenção do público?\n• Os estudantes demonstram domínio das técnicas utilizadas (desenho, pintura, fotografia, música, maquete, protótipo, entre outras)?\n• Os materiais e recursos empregados foram utilizados de forma adequada?',
   2),
  (11, 'Interdisciplinaridade', 1.00,
   E'• O trabalho integra conhecimentos de diferentes áreas?\n• As diferentes áreas do conhecimento estão articuladas de forma coerente?\n• A interdisciplinaridade contribui para enriquecer a compreensão do tema e a qualidade da proposta?',
   2);
