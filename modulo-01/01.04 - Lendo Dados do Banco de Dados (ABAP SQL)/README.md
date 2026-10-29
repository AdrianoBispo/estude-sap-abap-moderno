# Lendo Dados do Banco de Dados (ABAP SQL)

![Infográfico - A Evolução do SQL no ABAP Moderno](./01.04_A_Evolucao_do_ABAP_SQL.png)

> **Comece pelos slides: [Lendo dados do banco com ABAP SQL](./01.04_Lendo_dados_do_banco_com_ABAP_SQL.pptx)**
>
> Material complementar em PDF: [Lendo Dados do Banco de Dados (ABAP SQL)](./01.04_Lendo_Dados_do_Banco_de_Dados_(ABAP%20SQL).pdf)
>
> **Referência oficial (ABAP Keyword Documentation):** [SELECT](https://help.sap.com/docs/abap-cloud/abap-keywords/select)

## Objetivos de Aprendizagem

- Escrever comandos `SELECT` robustos utilizando a sintaxe moderna (Strict Mode), compreendendo suas regras sintáticas e benefícios.  

- Entender a fundo o uso do caractere de escape `@` (Host Variables) para diferenciar variáveis ABAP de colunas SQL.  

- Utilizar **Declarações Inline** (`@DATA`) para criação automática de tabelas internas e estruturas complexas baseadas na projeção da consulta.  

- Aplicar filtros avançados (`WHERE`, `IN`, `LIKE`), ordenação (`ORDER BY`) e limitar resultados (`UP TO n ROWS`) de forma eficiente.  

- Diferenciar o uso de **`SELECT SINGLE`** para leituras únicas e entender as variáveis de sistema **`sy-subrc`** e **`sy-dbcnt`**.

- Ler dados a partir de **CDS View Entities** em vez de tabelas, usando os nomes de elementos e **path expressions** sobre associações expostas.

## 1. ABAP SQL Moderno: O Que Mudou e Por Quê?

Antigamente chamado de *Open SQL*, o ABAP SQL é a camada de abstração que traduz nosso código ABAP para a linguagem específica do banco de dados subjacente (seja ele HANA, Oracle, DB2, etc.).

No ABAP Clássico, o SQL era limitado. Trazíamos os dados brutos para o servidor de aplicação e processávamos tudo com loops LOOP AT. Com a chegada do SAP HANA e do **ABAP 7.40+**, o paradigma mudou para **Code Pushdown** (empurrar o código para o banco). Para suportar novas funcionalidades (como cálculos e expressões), a SAP introduziu uma nova sintaxe.

### O "Strict Mode" (Modo Estrito)

O Modo Estrito não é uma configuração que você liga; ele é ativado automaticamente pelo compilador assim que você usa qualquer funcionalidade moderna (como vírgulas na lista de campos ou o símbolo @).

**Regras do Jogo:**

* **Vírgulas Obrigatórias:** Ao contrário do antigo (espaços), os campos *devem* ser separados por vírgula.  
* **INTO no Final:** A cláusula de destino deve vir após as cláusulas de seleção, filtro e ordenação.  
* **Escape @ Obrigatório:** Toda variável do programa ABAP usada na query deve ter o prefixo @.

## 2. A Sintaxe do SELECT Moderno

### Selecionando Múltiplas Linhas (Tabela Interna)

Vamos analisar uma consulta na tabela /dmo/connection (Modelo de Voo).

* Estilo Antigo (Obsoleto no Cloud):  
  Exigia declaração prévia e a ordem das cláusulas era rígida.  
``` ABAP
  DATA: lt_connections TYPE TABLE OF /dmo/connection.  
  " Sintaxe antiga: sem vírgulas, sem @, INTO no meio  
  SELECT * FROM /dmo/connection INTO TABLE lt_connections  
           WHERE carrier_id = 'LH'.
```

* Estilo Moderno (Recomendado):  
  Permite renomear colunas (AS), usar literais e declarar o destino na hora.  
``` ABAP
  DATA(lv_airline) = 'LH'.

  " A sintaxe moderna flui como uma frase lógica:  
  " DE ONDE -> O QUE -> COMO FILTRAR -> COMO ORDENAR -> PARA ONDE  
  SELECT FROM /dmo/connection  
    FIELDS   
      carrier_id,   
      connection_id,   
      airport_from AS departure_airport, " ALIAS: Renomeando coluna  
      airport_to   AS arrival_airport,   " ALIAS: Renomeando coluna  
      distance  
    WHERE carrier_id = @lv_airline  
    ORDER BY carrier_id, connection_id DESCENDING " Ordenação mista  
    INTO TABLE @DATA(lt_flights).
```

  *Nota:* A tabela lt_flights terá os campos carrier_id, connection_id, departure_airport, etc. O tipo é inferido automaticamente.

### Selecionando uma Única Linha (Estrutura)

Existem duas formas principais de ler um único registro.

A. `SELECT SINGLE` (Leitura por Chave)  
Ideal quando você tem a chave primária completa e quer validar existência ou ler atributos.  
``` ABAP
SELECT SINGLE FROM /dmo/connection  
  FIELDS airport_from, airport_to  
  WHERE carrier_id = 'AA'  
    AND connection_id = '0017'  
  INTO @DATA(ls_flight_info).
```

B. `SELECT ... UP TO 1 ROWS` (Amostragem)  
Ideal quando você não tem a chave completa e quer apenas "o primeiro que encontrar" ou "o mais recente" (se combinado com ORDER BY).  
``` ABAP
SELECT FROM /dmo/connection  
  FIELDS connection_id  
  WHERE airport_from = 'JFK'  
  ORDER BY distance ASCENDING " Pega o voo mais curto saindo de JFK  
  INTO TABLE @DATA(lt_one_flight)  
  UP TO 1 ROWS.
```

## 3. O Porquê do `@` (Host Variables)

No Strict Mode, o parser do SQL precisa de uma distinção clara entre o que pertence ao **Banco de Dados** e o que pertence ao **Programa ABAP**.

* `carrier_id`: É uma coluna que existe na tabela do banco.  
* `@lv_airline`: É uma variável ("Host Variable") hospedada na memória do programa ABAP.

Por que isso importa?  
O `@` é uma marcação sintática que elimina ambiguidades: o compilador sabe exatamente o que é coluna e o que é variável ABAP. (Vale lembrar que o ABAP SQL sempre enviou as variáveis ABAP ao banco como parâmetros — *bind variables* —, o que protege contra SQL Injection e permite reaproveitar planos de execução; o `@` torna isso explícito no código, mas não muda esse mecanismo.)  
*Exemplo de Erro Comum:*

``` ABAP
" ERRADO no Strict Mode  
SELECT FROM /dmo/flight FIELDS * WHERE carrier_id = lv_id INTO TABLE @data(lt_tab).

" CORRETO  
SELECT FROM /dmo/flight FIELDS * WHERE carrier_id = @lv_id INTO TABLE @data(lt_tab).
```

## 4. Variáveis de Sistema: O Painel de Controle

Após cada comando SELECT, o sistema atualiza duas variáveis críticas na estrutura sy:

1. **sy-subrc (Return Code):**  
   * 0: Sucesso. Pelo menos uma linha foi encontrada.  
   * 4: Aviso. Nenhuma linha foi encontrada que satisfaça o WHERE.  
   * 8: Ocorre apenas em `SELECT SINGLE ... FOR UPDATE` quando a chave primária não é informada completamente.  
   * *Dica:* Sempre verifique sy-subrc imediatamente após o SELECT.  

2. **sy-dbcnt (Database Count):**  
   * Contém o número de linhas processadas/retornadas.  
   * Se sy-subrc = 0, sy-dbcnt dirá quantas linhas vieram (ex: 500).  
   * Se sy-subrc = 4, sy-dbcnt será 0.

## 5. Exemplo Prático: Buscando e Exibindo Dados

Neste exemplo expandido, vamos usar uma tabela de intervalos (Range) para filtro e analisar a contagem de registros.

``` ABAP
CLASS zcl_read_data DEFINITION  
  PUBLIC  
  FINAL  
  CREATE PUBLIC .

  PUBLIC SECTION.  
    INTERFACES if_oo_adt_classrun .  
  PROTECTED SECTION.  
  PRIVATE SECTION.  
ENDCLASS.

CLASS zcl_read_data IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.

    " 1. Preparação de Filtros  
    DATA(lv_carrier) = 'UA'.   
    DATA(lv_min_distance) = 1000.

    " 2. SELECT com Expressões Lógicas e Projeção  
    " Queremos voos da UA com distância maior que 1000, ordenados pela maior distância  
    SELECT FROM /dmo/connection  
      FIELDS   
        carrier_id,   
        connection_id,   
        airport_from,   
        airport_to,   
        distance,   
        distance_unit  
      WHERE carrier_id = @lv_carrier  
        AND distance   > @lv_min_distance  
      ORDER BY distance DESCENDING  
      INTO TABLE @DATA(lt_results).

    " 3. Análise do Resultado  
    IF sy-subrc = 0.  
      " Sucesso: Mostra quantos registros achou usando sy-dbcnt  
      out->write( |Sucesso! Foram encontrados { sy-dbcnt } voos longos da { lv_carrier }.| ).  
      out->write( '--------------------------------------------------' ).

      LOOP AT lt_results INTO DATA(ls_flight).  
        " Exibe detalhes  
        out->write( |Voo { ls_flight-connection_id }: { ls_flight-distance } { ls_flight-distance_unit } | &&  
                    |({ ls_flight-airport_from } -> { ls_flight-airport_to })| ).  
      ENDLOOP.  
        
    ELSE.  
      " Falha  
      out->write( |Nenhum voo encontrado com distância maior que { lv_min_distance }.| ).  
    ENDIF.

    " 4. Exemplo de SELECT SINGLE  
    " Verificando se existe algum voo específico  
    SELECT SINGLE FROM /dmo/connection  
      FIELDS @abap_true  
      WHERE carrier_id = 'AA'  
        AND connection_id = '0017'  
      INTO @DATA(lv_exists).

    IF lv_exists = abap_true.  
      out->write( 'O voo AA 0017 existe no banco de dados.' ).  
    ENDIF.

  ENDMETHOD.

ENDCLASS.
```

## 6. Lendo Dados de uma CDS View

Em vez de ler a tabela diretamente, o `SELECT` pode usar uma **CDS View Entity** como fonte de dados. É o caminho preferido no ABAP Cloud, onde os dados SAP são acessados por views liberadas (ex.: `I_Product`; veja a lição 05.03).

* **Reuso:** A lógica SQL da view (cálculos, joins, filtros) não precisa ser reescrita.

* **Nomes legíveis:** No `FIELDS` e no `WHERE` usamos os **nomes de elementos** da view (alias), não os nomes técnicos das colunas.

* **Associações:** Uma associação exposta pela view permite ler dados relacionados com uma **path expression**. A barra invertida (`\`) é obrigatória antes do nome da associação.

``` ABAP
SELECT FROM /dmo/i_connection
  FIELDS AirlineID,
         ConnectionID,
         \_Airline-Name AS AirlineName, " Path expression: lê o nome em /DMO/I_Carrier
         DepartureAirport,
         DestinationAirport
  WHERE AirlineID = 'LH'
  INTO TABLE @DATA(lt_connections).
```

**Dicas de ferramenta:** `F8` sobre a data definition abre o **Data Preview** da view (com `Follow Association` no menu de contexto), e `Ctrl+Shift+G` sobre uma tabela mostra o **Where-used List**, útil para descobrir quais CDS views já leem aquela tabela.

## Pontos de Atenção (Performance e Sintaxe)

| Conceito | Prática Ruim (Legado) | Prática Boa (Moderno/Strict) | Motivo |
| :---- | :---- | :---- | :---- |
| **Seleção de Colunas** | SELECT * | SELECT field1, field2 | Economiza memória e tráfego de rede. |
| **Verificar Existência** | SELECT * ... UP TO 1 ROWS | SELECT SINGLE @abap_true ... | Mais leve, não transporta dados inúteis. |
| **Escape de Variável** | WHERE id = lv_id | WHERE id = @lv_id | Clareza para o parser e segurança. |
| **Looping** | SELECT dentro de LOOP | FOR ALL ENTRIES ou JOIN | Evita "N+1 selects" (múltiplas idas ao banco). |
| **Destino** | SELECT * ... INTO CORRESPONDING FIELDS | Lista explícita de campos com INTO TABLE @DATA(...) | Deixa claro quais campos são lidos e evita buscar colunas que seriam descartadas no destino. |

## Glossário Técnico

* **ABAP SQL (Antigo Open SQL):** Subconjunto da linguagem ABAP usado para acessar o banco de dados de forma independente da plataforma. Ele converte a sintaxe ABAP para o SQL nativo do banco (HANA, Oracle, etc.).  
* **Host Variable (@):** Uma variável declarada no programa ABAP utilizada dentro de uma instrução SQL. O prefixo @ é obrigatório no modo estrito para diferenciação de colunas.  
* **Code Pushdown:** Paradigma de performance onde movemos a lógica de processamento de dados (cálculos, agregações, filtros complexos) da camada de aplicação (ABAP) para a camada de banco de dados (HANA), trafegando apenas o resultado final.  
* **SELECT SINGLE:** Instrução otimizada para buscar **uma única linha**. Se a chave primária completa não for fornecida, retorna a primeira linha arbitrária encontrada.  
* **sy-subrc:** Variável de sistema que indica o status da execução. 0 = Sucesso, 4 = Dados não encontrados.  
* **sy-dbcnt:** Variável de sistema que armazena a **quantidade de linhas** afetadas ou lidas pela última instrução SQL.  
* **FIELDS:** Palavra-chave introduzida no ABAP 7.50 para listar as colunas a serem lidas. É obrigatória quando a cláusula `FROM` vem antes da lista de campos (`SELECT FROM ... FIELDS ...`), o estilo recomendado por favorecer o Content Assist do ADT.  
* **Inline Declaration (@DATA):** Recurso que permite criar a tabela ou estrutura de destino no momento exato da leitura, inferindo os tipos de dados a partir da lista de campos do SELECT.

## Quiz de Fixação

1. O que acontece se eu esquecer de colocar o símbolo @ antes de uma variável ABAP dentro de um SELECT moderno?  
  R: Ocorrerá um erro de sintaxe. No modo estrito (Strict Mode), ativado pelo uso de vírgulas ou declarações inline, o compilador exige o @ para diferenciar inequivocamente o que é coluna do banco de dados e o que é variável do programa (Host Variable).
  
2. Por que devemos evitar o uso de SELECT * (selecionar todas as colunas) em aplicações de alta performance?  
  R: SELECT * traz todas as colunas da tabela, muitas das quais podem não ser usadas pelo programa. Isso consome memória desnecessária no servidor de aplicação e aumenta o volume de dados trafegados na rede entre o Banco e o ABAP. A boa prática é selecionar explicitamente apenas os campos (FIELDS) necessários.

3. Qual a diferença entre sy-subrc e sy-dbcnt após um SELECT?  
  R: sy-subrc indica o sucesso da operação (0 = achou, 4 = não achou). sy-dbcnt indica a quantidade de registros processados (ex: 10 linhas encontradas). É comum verificar sy-subrc para controle de fluxo e sy-dbcnt para relatórios ou validação de volume.

4. Quando devo usar SELECT SINGLE em vez de SELECT ... UP TO 1 ROWS?  
  R: Use SELECT SINGLE quando você puder fornecer a chave primária completa para buscar um registro específico de forma inequívoca. Use UP TO 1 ROWS quando você quiser uma amostragem ou o "primeiro registro" de um conjunto maior, geralmente combinado com ORDER BY (ex: buscar o pedido mais recente de um cliente).

## Links de Demonstrações

- [Como Analisar uma Tabela de Banco de Dados](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_44B67792CC5AACB1:demo)
- [Como Analisar uma Visualização CDS](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_3E120CA182A03BAE:demo)
