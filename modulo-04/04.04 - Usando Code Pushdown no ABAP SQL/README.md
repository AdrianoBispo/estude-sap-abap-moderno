# Usando Code Pushdown no ABAP SQL

![Infográfico - Modernize seu ABAP com Code Pushdown](./04.04_Modernize_seu_ABAP_com_Code_Pushdown.png)

> **Comece pelos slides: [Usando Code Pushdown no ABAP SQL](./04.04_Usando_Code_Pushdown_no_ABAP_SQL.pdf)**

## Objetivos de Aprendizagem

- Aplicar **Expressões Aritméticas e de String** diretamente na lista de seleção do SELECT, eliminando a necessidade de pós-processamento de dados no servidor de aplicação.  

- Utilizar lógica condicional complexa com **CASE** dentro de consultas SQL para transformar códigos técnicos em informações de negócio legíveis na fonte.  

- Realizar agregações estatísticas (**SUM**, **AVG**, **COUNT**, **MIN**, **MAX**) e agrupamentos (**GROUP BY**) para criar relatórios analíticos de alta performance.  

- Combinar resultados de múltiplas seleções heterogêneas usando **UNION** e **UNION ALL**, compreendendo as implicações de performance e requisitos de compatibilidade de tipos.  

- Empregar funções de tratamento de nulos como **COALESCE** para garantir a robustez de cálculos matemáticos no banco de dados.

## 1. ABAP SQL vs. CDS Views: Quando usar qual?

Já aprendemos a colocar lógica no banco usando CDS Views. Mas e se a lógica for específica demais para uma única rotina? A escolha entre criar uma View no dicionário ou escrever uma query complexa no código depende da **reutilização**.

* **CDS View:** A ferramenta ideal para definir modelos de dados reutilizáveis. Se o cálculo de "Total com Impostos" for usado em três relatórios e um aplicativo Fiori, ele deve estar numa CDS View. É a "Single Source of Truth".  

* **ABAP SQL Moderno:** A ferramenta para lógica específica de um método ou classe. Se você precisa de uma query ad-hoc que combina dados de forma única para um processamento batch específico, não polua o dicionário com uma View que só tem um consumidor. Escreva o SQL complexo diretamente no ABAP.

O ABAP SQL (a partir do 7.50) herdou quase todos os "superpoderes" do CDS, permitindo que a sintaxe seja praticamente idêntica. Isso facilita a refatoração: você pode prototipar no ABAP SQL e depois mover para uma CDS View se a lógica provar ser reutilizável.

## 2. Cálculos e Expressões na Query

O padrão antigo de "Selecionar tudo (`SELECT *`), jogar na tabela interna e fazer `LOOP` para calcular" é o maior inimigo da performance em bancos de dados em memória como o SAP HANA. O custo de trazer milhões de células de dados pela rede apenas para somar duas colunas e descartar o resto é proibitivo.

### Aritmética no `SELECT`

Podemos calcular preços, impostos, margens e datas direto na query. O banco de dados é extremamente eficiente em matemática vetorial.

**Atenção aos Nulos:** Em operações SQL, `5 + NULL = NULL`. Para evitar que um campo vazio anule seu cálculo, usamos a função `COALESCE( campo, 0 )`, que retorna o primeiro valor não nulo (neste caso, zero se o campo for nulo).

``` ABAP
SELECT FROM zrap_travel  
  FIELDS travel_id,  
         total_price,  
         booking_fee,  
           
         " Cálculo direto no banco: Soma simples  
         " Se booking_fee for nulo, o resultado seria nulo sem tratamento  
         ( total_price + booking_fee ) AS grand_total,  
           
         " Cálculo com Literais  
         " 90% do preço (10% de desconto): multiplica por 9 e divide por 10  
         " DIVISION( dividendo, divisor, casas_decimais ) faz divisão decimal  
         DIVISION( total_price * 9, 10, 2 ) AS discounted_price,  
           
         " Cálculo de Margem (Divisão)  
         " DIV( a, b ) faz divisão inteira; DIVISION( a, b, dec ) faz divisão  
         " com casas decimais; o operador / não é permitido em expressões inteiras  
         " (exige operandos de ponto flutuante ou decfloat, ex: CAST( ... AS D34N ))  
         DIVISION( total_price, 100, 2 ) AS price_index

  WHERE currency_code = 'EUR'  
  INTO TABLE @DATA(lt_results).
```

