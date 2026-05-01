
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS dia_pagamento_1 integer,
  ADD COLUMN IF NOT EXISTS dia_pagamento_2 integer;

ALTER TABLE public.colaboradores
  ADD CONSTRAINT colaboradores_dia_pagamento_1_check CHECK (dia_pagamento_1 IS NULL OR (dia_pagamento_1 BETWEEN 1 AND 31)),
  ADD CONSTRAINT colaboradores_dia_pagamento_2_check CHECK (dia_pagamento_2 IS NULL OR (dia_pagamento_2 BETWEEN 1 AND 31));

ALTER TABLE public.beneficios_colaborador
  ADD COLUMN IF NOT EXISTS dia_pagamento integer;

ALTER TABLE public.beneficios_colaborador
  ADD CONSTRAINT beneficios_dia_pagamento_check CHECK (dia_pagamento IS NULL OR (dia_pagamento BETWEEN 1 AND 31));

ALTER TABLE public.politicas_comissao
  ADD COLUMN IF NOT EXISTS dia_pagamento integer;

ALTER TABLE public.politicas_comissao
  ADD CONSTRAINT comissoes_dia_pagamento_check CHECK (dia_pagamento IS NULL OR (dia_pagamento BETWEEN 1 AND 31));
