# Melhorando a Performance de Tabelas Internas

![Infográfico - Guia de Performance para Tabelas Internas ABAP](./02.05_Guia_de_Performance_para_Tabelas_ABAP.png)

> **Comece pelos slides: [Melhorando a performance de tabelas internas](./02.05_Melhorando_a_performance_de_tabelas_internas.pptx)**
>
> Material complementar em PDF: [ABAP Moderno: Performance de Elite em Tabelas Internas](./02.05_ABAP_Performance_Tabelas_Internas.pdf)
>
> **Referência oficial (ABAP Keyword Documentation):** [itab - Using Secondary Keys](https://help.sap.com/docs/abap-cloud/abap-keywords/itab-using-secondary-keys)

## Objetivos de Aprendizagem

- Compreender profundamente a **Complexidade Algorítmica** (Notação Big O) aplicada às estruturas de dados ABAP, diferenciando o custo computacional de buscas Lineares O(n), Binárias O(log n) e Hash O(1).  

- Definir, implementar e consumir **Chaves Secundárias** (SECONDARY KEYS) para acelerar drasticamente buscas em tabelas Standard sem alterar a lógica principal de ordenação.  

- Gerenciar a memória do servidor de aplicação eficientemente, evitando cópias desnecessárias de linhas largas ("Wide Tables") através do uso de **Field-Symbols** (ASSIGNING) e **Referências de Dados** (REFERENCE INTO).  

- Identificar, diagnosticar e refatorar o antipadrão de **Nested Loops** (Loops Aninhados) em tabelas Standard, transformando operações de complexidade quadrática em lineares ou logarítmicas.

## 1. O Custo Oculto da Busca Linear

O erro de performance mais comum e devastador no desenvolvimento ABAP é realizar operações de leitura (`READ TABLE` ou `LOOP ... WHERE`) em uma **Tabela Standard** sem utilizar uma chave otimizada. Muitas vezes, esse erro passa despercebido em ambientes de desenvolvimento com poucos dados, mas causa **Timeouts** (erros de tempo limite) catastróficos em produção.

### Entendendo o "Table Scan" em Memória

Uma Tabela Standard não possui índice interno para buscas por conteúdo; ela é organizada apenas pela ordem de inserção (como uma lista de compras).

* **Busca Linear (Linear Search):** Quando você pede ao sistema "Busque a linha onde Matéria = 'X'", o kernel do ABAP começa na linha 1, verifica se é 'X'. Se não for, vai para a linha 2, e assim por diante.  
  * **Complexidade O(n):** O tempo de busca cresce linearmente com o volume de dados.  
  * **Cenário Pequeno:** Em 100 linhas, é instantâneo (microssegundos).  
  * **Cenário Real:** Em 1.000.000 de linhas, o sistema pode levar segundos inteiros apenas para encontrar *um* registro. Se essa busca estiver dentro de um loop, o programa irá travar.

**Regra de Ouro:** Se você vai ler uma tabela interna muitas vezes por uma chave específica (ex: dentro de um loop ou múltiplas vezes num processo), essa tabela **jamais** deveria ser acessada de forma linear. Ela deve ser tipada como Sorted/Hashed ou possuir uma Chave Secundária.

## 2. A Salvação: Chaves Secundárias

Muitas vezes, recebemos uma tabela Standard de um método de classe global ou BAPI e não podemos mudar seu tipo base (pois quebraria outros consumidores). No entanto, o ABAP moderno permite adicionar **Chaves Secundárias** na definição local da variável.

Isso cria um "índice auxiliar" paralelo na memória RAM. O sistema mantém a tabela original intacta, mas constrói uma árvore de busca ou mapa de hash adicional que aponta para as linhas da tabela principal.

### Tipos de Chaves Secundárias

* **SORTED KEY:** Cria um índice ordenado (árvore binária). Permite buscas parciais (ex: buscar apenas pelo primeiro campo da chave) e buscas por intervalo (Range).  
* **HASHED KEY:** Cria um mapa de hash. Permite apenas buscas exatas pela chave completa, mas é imbatível em velocidade (O(1)).

### Definição e Sintaxe

``` ABAP
TYPES: BEGIN OF ty_data,  
         id       TYPE i,  
         category TYPE string,  
         name     TYPE string,  
       END OF ty_data.

" Tabela Standard (acesso via índice rápido) mas com um índice rápido por ID  
" UNIQUE: Garante que não haverá IDs duplicados (o sistema valida na inserção)  
" NON-UNIQUE: Permite duplicatas (comum para categorias, status, etc.)  
TYPES ty_t_data TYPE STANDARD TABLE OF ty_data  
                WITH EMPTY KEY  
                WITH UNIQUE HASHED KEY key_id COMPONENTS id  
                WITH NON-UNIQUE SORTED KEY key_cat COMPONENTS category.
```

### Uso Obrigatório: USING KEY

Para que o kernel ABAP utilize o índice secundário, você deve ser explícito. Se omitir, ele fará a busca linear padrão.

``` ABAP
" Acesso Ultra-Rápido via Chave Secundária Hashed (Busca por ID)  
DATA(ls_row) = lt_data[ KEY key_id COMPONENTS id = 500 ].

" Loop Otimizado via Chave Secundária Sorted (Busca por Categoria)  
" Sem o 'USING KEY', este loop varreria a tabela inteira linha a linha.  
" Com 'USING KEY', ele salta direto (busca binária) para o primeiro registro da categoria 'Hardware'  
LOOP AT lt_data ASSIGNING FIELD-SYMBOL(<fs_row>)   
                USING KEY key_cat   
                WHERE category = 'Hardware'.  

ENDLOOP.
```

## 3. Cópias vs. Referências: Gerenciando a Memória

Quando iteramos sobre uma tabela interna, o ABAP precisa disponibilizar o conteúdo da linha atual para o processamento. Existem duas formas de fazer isso, com impactos de memória drasticamente diferentes.

### A. Cópia (INTO)

Cria uma duplicata física da linha na memória ("Work Area").

* **Mecanismo:** A cada iteração, o sistema copia o conteúdo da linha da tabela para a work area (a mesma variável é reutilizada, mas os dados são copiados).  
* **Prós:** Segurança. Se você alterar a Work Area, a tabela original permanece intacta.  
* **Contras:** Performance degradada em "Wide Tables" (tabelas com centenas de colunas ou strings longas). Copiar linhas largas milhões de vezes custa CPU e memória.

``` ABAP
" Cria uma cópia isolada. Lento para linhas largas.  
LOOP AT lt_big_table INTO DATA(ls_copy).   
  " ls_copy é independente da tabela.  

ENDLOOP.
```

### B. Referência (ASSIGNING FIELD-SYMBOL)

Cria um ponteiro (Pointer) direto para a linha na memória da tabela.

* **Mecanismo:** Não há alocação de nova memória para dados. O Field-Symbol aponta para o endereço onde a linha já está.  

* **Prós:** Velocidade máxima. Permite alterar o conteúdo da tabela diretamente sem precisar de MODIFY.  

* **Contras:** Cuidado ao modificar campos que são chaves de tabelas Sorted/Hashed (pode causar Dump se quebrar a ordenação).

``` ABAP
" Acesso direto à memória. Extremamente rápido.  
LOOP AT lt_big_table ASSIGNING FIELD-SYMBOL(<fs_row>).   
  <fs_row>-status = 'X'. " Modifica a tabela instantaneamente.  

ENDLOOP.
```

### C. Referência de Dados (REFERENCE INTO)

Uma alternativa moderna ao Field-Symbol, que usa referências de dados (`REF TO`). É ligeiramente mais segura que ponteiros puros e útil em contextos OO.

``` ABAP
LOOP AT lt_big_table REFERENCE INTO DATA(lr_row).  
  lr_row->status = 'X'. " Acesso via desreferenciação (->)  

ENDLOOP.
```

## 4. O Perigo do Loop Aninhado (Nested Loop)

O cenário clássico de performance ruim é cruzar dados de duas tabelas (ex: Pedidos e Clientes).

* **Abordagem Ingênua (Quadrática - O(N*M)):** Loop na Tabela A (10.000 linhas). Para cada linha, ler Tabela B (5.000 linhas) de forma linear.
  * *Cálculo:* 10.000 x 5.000 = **50.000.000 (50 Milhões)** de comparações. Isso vai travar o processo.  

* **Abordagem Otimizada (Logarítmica/Linear):** Loop na Tabela A. Para cada linha, ler Tabela B usando uma Chave Hashed ou Sorted.  
  * *Custo Hashed:* 10.000 x 1 = **10.000** operações.  
  * *Custo Sorted:* 10.000 x log(5000) ≈ **120.000** operações.  
  * *Ganho:* A abordagem otimizada é cerca de **5.000 vezes mais rápida** com chave Hashed (50 milhões ÷ 10.000) e cerca de **400 vezes** com chave Sorted (50 milhões ÷ 120.000).

## 5. Exemplo Prático: Benchmark de Performance

Neste exemplo expandido, vamos simular uma carga de dados massiva e comparar cronometricamente a leitura linear versus a leitura com chave secundária, provando o ganho real.

``` ABAP
CLASS zcl_perf_demo DEFINITION  
  PUBLIC FINAL CREATE PUBLIC.

  PUBLIC SECTION.  
    INTERFACES if_oo_adt_classrun.  
      
    TYPES: BEGIN OF ty_material,  
             matnr TYPE string,  
             desc  TYPE string,  
             price TYPE p LENGTH 10 DECIMALS 2,  
           END OF ty_material.

    " Tabela Híbrida: Comporta-se como Standard (append rápido),  
    " mas possui um índice Sorted secundário para buscas.  
    TYPES ty_t_materials TYPE STANDARD TABLE OF ty_material  
                         WITH EMPTY KEY  
                         WITH NON-UNIQUE SORTED KEY sk_matnr COMPONENTS matnr.  
ENDCLASS.

CLASS zcl_perf_demo IMPLEMENTATION.  
  METHOD if_oo_adt_classrun~main.

    DATA: lt_materials TYPE ty_t_materials.

    " 1. Setup: Criar 500.000 registros para simular volume real  
    " O uso de VALUE com loops internos é rápido para mock data  
    out->write( 'Gerando 500.000 registros...' ).  
    DO 500000 TIMES.  
      INSERT VALUE #(   
        matnr = |M{ sy-index }|   
        desc  = 'Material de Teste Performance'   
        price = sy-index   
      ) INTO TABLE lt_materials.  
    ENDDO.

    DATA(lv_target) = 'M499999'. " Buscando um item no final da tabela (pior caso linear)

    " Chaves secundárias NON-UNIQUE são construídas de forma "lazy" (no primeiro uso).
    " Fazemos um acesso inicial para que o custo de montar o índice não entre na medição.
    READ TABLE lt_materials WITH KEY sk_matnr COMPONENTS matnr = 'M1' TRANSPORTING NO FIELDS.

    " 2. Teste Lento: Busca Linear (Standard padrão)  
    " O sistema varre 499.999 linhas até achar.  
    GET RUN TIME FIELD DATA(t1).  
      
    LOOP AT lt_materials INTO DATA(ls_wa) WHERE matnr = lv_target.  
      " Achou e copiou  
    ENDLOOP.  
      
    GET RUN TIME FIELD DATA(t2).  
    DATA(diff_linear) = t2 - t1.

    " 3. Teste Rápido: Busca Binária (Chave Secundária)  
    " O sistema usa busca binária no índice secundário.  
    GET RUN TIME FIELD t1.  
      
    " Nota: Em LOOPs, devemos usar explicitamente USING KEY  
    LOOP AT lt_materials ASSIGNING FIELD-SYMBOL(<fs_fast>)   
                         USING KEY sk_matnr   
                         WHERE matnr = lv_target.  
      " Achou via ponteiro  
    ENDLOOP.  
      
    GET RUN TIME FIELD t2.  
    DATA(diff_sorted) = t2 - t1.

    " 4. Exibição dos Resultados  
    out->write( |Tempo Busca Linear: { diff_linear } microssegundos| ).  
    out->write( |Tempo Busca Sorted: { diff_sorted } microssegundos| ).  
      
    IF diff_sorted > 0.  
      out->write( |Ganho de Performance: { diff_linear / diff_sorted } vezes mais rápido| ).  
    ELSE.  
      out->write( 'A busca foi tão rápida que o timer não capturou precisão (< 1 microssegundo).' ).  
    ENDIF.

  ENDMETHOD.  
ENDCLASS.
```

## Guia de Decisão: Estratégias de Loop

| Cenário | Estratégia Recomendada | Por quê? |
| :---- | :---- | :---- |
| **Ler um campo pequeno (Inteiro/Char)** | INTO DATA(wa) | Mais legível, custo de cópia desprezível. |
| **Modificar a tabela** | ASSIGNING FIELD-SYMBOL(<fs>) | Permite alterar <fs>-campo diretamente, refletindo na tabela. |
| **Tabela Larga (Muitas colunas)** | ASSIGNING FIELD-SYMBOL(<fs>) | Evita a alocação de memória duplicada e o custo de cópia de bytes. |
| **Filtrar por campo não-chave** | USING KEY Secundária | Transforma busca O(n) em O(log n) ou O(1). |

## Glossário Técnico Expandido

* **Linear Search (Busca Sequencial):** O algoritmo mais simples e ineficiente para grandes volumes. Varre a tabela do início ao fim. Complexidade **O(n)**. É o padrão para tabelas Standard sem chave explícita.  

* **Binary Search (Busca Binária):** Algoritmo de "dividir para conquistar". Divide a tabela ordenada ao meio repetidamente. Complexidade **O(log n)**. Usado em tabelas Sorted ou Secondary Sorted Keys. É extremamente escalável (1 milhão de registros requerem apenas ~20 comparações).  

* **Hash Algorithm (O(1)):** O "Santo Graal" da performance. O sistema calcula matematicamente o endereço de memória da linha baseado na chave. O tempo de acesso é constante, seja para 10 ou 10 milhões de linhas.  

* **Secondary Key:** Um índice adicional mantido pelo ABAP Runtime que permite buscas rápidas por campos que não fazem parte da chave primária ou da ordenação padrão da tabela. Tem um custo adicional de memória e de CPU para manter o índice (na inserção ou, em chaves NON-UNIQUE, no primeiro acesso após alterações), mas compensa enormemente na leitura.  

* **Field-Symbol:** Uma variável ponteiro (<fs>) que não armazena dados, mas aponta para um endereço de memória de outra variável. Essencial para loops de alta performance e modificação direta de tabelas internas.

## Quiz de Fixação

1. Por que a busca em uma Tabela Hashed é considerada a mais rápida para grandes volumes de dados (teoricamente O(1))?  
  R: Porque ela utiliza um algoritmo de hash para transformar o valor da chave diretamente em um endereço de memória. Isso elimina a necessidade de varrer a tabela ou navegar em árvores de busca, permitindo acesso direto e instantâneo ao registro, independentemente do tamanho total da tabela.  

2. Tenho uma tabela Standard com 500.000 registros de Clientes e preciso buscar um cliente pelo CPF (que não é a chave primária) dentro de um loop crítico. O que devo fazer?  
  R: Você deve definir uma Chave Secundária (WITH NON-UNIQUE SORTED KEY ou HASHED KEY) na definição da tabela utilizando o campo CPF. Em seguida, deve adaptar seu comando de leitura (READ ou LOOP) para usar explicitamente USING KEY nome_da_chave. Isso evitará o table scan linear.  

3. Qual a vantagem de performance de usar ASSIGNING FIELD-SYMBOL em vez de INTO em um comando LOOP sobre uma tabela com estrutura larga (ex: 200 colunas)?  
  R: O FIELD-SYMBOL cria apenas uma referência (ponteiro) para a linha que já existe na memória da tabela. O INTO força o sistema a copiar os dados de todas as 200 colunas para a work area a cada iteração. Evitar essa cópia economiza tempo de CPU e memória.