### Strings no SELECT

Manipulação de texto também pode ser feita no banco, economizando loops ABAP. Além da concatenação, temos funções para caixa alta/baixa, substituição e comprimento.

``` ABAP
SELECT FROM /dmo/customer  
  FIELDS customer_id,  
           
         " Concatenação Simples com operador &&  
         first_name && last_name AS raw_name,  
           
         " Função dedicada com separador (Mais limpo que && ' ' &&)  
         concat_with_space( first_name, last_name, 1 ) AS full_name,  
           
         " Normalização para busca (Tudo em Maiúsculo)  
         upper( last_name ) AS upper_name,  
           
         " Extração de parte do texto (Primeiras 3 letras)  
         substring( last_name, 1, 3 ) AS short_name

  INTO TABLE @DATA(lt_names).
```

## 3. Lógica Condicional (CASE)

O famoso IF/ELSE dentro do loop pode ser eliminado usando CASE no SQL. Isso permite transformar códigos técnicos (ex: 'X', 'A') em textos descritivos ou categorizações diretamente na extração.

Existem duas formas de CASE:

1. **Simple CASE:** Compara um campo contra valores.  
2. **Complex CASE:** Permite condições lógicas variadas (WHEN a > b).

``` ABAP
SELECT FROM zrap_travel  
  FIELDS travel_id,  
         overall_status,  
         total_price,  
           
         " Simple CASE: Tradução de Status  
         CASE overall_status  
           WHEN 'A' THEN 'Aceito'  
           WHEN 'X' THEN 'Rejeitado'  
           WHEN 'O' THEN 'Aberto'  
           ELSE 'Pendente' " Valor padrão se nenhum coincidir  
         END AS status_text,  
           
         " Complex CASE: Categorização baseada em valores  
         CASE  
           WHEN total_price < 1000 THEN 'Econômica'  
           WHEN total_price BETWEEN 1000 AND 5000 THEN 'Executiva'  
           WHEN total_price > 5000 THEN 'Primeira Classe'  
           ELSE 'Não Classificado'  
         END AS price_category

  INTO TABLE @DATA(lt_status).
```

## 4. Agregações e Agrupamento (`GROUP BY`)

Se você precisa de um relatório de totais, **nunca** traga os dados detalhados para o ABAP para somar (usando COLLECT ou Loop). O banco de dados possui índices e otimizações específicas para agregação que são ordens de magnitude mais rápidas que o servidor de aplicação.

* **Funções de Agregação:** `SUM()`, `AVG()`, `MIN()`, `MAX()`, `COUNT()`.  
* **Regra Fundamental:** Se usar qualquer função de agregação, **qualquer campo** na lista de seleção que *não* for agregado deve obrigatoriamente estar na cláusula `GROUP BY`. O banco precisa saber "somar o quê por quem".

* **`HAVING` vs. `WHERE`:**
  * **`WHERE:`** Filtra os dados **antes** de agrupar (ex: "Considere apenas viagens em Dólar").  
  * **`HAVING:`** Filtra os dados **depois** de agrupar (ex: "Mostre apenas clientes que gastaram mais de 1 milhão no total").

