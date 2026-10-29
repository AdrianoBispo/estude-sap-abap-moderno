# Usando Code Pushdown em CDS Views (Expressões SQL)

![Infográfico - Code Pushdown com ABAP CDS](./02.06_Code_Pushdown_com_ABAP_CDS.png)

> **Comece pelos slides: [Code pushdown em CDS views](./02.06_Code_pushdown_em_CDS_views.pptx)**
>
> Material complementar em PDF: [O Fim do LOOP: Dominando o Code Pushdown em ABAP CDS com Expressões SQL](./02.06_O_Fim_do_LOOP_Code_Pushdown_em_ABAP_CDS.pdf)
>
> **Referência oficial (ABAP Keyword Documentation):** [CDS DDL - CDS View Entity, Built-In Functions](https://help.sap.com/docs/abap-cloud/abap-keywords/cds-ddl-cds-view-entity-built-in-functions)

## Objetivos de Aprendizagem

- Aplicar lógica condicional complexa com **CASE Expressions** diretamente na CDS View, substituindo estruturas de controle ABAP (IF/ELSEIF) por lógica de banco de dados.  

- Realizar cálculos aritméticos avançados e manipulação de datas utilizando funções nativas como dats_days_between, dats_add_days e operações matemáticas.  

- Converter tipos de dados explicitamente utilizando a instrução **CAST**, garantindo a integridade dos dados em operações de cálculo e uniões.  

- Utilizar **Variáveis de Sessão** ($session.system_date, $session.user, $session.system_language) para criar views dinâmicas que respondem ao contexto do usuário logado.

- Definir e consumir **CDS views com parâmetros de entrada**, inclusive repassando parâmetros entre views.

## 1. O Poder das Expressões SQL e o Fim do Loop

No desenvolvimento ABAP clássico, o banco de dados era visto apenas como um repositório passivo. O padrão era: "Selecionar todos os dados brutos, transferi-los para o servidor de aplicação, armazenar em tabelas internas e então iterar (LOOP) para realizar cálculos linha a linha".

* **O Problema (Data-to-Code):** Essa abordagem gera um tráfego de rede imenso e subutiliza a capacidade de processamento paralelo do banco de dados. Se você precisa calcular o "Valor Total com Imposto" de 1 milhão de registros, trazer tudo para o ABAP consome memória e CPU desnecessariamente.

* **A Solução (Code Pushdown com CDS):** Com o Code Pushdown, transferimos essa lógica para a definição da View. O banco de dados (HANA) realiza os cálculos durante a leitura. O ABAP recebe apenas o resultado final processado.

* **Vantagem de Performance:** O cálculo ocorre onde os dados residem. O HANA pode paralelizar a operação em múltiplos núcleos.
  
* **Vantagem de Manutenção:** A regra de negócio (ex: como calcular um status) fica centralizada na View, reutilizável por qualquer consumidor (Relatório, App Fiori, API), em vez de estar escondida dentro de um método ABAP específico.

## 2. Lógica Condicional: CASE Expressions

O comando `CASE` é o equivalente SQL para o `IF...ELSEIF...ELSE` do ABAP. Ele permite criar colunas calculadas cujo valor depende de condições lógicas em outros campos da linha.

### Sintaxe Básica e Avançada

Podemos usar o CASE simples (comparando um campo) ou o CASE complexo (com múltiplas condições distintas).

#### Exemplo - Traduzindo Códigos Técnicos para Textos de Negócio

``` CDS
case overall_status  
  when 'O' then 'Em Aberto'  
  when 'A' then 'Aceito'  
  when 'X' then 'Cancelado'  
  else 'Desconhecido' -- Fallback para valores inesperados  
end as StatusText
```

#### Exemplo - Criticality (Cores no Fiori)

Um uso extremamente comum no RAP é definir a "Criticidade" de uma linha. O Fiori Elements entende valores numéricos (`0=Neutro`, `1=Negativo`, `2=Crítico`, `3=Positivo`) para colorir textos e ícones.

``` CDS
/* Lógica de Negócio para Cores */  

case   
  when overall_status = 'X' then 1  -- Vermelho (Erro)  
  when overall_status = 'O' and dats_days_between($session.system_date, begin_date) < 7 then 2 -- Amarelo (Aberta e começa em menos de 7 dias)  
  when overall_status = 'A' then 3  -- Verde (Sucesso)  
  else 0                            -- Cinza (Neutro)  
end as StatusCriticality
```

*Dica:* Observe como combinamos uma comparação simples (`=`) com uma função de data (`dats_days_between`) dentro da condição `WHEN`. O CDS permite essa flexibilidade. Atenção: as funções `dats_*` exigem campos do tipo data (`DATS`); para timestamps (ex: `created_at`), use as funções `tstmp_*` ou converta antes com `tstmp_to_dats`.

## 3. Funções de Data, Aritmética e String

O ABAP CDS oferece uma biblioteca rica de funções integradas que eliminam a necessidade de processamento posterior no ABAP.

### Aritmética

Podemos realizar as quatro operações básicas e usar funções matemáticas. O CDS lida automaticamente com nulos (se um operando for `NULL`, o resultado é `NULL`).

* **Operadores:** `+`, `-`, `*`, `/` (divisão não inteira — não pode ser usada entre dois operandos inteiros; nesse caso use `div()` ou `division( a, b, casas_decimais )`).  
* **Funções:** `div(a, b)` (Divisão inteira), `mod(a, b)` (Resto), `abs(x)` (Valor absoluto), `ceil(x)` (Arredondar para cima), `floor(x)` (Arredondar para baixo).

``` CDS
/* Exemplo: Calcular valor com margem de segurança */  
ceil( ( total_price * 1.1 ) ) as PriceWithMargin
```

### Datas e Timestamps

Manipular datas no banco é essencial para relatórios de envelhecimento (Aging) ou duração.

* **`dats_days_between`( data_inicio, data_fim ):** Retorna um inteiro com a diferença em dias.  
* **`dats_add_days`( data, dias ):** Adiciona (ou subtrai) dias a uma data.  
* **`tstmp_current_utctimestamp()`:** Retorna o timestamp atual (Data+Hora) em UTC.

``` CDS
/* Calcular Data de Vencimento (30 dias após criação) */  
dats_add_days( begin_date, 30 ) as DueDate
```

### Variáveis de Sessão (`$session`)

No ABAP SQL clássico, usávamos `sy-datum` ou `sy-uname`. No DDL (definição da view), não podemos acessar variáveis do programa ABAP diretamente. Usamos as variáveis de sessão providas pelo banco de dados:

* **`$session.user`:** O ID do usuário logado. Útil para filtros "Meus Documentos".  
* **`$session.client`:** O mandante atual (MANDT). Geralmente tratado automaticamente.  
* **`$session.system_language`:** O idioma de logon. Usado para selecionar textos.  
* **`$session.system_date`:** A data atual do servidor.

``` CDS
/* Flag: É minha viagem? */
case   
  when created_by = $session.user then 'X'   
  else ''   
end as IsMyTravel
```

## 4. Conversão de Tipos: `CAST`

O comando `CAST` é vital quando precisamos alinhar tipos de dados. O ABAP e o SQL são estritos quanto à tipagem (Type Safety).

### Cenários Comuns:

- **Cálculos Aritméticos:** Às vezes, multiplicar um Inteiro por um Decimal pode exigir conversão explícita para evitar overflow ou perda de precisão.

- **Concatenação:** Não é possível concatenar um número com uma string diretamente. É preciso converter o número para char/string primeiro.
  
- **Uniões (`UNION`):** Ao unir duas tabelas, as colunas correspondentes devem ter tipos compatíveis.

- **Sintaxe:** cast( expressão as TipoDestino )

  - Tipos de destino comuns no CDS:
    * `abap.char(len)`
    * `abap.numc(len)`
    * `abap.int4`
    * `abap.dec(len, decimals)` (ponto fixo — recomendado para valores monetários)
    * `abap.fltp` (ponto flutuante binário — útil para cálculos científicos/estatísticos, mas sujeito a erros de arredondamento; evite para dinheiro)

#### Exemplos:

``` CDS
/* Convertendo Preço para Decimal com mais dígitos, evitando overflow em cálculos */
cast( total_price as abap.dec(17,2) ) as PriceDecimal

/* Convertendo para Char para uso em string */
cast( travel_id as abap.char(8) ) as TravelIdChar
```

## 5. Exemplo Prático: Enriquecendo a View de Viagens

Vamos aplicar todos esses conceitos na nossa *Interface View `Z_I_TRAVEL_COMPUTED`*. Imagine que precisamos de campos calculados para suportar uma interface Fiori rica em informações visuais.

``` CDS
@AccessControl.authorizationCheck: #NOT_REQUIRED  
@EndUserText.label: 'Viagens com Cálculos Avançados'  
define view entity Z_I_TRAVEL_COMPUTED  
  as select from zrap_travel  

{  

  key travel_uuid,  
      travel_id,  
      begin_date,  
      end_date,  
      total_price,  
      booking_fee,  
      currency_code,  
      overall_status,  
      created_by,

      /* --- 1. Aritmética e Conversão --- */  
      /* Calcula o Custo Total Real (Preço + Taxa) */  
      /* O CAST para decimal (ponto fixo) mantém a precisão monetária e evita overflow */  
      @Semantics.amount.currencyCode: 'currency_code'  
      cast( total_price as abap.dec(17,2) ) + cast( booking_fee as abap.dec(17,2) ) as GrandTotal,

      /* --- 2. Funções de Data --- */  
      /* Calcula a duração da viagem em dias */  
      dats_days_between( begin_date, end_date ) as DurationDays,

      /* Verifica quantos dias faltam para o início (ou se já passou) */  
      dats_days_between( $session.system_date, begin_date ) as DaysUntilStart,

      /* --- 3. Lógica Condicional (Criticality) --- */  
      /* Define a cor do status para o Fiori (3=Verde, 2=Amarelo, 1=Vermelho) */  
      case overall_status  
        when 'A' then 3  -- Aceito (Verde)  
        when 'O' then 2  -- Aberto (Amarelo)  
        when 'X' then 1  -- Cancelado (Vermelho)  
        else 0           -- Desconhecido (Cinza)  
      end as StatusCriticality,

      /* --- 4. Variável de Sessão e Lógica Booleana --- */  
      /* Cria um indicador visual se a viagem já aconteceu (Histórico) */  
      case   
        when begin_date < $session.system_date then 'X'  
        else ''  
      end as IsPastTravel,  
        
      /* Verifica se o usuário atual é o dono do registro */  
      case   
        when created_by = $session.user then 'X'  
        else ''  
      end as IsCreatedByMe
}
```

## 6. Agregações (`SUM`, `MAX`, `MIN`)

Embora as _Interface Views_ (como a acima) geralmente retornem uma linha para cada registro da tabela (granularidade 1:1), o CDS também é poderoso para criar views analíticas (OLAP). Para isso, usamos funções de agregação e a cláusula `GROUP BY`.

* **Regra do `GROUP BY`:** Se você usar uma função de agregação (`SUM`, `COUNT`, `AVG`, `MIN`, `MAX`) em qualquer campo da lista de seleção, **todos** os outros campos que não são agregados devem obrigatoriamente constar na cláusula `GROUP BY`.

``` CDS
@EndUserText.label: 'Estatísticas de Viagem por Cliente'  
define view entity Z_I_TRAVEL_STATS  
  as select from zrap_travel  

{  
  /* Chave do Agrupamento: cliente + moeda identificam cada linha do resultado */  

  key customer_id,  
  key currency_code as CurrencyCode,  
        
      /* Agregações */  
      count(*) as NumberOfTravels,  
        
      @Semantics.amount.currencyCode: 'CurrencyCode'  
      sum( total_price ) as TotalSpent,  
        
      avg( total_price as abap.dec(15,2) ) as AverageTicketPrice  
}

/* Agrupamento Obrigatório */  
group by customer_id, currency_code
```

**Nota:** Neste exemplo, se um cliente tiver viagens em EUR e USD, ele aparecerá em duas linhas diferentes (uma para cada moeda), pois `currency_code` faz parte do grupo.

## 7. CDS Views com Parâmetros de Entrada

Um `WHERE` é opcional para o consumidor. **Parâmetros de entrada** permitem que a view **exija** uma informação e a use nos cálculos: a moeda de destino de uma conversão, uma data de corte antes de uma agregação, o idioma de um texto.

``` ABAP
define view entity ZI_FlightsFrom
  with parameters
    P_MinDate : abap.dats
  as select from /dmo/flight
{
  key carrier_id                 as AirlineID,
  key connection_id              as ConnectionID,
  key flight_date                as FlightDate,
      seats_max - seats_occupied as FreeSeats
}
where flight_date >= $parameters.P_MinDate
```

* **Tipos:** Somente elementares (tipo built-in `abap.<tipo>` ou data element). Estruturas, tabelas e referências não são permitidas.

* **Uso dentro da view:** Com o prefixo `$parameters.`, na lista de elementos, em `CASE`, em expressões e funções (ex.: `currency_conversion`), no `WHERE` e em filtros de path expressions.

* **Consumo em outra view:** `from ZI_FlightsFrom( P_MinDate: $parameters.P_MinDate )`, com dois-pontos como operador de atribuição. Repassar o parâmetro dessa forma é comum em pilhas de views.

* **Consumo no ABAP SQL:** O operador é o sinal de igual:

``` ABAP
SELECT FROM zi_flightsfrom( p_mindate = @lv_data_corte )
  FIELDS AirlineID, ConnectionID, FlightDate, FreeSeats
  INTO TABLE @DATA(lt_voos).
```

No **Data Preview**, o ADT pede os valores dos parâmetros (marcados com `*`, obrigatórios) antes de exibir o resultado.

## Code Pushdown na Prática: Comparativo

| Tarefa | ABAP Clássico (Lento / Data-to-Code) | ABAP CDS (Rápido / Code-to-Data) |
| ----- | ----- | ----- |
| Status Text | Loop na tabela interna + IF/ELSE. | Coluna CASE na CDS View. |
| Duração | Loop + subtrair variáveis de data. | Função dats_days_between() na View. |
| Totalizar | Loop + COLLECT ou AT END OF. | Funções SUM() e GROUP BY na View. |
| Data Atual | Variável sy-datum no programa. | Variável $session.system_date na View. |
| Filtro Usuário | SELECT ... WHERE user = sy-uname. | WHERE user = $session.user na View. |

## Glossário Técnico

* **Expression (Expressão SQL):** Qualquer comando que gera um valor novo em tempo de execução, em vez de apenas ler um valor armazenado. Inclui cálculos, concatenações e lógica condicional.  
* **CAST (Type Casting):** Função SQL usada para converter explicitamente um valor de um tipo de dados para outro (ex: `NUMC` para `INT`). Essencial para evitar erros de tipo em cálculos aritméticos e uniões.  
* **Session Variable ($session):** Variáveis globais de contexto acessíveis dentro da CDS View que contêm informações do ambiente de execução atual do banco de dados/sessão ABAP. Exemplos: `$session.system_date` (Data atual), `$session.user` (Usuário logado).  
* **Aggregations (Agregações):** Funções que condensam múltiplos registros em um único resultado resumo, como `SUM` (Soma), `MIN` (Mínimo), `MAX` (Máximo), `AVG` (Média) e `COUNT` (Contagem). Quando combinadas com campos não agregados, exigem a cláusula `GROUP BY`.  
* **Criticality (Criticidade):** Conceito de UI do SAP Fiori onde valores numéricos (0-3) são mapeados para cores semânticas (Cinza, Vermelho, Amarelo, Verde) para indicar status ou severidade de forma visual.

## Quiz de Fixação

1. Qual é a variável de sessão correta para filtrar ou comparar dados com a data atual do sistema dentro de uma CDS View, e por que não podemos usar `sy-datum`?  
  R: A variável correta é `$session.system_date`. Não podemos usar `sy-datum` porque CDS Views são objetos de dicionário de dados (DDL) que residem no banco de dados, enquanto `sy-datum` é uma variável de memória do tempo de execução ABAP. O banco de dados não tem acesso à memória do servidor de aplicação.

2. Para que serve a função `dats_days_between` e qual o tipo de dado que ela retorna?  
  R: Ela calcula a diferença exata em dias entre duas datas fornecidas. Retorna um valor inteiro (Integer). É a forma padrão e performática de calcular durações, idades ou atrasos diretamente no banco de dados.

3. Se eu precisar transformar um código de status ('A', 'X') em uma cor para o Fiori (3, 1), qual comando devo usar e qual o benefício disso?  
  R: Deve-se usar a expressão `CASE`. O benefício é que a lógica de apresentação ("Se A então Verde") fica centralizada na View. A interface de usuário (Fiori) apenas lê o valor numérico resultante e aplica a cor, sem precisar repetir a regra de negócio no JavaScript do frontend.

4. O que acontece se eu tentar usar a função `SUM( price )` em uma CDS View sem adicionar uma cláusula `GROUP BY`?  
  R: Depende da lista de seleção. Se houver outros campos que não estão sendo agregados (como ID do Cliente), ocorrerá um erro de sintaxe: o banco de dados precisa saber como agrupar esses campos para calcular a soma correta de cada grupo. Se a lista contiver apenas agregações, a view é válida e retorna uma única linha com o total geral.
