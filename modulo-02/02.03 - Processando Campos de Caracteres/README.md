# Processando Campos de Caracteres

![Infográfico - A Evolução do Processamento de Strings em ABAP](./02.03_A_Evolucao_do_Processamento_de_Strings.png)

> **Comece pelos slides: [Processando campos de caracteres](./02.03_Processando_campos_de_caracteres.pptx)**
>
> Material complementar em PDF: [ABAP Moderno: Processamento de Strings](./02.03_ABAP_String_Processing_Evolution.pdf)
>
> **Referência oficial (ABAP Keyword Documentation):** [Regular Expressions (regex)](https://help.sap.com/docs/abap-cloud/abap-keywords/regular-expressions-regex)

## Objetivos de Aprendizagem

- Substituir comandos de manipulação de string obsoletos ou verbosos (`TRANSLATE`, `SEARCH`, `CONCATENATE`) por **Funções de String Embutidas** (`to_upper()`, `substring()`, `condense()`, `replace()`), aproveitando o encadeamento de métodos.  

- Aplicar **Expressões Regulares (Regex)** para resolver problemas complexos de validação (e-mail, CPF, telefone) e extração de padrões que seriam impossíveis com comandos simples.  

- Utilizar funções predicativas como **contains** (inclusive com os parâmetros `start`/`end`) e **matches** diretamente em condições lógicas, eliminando variáveis auxiliares e melhorando a legibilidade.  

- Realizar concatenações e formatações avançadas com **String Templates**, integrando lógica de apresentação diretamente na construção da string.

- Tornar textos do código **traduzíveis** com **text symbols**, sabendo quais outros textos (data elements, anotações, mensagens) já são traduzíveis por padrão.

## 1. Funções Embutidas: O Fim do "TRANSLATE"

No ABAP clássico, a manipulação de strings era feita através de comandos imperativos que modificavam a variável no local. Isso impedia o encadeamento de operações e tornava o código verboso. O ABAP 7.02+ (e, de forma mais completa, o 7.40+) introduziu uma biblioteca rica de funções que retornam o resultado, permitindo um estilo de programação funcional.

### Maiúsculas e Minúsculas

* **Antigo:** `TRANSLATE lv_text TO UPPER CASE.` (Modifica lv_text destrutivamente).  
* **Moderno:** `lv_text = to_upper( lv_text ).` (Retorna uma nova string, preservando a original se desejado).  
  * *Variação:* `to_lower( )` e `to_mixed( )` (CamelCase).

### Substrings e Tamanho

* **Antigo:** `lv_part = lv_text+0(5).` (Sintaxe de Offset/Length). É rígida e causa dumps se o offset for maior que o tamanho da string.  
* **Moderno:** `lv_part = substring( val = lv_text off = 0 len = 5 ).`  
  * *Vantagem:* Mais legível e funciona em qualquer posição de expressão, permitindo calcular o offset dinamicamente. *Atenção:* se `off`/`len` ultrapassarem o tamanho do texto, também ocorre uma exceção (`CX_SY_RANGE_OUT_OF_BOUNDS`), que pode ser tratada com `TRY...CATCH`.

### Limpeza de Espaços

* **Antigo:** `CONDENSE lv_text.` / `CONDENSE lv_text NO-GAPS.`  
* **Moderno:** `lv_text = condense( lv_text ).` / ``` lv_text = condense( val = lv_text to = `` ). ```  
  * *Diferença:* Por padrão, a função `condense()` remove espaços das pontas (Trim) e reduz espaços múltiplos internos para um único espaço (como `CONDENSE`). Para remover *todos* os espaços (como o `NO-GAPS`), informe uma string vazia no parâmetro `to` (``` to = `` ```).

## 2. O Poder das Expressões Regulares (Regex)

Quando precisamos encontrar ou validar padrões abstratos (e não apenas texto fixo), as funções de string tradicionais falham. O suporte a Regex no ABAP moderno é robusto e segue o padrão **PCRE** (Perl Compatible Regular Expressions), informado nas funções pelo parâmetro `pcre`. O antigo parâmetro `regex` (sintaxe POSIX) é obsoleto e gera aviso de sintaxe — prefira sempre `pcre`.

### Validação (Matches)

Verificar se um texto segue um formato específico, como um e-mail corporativo.

``` ABAP
" Padrão: Texto + @ + Texto + . + Texto (Simplificado)  
IF matches( val = lv_email pcre = `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` ).  
  " É um email sintaticamente válido  
ELSE.  
  " Formato inválido  
ENDIF.
```

### Substituição e Limpeza (Replace)

Um cenário comum em integrações é receber dados "sujos", como um telefone `(11) 99999-0000` que precisa ser salvo no banco apenas como números `11999990000`.

``` ABAP
DATA(lv_phone) = '(11) 99999-0000'.

" Regex '[^0-9]' significa: Encontre qualquer caractere que NÃO (^) seja um dígito (0-9).  
" A função substitui esses caracteres por uma string vazia (``), limpando o texto.  
" occ = 0 substitui todas as ocorrências.  
DATA(lv_clean) = replace( val = lv_phone pcre = `[^0-9]` with = `` occ = 0 ).  
" Resultado: '11999990000'
```

## 3. Funções Predicativas

São funções especiais projetadas para retornar um valor booleano implícito, permitindo seu uso direto dentro de comandos `IF`, `CHECK` ou `COND`. Elas eliminam a necessidade de fazer uma operação, checar o sy-subrc e depois decidir.

* **`contains( val = ... sub = ... )`**: Verifica se uma string contém uma substring.  
* **`contains( val = ... start = ... )` / `contains( val = ... end = ... )`**: Verifica se a string começa ou termina com determinado texto (o ABAP não possui funções `starts_with`/`ends_with`; usa-se `contains` com os parâmetros `start` e `end`).  
* **matches**: Verifica se a string corresponde a um Regex.

``` ABAP
" Verifica se é uma mensagem de erro sem precisar de SEARCH  
IF contains( val = lv_msg sub = 'Erro' ) OR contains( val = lv_msg start = 'E:' ).  
  " Tratar erro  
ENDIF.
```

## 4. Exemplo Prático: Higienização de Dados

Vamos criar uma classe utilitária que recebe dados brutos de um cadastro externo (ex: planilha Excel ou API legado) e os padroniza para o formato SAP.

``` ABAP
CLASS zcl_string_proc DEFINITION  
  PUBLIC  
  FINAL  
  CREATE PUBLIC .

  PUBLIC SECTION.  
    INTERFACES if_oo_adt_classrun .  
  PROTECTED SECTION.  
  PRIVATE SECTION.  
ENDCLASS.

CLASS zcl_string_proc IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.

    " Dados de Entrada (Sujos e despadronizados)  
    DATA(lv_raw_name)  = '  joão  da  silva  '.  
    DATA(lv_raw_email) = 'JOAO.SILVA@SAP.COM'.  
    DATA(lv_raw_sku)   = 'MAT-1234-BR'.

    " 1. Padronização de Nome (Limpeza e Maiúsculas)  
    " Encadeamento: Primeiro remove espaços extras, depois converte para maiúsculo  
      
    DATA(lv_name) = to_upper( condense( val = lv_raw_name ) ).  
      
    out->write( |Nome Limpo: '{ lv_name }'| ).

    " 2. Padronização de Email (Minúsculo)  
    " E-mails são geralmente armazenados em minúsculo para facilitar busca/login  
    DATA(lv_email) = to_lower( lv_raw_email ).  
    out->write( |Email Limpo: '{ lv_email }'| ).

    " 3. Extração de Informação com Regex  
    " Cenário: Extrair apenas a parte numérica do SKU 'MAT-1234-BR'  
    " O padrão \d+ busca uma sequência contínua de dígitos.  
    " match( ) retorna o trecho encontrado (find( ) retornaria apenas a posição).  
      
    DATA(lv_extracted_num) = match( val = lv_raw_sku pcre = `\d+` ). " '1234'  
      
    out->write( |Número do Material extraído: { lv_extracted_num }| ).

    " 4. Validação Lógica com Predicados  
    " Classificar o produto baseado no prefixo  
      
    DATA(lv_type) = COND string(  
      WHEN contains( val = lv_raw_sku start = 'MAT' ) THEN 'Material Físico'  
      WHEN contains( val = lv_raw_sku start = 'SRV' ) THEN 'Serviço'  
      ELSE 'Desconhecido'  
    ).  
      
    out->write( |Tipo de Produto: { lv_type }| ).

  ENDMETHOD.

ENDCLASS.
```

## 5. Textos Traduzíveis: Text Symbols

Os textos que chegam à interface precisam aparecer no idioma de logon do usuário. Rótulos de **data elements**, anotações como `@EndUserText` em CDS e metadata extensions, e mensagens de **message classes** são traduzíveis por padrão. **Literais no código-fonte não são**: o conteúdo é sempre o mesmo, em qualquer idioma.

Quando um literal com texto de negócio chega à UI, substitua-o por um **text symbol**, armazenado no *text pool* da classe global:

* **ID de 3 caracteres** (dígitos e/ou letras, ex.: `001`, `HAU`), único no text pool.

* **Comprimento máximo:** Defina bem acima do tamanho atual (limite técnico: 255). Ele é um limite rígido para o tradutor e evita abreviações forçadas.

``` ABAP
" Literal: nunca é traduzido
out->write( 'Voos encontrados:' ).

" Text symbol isolado
out->write( TEXT-001 ).

" Literal com text symbol: usa o texto traduzido se existir; o literal é o fallback
out->write( 'Voos encontrados:'(001) ).
```

**Dicas:** Use o *quick fix* (`Ctrl+1`) sobre o literal para criar o text symbol automaticamente. Mantenha o literal e o text symbol idênticos: a verificação estendida (SLIN) do ATC avisa quando eles divergem. O idioma original do objeto aparece na aba **Properties** do ADT.

## Comparação: Antigo vs Novo

#### Operações

* **Maiúsculas:**
  * **ANTIGO:** `TRANSLATE x TO UPPER CASE`
  * **NOVO:** `x = to_upper( x )`

* **Tamanho:**
  * **ANTIGO:** `COMPUTE len = STRLEN( x ).`
  * **NOVO:** `len = strlen( x )` (usável diretamente em qualquer expressão)

* **Busca:**
  * **ANTIGO:** `SEARCH x FOR 'ABC'`
  * **NOVO:** `find( val = x sub = 'ABC' )` (retorna a posição ou -1)

* **Confere Padrão:**
  * **ANTIGO:** CP (Contains Pattern)
  * **NOVO:** `matches( val = x pcre = ... )`

* **Concatenar:**
  * **ANTIGO:** `CONCATENATE a b INTO c`
  * **NOVO:** `c = |{ a }{ b }|`

* **Substituir:**
  * **ANTIGO:** `REPLACE 'A' WITH 'B' INTO x`
  * **NOVO:** `x = replace( val = x sub = 'A' with = 'B' )`

## Glossário Técnico

* **Built-in Functions (Funções Embutidas):** Funções nativas da linguagem ABAP (como `strlen`, `to_upper`, `replace`) que podem ser usadas em qualquer posição de operando (dentro de IFs, atribuições, chamadas de método), substituindo comandos procedurais antigos.  

* **Regex (Regular Expressions):** Uma linguagem formal para descrever padrões de texto. Usada para validação complexa (ex: formatos de CPF, CNPJ, E-mail) e operações de busca/substituição avançadas que variam conforme o conteúdo.  

* **Chaining (Encadeamento):** A capacidade de chamar uma função dentro do resultado de outra, como `func1( func2( var ) )`. Isso permite escrever transformações complexas de dados em uma única linha legível.  

* **Predicative Function:** Uma função que retorna um valor verdade (booleano) para uso em expressões lógicas. Exemplos: `contains()`, `matches()`, `line_exists()`.

## Quiz de Fixação

1. Qual a diferença de comportamento entre a função `condense( val = text )` e o comando antigo `CONDENSE text NO-GAPS`?  
  R: A função `condense()` moderna, por padrão, remove apenas os espaços em branco das extremidades (trim) e reduz múltiplos espaços internos para um único espaço (ex: " A  B " vira "A B"). O comando `NO-GAPS` remove todos os espaços da string, colando os caracteres (ex: " A  B " vira "AB"). Para simular `NO-GAPS` modernamente, usa-se ``` condense( val = text to = `` ) ```.  

2. Para verificar se uma variável de string contém o domínio "@sap.com" no final (sufixo), qual função é a mais performática e legível?  
  R: A função predicativa `contains( val = lv_email end = '@sap.com' )`. O parâmetro `end` verifica especificamente o sufixo, deixando a intenção clara (o ABAP não possui uma função `ends_with`).  

3. O que a expressão regex `[^0-9]` significa quando usada em uma função `replace()` para limpeza de dados?  
  R: Ela significa "Qualquer caractere que NÃO seja um dígito numérico de 0 a 9". O acento circunflexo `^` dentro dos colchetes `[]` nega o conjunto. É comumente usada para higienizar strings que deveriam ser numéricas (como telefones ou documentos), removendo formatação como pontos, traços e parênteses.