``` ABAP
SELECT FROM zrap_travel  
  FIELDS customer_id,  
         currency_code,  
           
         " Contar quantas viagens existem neste grupo  
         COUNT( * ) AS total_travels,  
           
         " Somar o valor total das viagens  
         SUM( total_price ) AS total_spent,  
           
         " Encontrar o valor da viagem mais cara e mais barata  
         MAX( total_price ) AS max_spent,  
         MIN( total_price ) AS min_spent

  " Filtra ANTES de somar (apenas viagens de 2023 em diante)  
  WHERE begin_date >= '20230101'  
    
  " Agrupa por Cliente e Moeda (obrigatório pois estão no FIELDS)  
  GROUP BY customer_id, currency_code  
    
  " Filtra DEPOIS de somar (apenas "Grandes Clientes")  
  HAVING SUM( total_price ) > 50000   
    
  INTO TABLE @DATA(lt_analytics).
```

## 5. Combinando Resultados (UNION)

Às vezes precisamos juntar dados de duas tabelas diferentes que têm estrutura similar, mas que logicamente estão separadas (ex: Tabela de Vendas Atuais e Tabela de Histórico/Arquivo Morto, ou Clientes Nacionais e Internacionais). O ABAP SQL permite fazer isso em uma única ida ao banco.

* **Requisito:** O número de colunas e os tipos de dados de cada coluna correspondente devem ser compatíveis entre os SELECTs.  
* **UNION ALL:** Junta os resultados das duas queries "como estão". É muito rápido.  
* **UNION:** Junta os resultados e executa um passo extra de **ordenação e remoção de duplicatas**. É mais lento e deve ser usado apenas se você realmente precisar garantir unicidade entre os conjuntos.

``` ABAP
" Seleciona Voos Ativos  
SELECT FROM /dmo/connection  
  FIELDS carrier_id, connection_id, distance  
  WHERE distance > 2000

UNION ALL " Junta com...

" Seleciona Voos de uma tabela de histórico (exemplo hipotético)  
SELECT FROM /dmo/conn_hist  
  FIELDS carrier_id, connection_id, distance  
  WHERE distance > 2000

INTO TABLE @DATA(lt_all_long_flights).
```

## 6. Exemplo Prático: Relatório Analítico via Código

Vamos criar uma classe que gera um relatório de gastos por agência, classificando-as como "VIP" ou "Standard", utilizando todo o poder do Code Pushdown: Agregação, `CASE`, Aritmética e Filtro Pós-Agregação.

``` ABAP
CLASS zcl_sql_pushdown DEFINITION  
  PUBLIC  
  FINAL  
  CREATE PUBLIC .

  PUBLIC SECTION.  
    INTERFACES if_oo_adt_classrun .  
  PROTECTED SECTION.  
  PRIVATE SECTION.  
ENDCLASS.

CLASS zcl_sql_pushdown IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.

    " Query Analítica Complexa  
    " Objetivo: Analisar performance de agências que operam em grandes volumes  
    SELECT FROM zrap_travel  
      FIELDS agency_id,  
             currency_code,  
               
             " 1. Contagem e Soma (Agregação)  
             COUNT( * ) AS number_of_travels,  
             SUM( total_price ) AS total_amount,

             " 2. Média de preço por viagem (Ticket Médio)  
             " Casting para decimal garante precisão na média  
             AVG( total_price AS DEC( 15,2 ) ) AS average_ticket,

             " 3. Classificação baseada na soma (Code Pushdown Lógico)  
             " O CASE avalia o resultado da agregação SUM()  
             CASE   
               WHEN SUM( total_price ) > 100000 THEN 'Platinum Partner'  
               WHEN SUM( total_price ) > 10000  THEN 'Gold Partner'  
               ELSE 'Standard Partner'  
             END AS partner_category

      " Agrupamento Obrigatório para campos não agregados (Agency, Currency)  
      GROUP BY agency_id, currency_code  
        
      " Filtro pós-agregação (HAVING):   
      " Removemos agências pequenas para focar a análise  
      HAVING SUM( total_price ) > 1000  
        
      " Ordenar do maior faturamento para o menor  
      ORDER BY total_amount DESCENDING  
      INTO TABLE @DATA(lt_report).

    " Exibição no Console  
    out->write( name = 'Relatório de Agências' data = lt_report ).

  ENDMETHOD.

ENDCLASS.
```

