# Trabalhando com Objetos de Dados Estruturados

![Infográfico - Estruturas de Dados no ABAP Moderno](./01.05_Estruturas_de_Dados_ABAP.png)

> **Comece pelos slides: [Trabalhando com dados estruturados](./01.05_Trabalhando_com_dados_estruturados.pptx)**
>
> Material complementar em PDF: [Dominando Estruturas de Dados em ABAP](./01.05_Dominando_Estruturas_de_Dados_em_ABAP_e_RAP.pdf)
>
> **Referência oficial (ABAP Keyword Documentation):** [CORRESPONDING, Component Operator](https://help.sap.com/docs/abap-cloud/abap-keywords/corresponding-component-operator)

## Objetivos de Aprendizagem

- Diferenciar com clareza **Tipos Elementares** de **Tipos Estruturados**, e compreender a distinção entre **Estruturas Planas (Flat)** e **Estruturas Profundas (Deep)**.  
- Definir e declarar estruturas localmente utilizando `TYPES` e `DATA`, bem como reutilizar tipos globais do Dicionário de Dados (`SE11`).  
- Acessar e manipular componentes individuais de uma estrutura utilizando a sintaxe do hífen (-).  
- Dominar o operador construtor **CORRESPONDING**, incluindo suas variações avançadas (MAPPING, EXCEPT, BASE), essencial para a transferência de dados entre camadas no modelo RAP.

## 1. O que é uma Estrutura?

Até este ponto do curso, manipulamos variáveis que armazenam um único valor por vez (tipos elementares), como um número inteiro (i) ou uma string de texto (string). No entanto, no mundo real dos negócios, os dados raramente andam sozinhos. Um "Cliente" não é apenas um ID; ele é um conjunto composto por Nome, Endereço, Telefone e Limite de Crédito.

Uma **Estrutura** é a representação técnica desse agrupamento lógico. É uma área de memória contínua dividida em subáreas chamadas **componentes**.

* **Analogia:** Se uma variável elementar é uma "célula" de Excel, uma estrutura é uma "linha" inteira dessa planilha.  
* **Importância no RAP:** No desenvolvimento ABAP moderno, estruturas são a base para a definição de Interfaces de BAdIs, assinaturas de métodos e, principalmente, para representar as entidades de negócio (Business Objects) antes de serem persistidas no banco.

## 2. Definindo e Declarando Estruturas

A criação de estruturas segue o princípio de separar a "Definição do Molde" (Type) da "Criação do Objeto" (Data).

### Definindo o "Molde" (TYPES)

Usamos o bloco `BEGIN OF ... END OF ...` para desenhar o layout da estrutura. Isso não aloca memória no sistema; apenas ensina ao compilador como os dados devem ser organizados.

Podemos definir estruturas baseadas em tipos elementares, tipos de dados globais (Data Elements) ou até misturar ambos.

``` ABAP
" Definição Local (Válida apenas neste programa/classe)  
TYPES: BEGIN OF ty_item_info,  
         sku          TYPE zta_pc_item-sku,            " Tipo de um campo da tabela (global)  
         nome         TYPE zta_pc_item-nome,           " Tipo de um campo da tabela (global)  
         preco        TYPE zta_pc_item-preco_unitario, " Tipo de um campo da tabela (global)  
         currency     TYPE zta_pc_item-currency,       " Tipo de um campo da tabela (global)  
         item_ativo   TYPE abap_bool,                  " Tipo Embutido  
         " Campos técnicos podem ser adicionados livremente  
         _timestamp   TYPE timestampl,  
       END OF ty_item_info.
```

### Criando a "Instância" (DATA)

Com o molde definido, usamos o comando DATA para alocar espaço na memória RAM para guardar os valores.

``` ABAP
" Criação da variável baseada no tipo local definido acima  
DATA: ls_item TYPE ty_item_info.

" Também é possível criar estruturas baseadas em tabelas do banco de dados (Global)  
" A estrutura ls_cliente terá exatamente as mesmas colunas da tabela zta_pc_cliente  
DATA: ls_cliente TYPE zta_pc_cliente.

" Acesso aos componentes usa o hífen (-)  
ls_item-sku        = 'SKU-ELE-0000000001'.  
ls_item-nome       = 'Fone Bluetooth'.  
ls_item-preco      = '199.90'.  
ls_item-item_ativo = abap_true.
```

Os tipos e as tabelas citados (`zta_pc_item`, `zta_pc_cliente`) são do projeto [Pedidos de Compras](https://github.com/AdrianoBispo/sap-abap-rap-pedidos-de-compras-app), usado como exemplo nas próximas lições.

*Dica de Nomenclatura:* É uma convenção forte no ABAP usar o prefixo ls_ (*Local Structure*) ou wa_ (*Work Area*) para variáveis de estrutura, e ty_ para definições de tipos. Isso ajuda a identificar rapidamente se estamos lidando com dados ou definições.

## 3. O Operador CORRESPONDING (Fundamental para RAP)

No desenvolvimento RAP, estamos constantemente movendo dados entre camadas: da camada de banco de dados para a camada de comportamento (BDEF), e desta para a projeção de consumo (CDS Projection). Essas camadas frequentemente têm estruturas muito parecidas, mas não idênticas.

Copiar campo por campo (ls_b-campo1 = ls_a-campo1) é trabalhoso e propenso a erros. O operador CORRESPONDING resolve isso inteligentemente.

### Sintaxe Básica e Evolução

* Move-Corresponding (Antigo/Legado):  
  `MOVE-CORRESPONDING ls_a TO ls_b`.  
  Limitação: Não limpa os campos de ls_b que não existem em ls_a, e não permite regras complexas.  
* Corresponding Operator (Moderno - 7.40+):  
  `ls_b = CORRESPONDING #( ls_a )`.  
  Comportamento: Cria uma nova estrutura. Campos com nomes idênticos são copiados. Campos em ls_b que não existem em ls_a são inicializados (limpos), a menos que se use BASE.

### Recursos Avançados do `CORRESPONDING`

1. **MAPPING (De/Para):** Usado quando os nomes dos campos são diferentes (ex: kunnr no banco vs customer_id na UI).  
2. **EXCEPT (Exclusão):** Usado para proteger campos sensíveis ou técnicos de serem sobrescritos (ex: não queremos copiar o ID da chave primária numa operação de atualização).  
3. **BASE (Preservação):** Essencial para atualizações (UPDATE). Ele pega a estrutura existente como base e aplica as mudanças por cima, preservando os campos que não foram tocados.

``` ABAP
" Exemplo Teórico:  
ls_destino = CORRESPONDING #(   
    BASE ( ls_destino )  " Mantém os valores atuais de ls_destino  
    ls_origem            " Sobrescreve com valores de ls_origem onde nomes coincidem  
    MAPPING novonome = nomeantigo   
    EXCEPT campo_proibido   
).
```

## 4. Tipos de Estruturas: Planas vs. Profundas

É crucial entender a "profundidade" da sua estrutura, pois isso afeta como ela é copiada e processada.

* **Flat Structure (Estrutura Plana):** Contém apenas tipos elementares ou outras estruturas planas. Tem tamanho fixo na memória. É o tipo padrão de uma linha de tabela de banco de dados.  
* **Deep Structure (Estrutura Profunda):** Contém pelo menos um componente que é dinâmico (referência), como uma **String**, uma **Tabela Interna** ou uma **Referência de Objeto**.  
  * *Exemplo:* Uma estrutura de "Pedido de Venda" que contém um campo "Itens", onde "Itens" é uma tabela interna com lista de produtos.  
  * *Atenção:* Operações com estruturas profundas exigem cuidado extra. Sem a adição `DEEP`, o CORRESPONDING atribui componentes profundos de mesmo nome (ex: uma tabela interna aninhada) como um todo, seguindo as regras de conversão; com `CORRESPONDING #( DEEP ... )`, a correspondência por nome é aplicada recursivamente dentro das subestruturas e tabelas aninhadas. Strings e tabelas internas têm semântica de valor (a cópia é independente), enquanto componentes `REF TO` copiam apenas a referência (ambos apontam para o mesmo objeto).

``` ABAP
TYPES: BEGIN OF ty_pedido,  
         cliente  TYPE string,        " String torna a estrutura profunda (Deep)  
         endereco TYPE ty_endereco,   " Outra estrutura (Nested)  
         itens    TYPE tt_itens,      " Tabela Interna dentro da estrutura  
       END OF ty_pedido.

" Acesso aninhado:  
ls_pedido-endereco-cidade = 'São Paulo'.
  
" Acesso a tabela interna dentro da estrutura:  
ls_pedido-itens[ 1 ]-valor_total = '200.00'.
```

No projeto, o resultado da consulta de CEP (`zif_pc_viacep=>ty_resultado`) é uma estrutura assim: tem o componente aninhado `endereco` (lido como `ls_resultado-endereco-localidade`) e é profunda, porque todos os campos do endereço são `string`.

## 5. Exemplo Prático: Manipulação, Mapeamento e BASE

Neste exemplo expandido, simulamos um cenário comum no RAP: ler dados do banco, preparar para a UI, e depois simular uma atualização parcial vinda da UI preservando dados originais.

``` ABAP
CLASS zcl_structures_demo DEFINITION  
  PUBLIC  
  FINAL  
  CREATE PUBLIC .

  PUBLIC SECTION.  
    INTERFACES if_oo_adt_classrun .  
  PROTECTED SECTION.  
  PRIVATE SECTION.  
ENDCLASS.

CLASS zcl_structures_demo IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.

    " ---------------------------------------------------------------------  
    " 1. Definições de Tipos (Simulando Camadas do RAP)  
    " ---------------------------------------------------------------------  
      
    " Estrutura de Banco de Dados (Nomes técnicos, campos de sistema)  
    TYPES: BEGIN OF ty_db_item,  
             sku            TYPE string,  
             nome           TYPE string,  
             preco_unitario TYPE p LENGTH 10 DECIMALS 2,  
             currency       TYPE string,  
             created_by     TYPE string, " Campo de auditoria  
             created_at     TYPE timestampl,  
           END OF ty_db_item.

    " Estrutura de UI/Consumo (Nomes amigáveis, sem campos de sistema)  
    TYPES: BEGIN OF ty_ui_item,  
             codigo      TYPE string, " Mapeado de sku  
             produto     TYPE string, " Mapeado de nome  
             preco       TYPE p LENGTH 10 DECIMALS 2,  
             moeda       TYPE string,  
             status_text TYPE string, " Campo apenas de UI  
           END OF ty_ui_item.

    " ---------------------------------------------------------------------  
    " 2. Cenário A: Leitura (DB -> UI)  
    " ---------------------------------------------------------------------  
      
    " Populando a origem (Mock de um SELECT em zta_pc_item)  
    DATA(ls_db_source) = VALUE ty_db_item(  
      sku            = 'SKU-ELE-0000000001'  
      nome           = 'Fone Bluetooth'  
      preco_unitario = '199.90'  
      currency       = 'BRL'  
      created_by     = 'USER_SAP'  
      created_at     = '20260101120000'  
    ).

    " Usando CORRESPONDING com MAPPING para traduzir técnico -> amigável  
    " Note que created_by e created_at são ignorados pois não existem no destino  
    DATA(ls_ui_target) = CORRESPONDING ty_ui_item(  
      ls_db_source  
      MAPPING codigo  = sku  
              produto = nome  
              preco   = preco_unitario  
              moeda   = currency  
    ).  
      
    ls_ui_target-status_text = 'Em estoque'. " Enriquecendo dados na UI

    out->write( '--- Cenário A: DB para UI ---' ).  
    out->write( |DB: { ls_db_source-sku } / { ls_db_source-preco_unitario }| ).  
    out->write( |UI: { ls_ui_target-codigo } / { ls_ui_target-preco } ({ ls_ui_target-status_text })| ).

    " ---------------------------------------------------------------------  
    " 3. Cenário B: Atualização Parcial (UI -> DB) usando BASE e EXCEPT  
    " ---------------------------------------------------------------------  
      
    " Imagine que a UI mandou uma alteração: o preço mudou, mas o SKU é a chave (não muda)  
    " E a UI não sabe nada sobre 'created_by'.  
      
    DATA(ls_ui_input) = ls_ui_target.  
    ls_ui_input-preco = '179.90'. " Novo preço vindo da tela

    " Queremos atualizar ls_db_source com os dados de ls_ui_input  
    " MAS:  
    " 1. Devemos preservar o 'created_by' original (usando BASE)  
    " 2. Não queremos que a UI altere a moeda (usando EXCEPT)  
    " Obs.: o SKU (codigo) não é mapeado de volta, então permanece com o valor do BASE.  
      
    DATA(ls_db_updated) = CORRESPONDING ty_db_item(  
      BASE ( ls_db_source )            " Começa com a cópia dos dados atuais do banco  
      ls_ui_input                      " Aplica as mudanças vindas da UI  
      MAPPING preco_unitario = preco   " Nomes diferentes: o preço precisa de MAPPING  
      EXCEPT  currency                 " Protege a moeda (mantém o valor do BASE)  
    ).

    out->write( ' ' ).  
    out->write( '--- Cenário B: UI para DB (Update com BASE) ---' ).  
    out->write( |Original DB Price: { ls_db_source-preco_unitario } | ).  
    out->write( |Updated  DB Price: { ls_db_updated-preco_unitario } (Preço Atualizado)| ).  
    out->write( |Original CreatedBy: { ls_db_source-created_by }| ).  
    out->write( |Updated  CreatedBy: { ls_db_updated-created_by } (Preservado graças ao BASE)| ).

  ENDMETHOD.

ENDCLASS.
```

## Pontos de Atenção (Sintaxe Legada vs. Moderna)

| Conceito | ABAP Legado (Evitar) | ABAP Moderno (Recomendado) |
| :---- | :---- | :---- |
| Transferência por Nome | MOVE-CORRESPONDING a TO b. | b = CORRESPONDING #( a ). |
| Preservar Dados | Lógica manual de IFs para não limpar | b = CORRESPONDING #( BASE ( b ) a ). |
| Inicialização de Valores | Declaração linha a linha | DATA(s) = VALUE tipo( cmp1 = 'A' cmp2 = 'B' ). |
| Tipos Locais | TYPES: BEGIN OF ... (igual) | Uso intensivo de tipos inline em Classes |
| Definição de Work Area | DATA: wa LIKE ztabela. | DATA: wa TYPE ztabela. |

## Glossário Técnico

* **Structure (Estrutura):** Um objeto de dados complexo que contém uma sequência de componentes (campos) de qualquer tipo. É a representação em memória de uma linha de tabela ou entidade de negócio.  

* **Flat Structure (Estrutura Plana):** Estrutura que contém apenas tipos elementares de comprimento fixo. Não contém strings, tabelas internas ou referências. Essencial para chaves de tabelas e operações de banco de dados simples.  

* **Deep Structure (Estrutura Profunda):** Estrutura que contém referências (strings, tabelas internas, objetos). Exige gerenciamento de memória mais complexo pelo sistema.  

* **Nested Structure (Estrutura Aninhada):** Uma estrutura que contém outra subestrutura como um dos seus componentes. Permite modelar dados hierárquicos (ex: Cabeçalho -> Endereço).  

* **CORRESPONDING Operator:** Poderoso operador construtor que projeta dados de uma estrutura para outra baseando-se na correspondência de nomes ou regras de mapeamento explícito.  

* **BASE Addition:** Cláusula do operador CORRESPONDING (e outros construtores) que permite definir um valor inicial para a estrutura de destino antes de aplicar a cópia dos novos valores, essencial para operações de *Merge* ou *Update*.  

* **TYPES vs DATA:** TYPES define o "molde" ou a "planta" da estrutura (tempo de compilação). DATA aloca a memória e cria a "instância" utilizável (tempo de execução).

## Quiz de Fixação

1. Qual é o símbolo utilizado para acessar um componente dentro de uma estrutura ABAP?  
  R: O hífen (-). Exemplo: ls_usuario-nome. Isso difere da maioria das linguagens C-like que usam o ponto (.), que no ABAP é o terminador de instrução.

2. Se eu usar CORRESPONDING entre duas estruturas que têm campos com nomes totalmente diferentes, o que acontece?  
  R: Por padrão, nada será copiado e os campos da estrutura de destino ficarão vazios (inicializados), pois o operador busca nomes idênticos. Para que a cópia ocorra, é necessário usar a cláusula MAPPING (ex: MAPPING destino = origem) para ensinar ao sistema como ligar os campos.
 
3. Qual a diferença crucial entre ls_b = CORRESPONDING #( ls_a ) e ls_b = CORRESPONDING #( BASE ( ls_b ) ls_a )?  
  R: A primeira instrução limpa completamente ls_b antes de copiar os dados correspondentes de ls_a (os campos sem par em ls_a ficarão vazios). A segunda instrução mantém os valores originais de ls_b e apenas atualiza (sobrescreve) os campos que coincidirem com ls_a, agindo como um "Merge" de dados.
 
4. O que caracteriza uma "Estrutura Profunda" (Deep Structure) e por que devemos ter cuidado com elas?  
  R: Uma estrutura profunda contém campos de tamanho dinâmico ou referências, como STRING, TABLE ou REF TO. Devemos ter cuidado porque, em componentes `REF TO`, a cópia transfere apenas a referência (endereço de memória) e não o objeto em si; strings e tabelas internas são copiadas por valor, mas aumentam o custo de memória e processamento. Além disso, estruturas profundas não podem ser usadas em certos contextos de banco de dados ou chaves de tabelas simples.

## Links de Demonstrações

- [Como analisar objetos de dados estruturados usando a perspectiva de depuração](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_3A36CFBA3590F685:demo)
