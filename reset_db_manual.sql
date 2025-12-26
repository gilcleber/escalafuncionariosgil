-- 1. Deletar TODOS os shifts (turnos)
DELETE FROM shifts;

-- 2. Deletar TODOS os funcionários
DELETE FROM employees;

-- 3. Deletar TODOS os eventos
DELETE FROM events;

-- 4. Deletar TODOS os modelos de turno
DELETE FROM shift_templates;

-- 5. Se houver tabela schedule_data, limpar também
-- (Opcional, caso a tabela não exista, pode dar erro, mas o principal são os dados acima)
DELETE FROM schedule_data WHERE id = 'main';

-- NÃO EXISTEM SEQUENCES PARA RESETAR
-- (Como o erro indicou, seu banco usa UUIDs para os IDs, então não é preciso reiniciar contadores de números)