## Loop ABAP vs Code Pushdown SQL

| Cenário | ABAP Clássico (Evitar) | ABAP SQL (Recomendado) | Vantagem SQL |
| :---- | :---- | :---- | :---- |
| **Soma de Totais** | LOOP, acumular em variável. | SELECT SUM(...) | Menor tráfego de rede, uso de índices de coluna. |
| **Status Texto** | LOOP, IF/ELSE, modificar tabela. | SELECT CASE ... | Lógica centralizada, retorno já formatado. |
| **Juntar Tabelas** | Dois SELECTs, LOOP e APPEND. | SELECT ... UNION ... | Uma única ida ao banco (Roundtrip). |
| **Filtro de Soma** | LOOP, calcular, DELETE se menor que X. | SELECT ... HAVING SUM > X | O banco só retorna o que interessa. |

## Glossário Técnico

* **Aggregation Function (Função de Agregação):** Funções SQL que operam em um conjunto de linhas para retornar um único valor resumido. Exemplos: SUM (Soma), AVG (Média), MAX (Máximo), MIN (Mínimo).  

* **GROUP BY:** Cláusula SQL obrigatória quando se mistura colunas normais e funções de agregação. Ela define os "baldes" onde os dados serão agrupados (ex: agrupar vendas "por Cliente").  

* **HAVING:** Cláusula usada para filtrar resultados *após* a agregação ter sido feita (diferente do WHERE, que filtra *antes*). É usada para condições sobre os valores sumarizados (ex: HAVING SUM(val) > 100).  

* **UNION / UNION ALL:** Operadores que combinam o conjunto de resultados de duas ou mais instruções SELECT. UNION remove linhas duplicadas (custoso), enquanto UNION ALL mantém todas (rápido).  

* **Coalesce:** Função SQL (coalesce( val1, val2, ... )) que retorna o primeiro valor não nulo de uma lista de argumentos. Indispensável para evitar que valores NULL propaguem e anulem cálculos aritméticos inteiros.  

* **Literals (Literais):** Valores fixos escritos diretamente na query (ex: 'Ativo', 100, 0.1). Podem ser usados em expressões aritméticas, comparações e projeções.

## Quiz de Fixação

1. Qual a diferença técnica e de performance entre WHERE e HAVING em uma consulta SQL com agregações?  
  R: O WHERE filtra as linhas brutas antes que elas sejam agrupadas e calculadas, reduzindo o volume de dados a ser processado pelo agrupador. O HAVING filtra os resultados já agregados (os grupos) após o cálculo. Para performance, deve-se filtrar o máximo possível no WHERE.  

2. Por que UNION ALL é geralmente mais performático que UNION?  
  R: Porque o UNION padrão executa um passo adicional e custoso de processamento (sort/distinct) para identificar e remover linhas duplicadas entre os conjuntos de resultados. O UNION ALL simplesmente anexa os resultados sequencialmente, sem verificação extra.  

3. Se eu usar a função SUM( price ) na minha lista de campos, o que sou obrigado a fazer com os outros campos (ex: customer_id) que não estão sendo somados?  
  R: Sou obrigado a incluí-los na cláusula GROUP BY. Caso contrário, ocorrerá um erro de sintaxe SQL, pois o banco de dados não sabe como condensar múltiplas linhas de clientes diferentes em uma só linha de soma sem um critério explícito de agrupamento.  

4. Para que serve a função COALESCE e em que cenário ela é indispensável?  
  R: A função COALESCE retorna o primeiro valor não nulo de uma lista. Ela é indispensável em cálculos aritméticos (somas, multiplicações) onde um dos campos pode ser NULL, pois em SQL qualquer operação com NULL resulta em NULL. O COALESCE permite substituir o nulo por zero ou um valor padrão para que o cálculo prossiga.
