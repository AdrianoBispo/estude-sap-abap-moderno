# Usando Tipos de Dados e Conversões Corretamente

![Infográfico - Guia Rápido de Tipos de Dados e Conversões Seguras](./04.02_Guia_Rapido_Tipos_de_Dados_e_Conversoes_Seguras.png)

> **Comece pelos slides: [ABAP Moderno: Tipos de Dados e Conversões](./04.02_ABAP_Moderno_Tipos_e_Conversões.pdf)**
>
> **Referência oficial (ABAP Keyword Documentation):** [Built-In ABAP Types](https://help.sap.com/docs/abap-cloud/abap-keywords/built-in-abap-types)

## Objetivos de Aprendizagem

- Identificar e selecionar corretamente os **Tipos de Dados Primitivos** do ABAP (I, P, C, STRING, D, T), compreendendo suas implicações de memória e precisão.  

- Diferenciar com clareza a **Conversão Implícita** (Automática) da **Conversão Explícita** (Manual), reconhecendo os riscos de confiar na "mágica" do compilador.  

- Utilizar o operador construtor **CONV** para realizar conversões seguras, legíveis e com tratamento de exceções.  

- Prevenir e diagnosticar erros comuns de **Overflow** (Estouro numérico) e **Truncation** (Corte de texto) que podem causar Dumps em produção.

- Calcular com **datas, horas e timestamps** (`d`, `t`, `utclong`) e converter entre fusos horários com `CONVERT UTCLONG`.

## 1. O Zoológico de Tipos ABAP: Uma Escolha Estratégica

O ABAP possui um legado de tipos de dados que evoluiu ao longo de décadas. Escolher o tipo errado não é apenas uma questão de "funcionar ou não", mas de performance e integridade de dados financeiros.

### Numéricos: Precisão vs. Performance

* **I (Integer):** Números inteiros de 4 bytes (ex: -2.147.483.648 a +2.147.483.647).  
  * *Uso Ideal:* Contadores de loops, índices de tabelas, quantidades indivisíveis (peças).  
  * *Risco:* Arredonda automaticamente qualquer decimal atribuído (ex: 3.9 vira 4).  

* **P (Packed Number):** Números de ponto fixo decimais. Armazena dois dígitos decimais por byte.  
  * *Uso Ideal:* **Obrigatório para valores monetários, pesos e medidas**.  
  * *Característica:* Garante precisão exata. Você define o tamanho total e as casas decimais (ex: TYPE p LENGTH 8 DECIMALS 2).  
  * *Atenção:* Cálculos intermediários podem estourar se a variável de destino for pequena.  

* **F (Binary Float):** Ponto flutuante binário (padrão IEEE 754).  
  * *Uso Ideal:* Cálculos científicos ou estatísticos que exigem magnitudes extremas (muito grande ou muito pequeno).  
  * *Risco:* **Impreciso para dinheiro**. O valor 0.1 pode ser armazenado como 0.09999999. Nunca use para saldo bancário.

### Texto: Fixo vs. Dinâmico

* **C (Char):** Texto de tamanho fixo pré-alocado na memória.  
  * *Comportamento:* Se você declarar CHAR(10) e escrever "Oi", o sistema guarda "Oi " (com 8 espaços).  
  * *Uso:* Campos de código (Chaves, IDs, Status).  

* **STRING:** Texto de tamanho dinâmico.  
  * *Comportamento:* Aloca apenas o necessário mais um ponteiro de gerenciamento.  
  * *Uso:* Descrições, logs, concatenações longas. É o padrão do ABAP moderno.

### Data e Hora: O Formato Interno

* **D (Date):** Tecnicamente é um CHAR(8) com formato AAAAMMDD.  
  * *Dica:* Permite aritmética de dias direta (data + 1).  
* **T (Time):** Tecnicamente é um CHAR(6) com formato HHMMSS.  
  * *Dica:* Permite aritmética de segundos (hora + 60).

## 2. O Perigo da Conversão Implícita

O ABAP é conhecido por ser "user-friendly" (ou permissivo demais) com tipos. Se você tentar colocar um texto num número, o compilador não dá erro de sintaxe; ele tenta converter em tempo de execução.

* **Exemplo Perigoso:**
  ``` ABAP
  DATA: lv_num TYPE i.  
  lv_num = '100'.   " Funciona (converte string '100' para int 100)  
  lv_num = '100.9'. " Funciona (arredonda para 101)  
  lv_num = '100,9'. " ERRO em tempo de execução (CX_SY_CONVERSION_NO_NUMBER): a conversão
                    " só aceita ponto como separador decimal, independentemente do usuário
  ```

* **Os Riscos Principais:**

  1. **Truncation (Corte Silencioso):**  
    Mover um texto longo para um curto corta o final sem avisar.  
    ``` ABAP
    DATA: lv_short TYPE c LENGTH 3.  
    lv_short = 'Bananas'. " Resultado: 'Ban'. O resto sumiu.
    ```

  2. **Overflow (Estouro Numérico):** Mover um número grande para uma variável pequena causa um Dump (Erro em tempo de execução que derruba o programa). **Exceção:** `CX_SY_CONVERSION_OVERFLOW`.  

  3. **Erro de Formato (Conversão Impossível):** Tentar converter 'ABC' para Inteiro. **Exceção:** `CX_SY_CONVERSION_NO_NUMBER`.

## 3. A Solução Moderna: Operador `CONV`

Para escrever código robusto (Clean Code), evite depender da sorte. Use **Conversão Explícita**. O operador `CONV` deixa claro para quem lê o código que uma transformação está ocorrendo e permite controlar o tipo de destino.

**Vantagens do `CONV`:**
   * **Legibilidade:** Fica óbvio que `String` está virando `Float`.  
   * **Inline:** Pode ser usado dentro de chamadas de método ou concatenações.  
   * **Segurança:** Facilita o envelopamento em blocos `TRY...CATCH`.

``` ABAP
" Exemplo: Chamando um método que espera um Inteiro, mas tenho um Char  
lo_calc->somar(   
  iv_val1 = CONV i( '10' )   
  iv_val2 = 20   
).

" Exemplo: Garantindo precisão decimal ao ler de uma string  
TYPES ty_amount TYPE p LENGTH 15 DECIMALS 2.  
DATA(lv_price) = CONV ty_amount( '150.55' ).
```

## 4. Conversão de Tipos Especiais (Alpha Conversion)

No ecossistema SAP, muitos identificadores numéricos (Cliente, Fornecedor, Material, Pedido) são tecnicamente armazenados como texto (`CHAR`ou `NUMC`) e exigem preenchimento com zeros à esquerda para funcionarem nas buscas de banco de dados.

* **Externo (Tela):** 123  
* **Interno (Banco):** 0000000123

Para converter entre esses formatos sem ter que escrever loops manuais de concatenação, usamos o operador de formatação ALPHA.

``` ABAP
DATA(lv_input_user) = '123'.

" 1. Preparar para o Banco (IN = Colocar Zeros)  
" WIDTH define o tamanho final; sem ele, o resultado mantém o tamanho
" do operando ('123' tem 3 posições e continuaria '123').
DATA(lv_matnr_db) = |{ lv_input_user ALPHA = IN WIDTH = 10 }|.   
" Resultado: '0000000123' (Agora o SELECT funciona)

" 2. Preparar para a Tela (OUT = Tirar Zeros)  
DATA(lv_display) = |{ lv_matnr_db ALPHA = OUT }|.  
" Resultado: '123' (Mais amigável para o usuário)
```

## 5. Exemplo Prático: Lidando com Conversões Robustas

Neste exemplo, vamos simular o processamento de um arquivo texto (onde tudo é string) e a conversão segura para tipos de negócio, tratando erros de formato e internacionalização.

``` ABAP
CLASS zcl_data_types DEFINITION  
  PUBLIC  
  FINAL  
  CREATE PUBLIC .

  PUBLIC SECTION.  
    INTERFACES if_oo_adt_classrun .  
  PROTECTED SECTION.  
  PRIVATE SECTION.  
ENDCLASS.

CLASS zcl_data_types IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.

    " --- Cenário 1: Conversão Segura de Valor Monetário (String -> Packed) ---  
    " Imagine que este valor veio de uma API JSON ou arquivo CSV  
    DATA(lv_string_num) = '150.55'.   
      
    TRY.  
        " Tenta converter String para Packed Number (Dinheiro)  
        " Tipo local com 2 casas decimais (elementos de dados como KBETR  
        " não são liberados no ABAP Cloud)  
        TYPES ty_amount TYPE p LENGTH 15 DECIMALS 2.  
        DATA(lv_amount) = CONV ty_amount( lv_string_num ).  
        out->write( |Sucesso! Valor convertido: { lv_amount }| ).

    CATCH cx_sy_conversion_no_number.  
        out->write( 'Erro Crítico: O texto fornecido não é um número válido.' ).  
    ENDTRY.

    " --- Cenário 2: Perda de Precisão (O Perigo do Arredondamento) ---  
    " O sistema converte automaticamente, mas arredonda. Isso pode gerar  
    " diferenças de centavos em relatórios financeiros.  
    DATA(lv_float_val) = '10.7'.  
    DATA(lv_int_val)   = CONV i( lv_float_val ).   
      
    out->write( |Atenção: Float { lv_float_val } virou Inteiro { lv_int_val } (Arredondou!)| ).

    " --- Cenário 3: Truncamento de Texto (Perda de Dados) ---  
    DATA(lv_long_text) = 'Esta é uma frase muito longa que não cabe no destino'.  
    TYPES ty_short_char TYPE c LENGTH 10.  
      
    " Ao forçar a conversão para um tipo menor, o ABAP corta o final  
    DATA(lv_short) = CONV ty_short_char( lv_long_text ).  
      
    out->write( |Texto original: { lv_long_text }| ).  
    out->write( |Texto cortado : '{ lv_short }'| ). " Resultado: 'Esta é uma'

    " --- Cenário 4: Conversão Alpha para Chaves ---  
    DATA(lv_customer_input) = '4500'.  
      
    " Simulando busca no banco  
    " Se buscássemos WHERE kunnr = '4500', falharia. O banco tem '0000004500'.  
    DATA(lv_customer_db) = |{ lv_customer_input ALPHA = IN WIDTH = 10 }|.  
      
    out->write( |Input Usuário: { lv_customer_input } -> Chave Banco: { lv_customer_db }| ).

  ENDMETHOD.

ENDCLASS.
```

## 6. Calculando com Datas, Horas e Timestamps

**Aritmética com `d` e `t`:** Para calcular, o ABAP converte a data em número de dias desde 01.01.0001 e a hora em segundos desde a meia-noite. Por isso `data + 7` soma sete dias e `data2 - data1` devolve a diferença em dias. Partes da data podem ser lidas com offset e comprimento: ano `lv_date(4)`, mês `lv_date+4(2)`, dia `lv_date+6(2)`.

**Data e hora atuais:** No ABAP Cloud, use a classe `cl_abap_context_info` (`get_system_date( )`, `get_system_time( )`, `get_user_time_zone( )`) em vez das variáveis de sistema.

**Timestamps com `utclong`:** Representa um instante no padrão ISO-8601 (`AAAA-MM-DD HH:MM:SS.sssssss`), com precisão de 100 nanossegundos e sempre em UTC. É o tipo indicado quando fusos horários importam.

``` ABAP
DATA lv_data_usuario TYPE d.
DATA lv_hora_usuario TYPE t.

DATA(lv_agora)  = utclong_current( ).                              " Instante atual (UTC)
DATA(lv_semana) = utclong_add( val = lv_agora days = 7 ).          " + 7 dias
DATA(lv_seg)    = utclong_diff( high = lv_semana low = lv_agora ). " Diferença em segundos

" UTC -> data e hora locais do usuário
CONVERT UTCLONG lv_agora
  INTO DATE lv_data_usuario
       TIME lv_hora_usuario
  TIME ZONE cl_abap_context_info=>get_user_time_zone( ).

" Data e hora locais (ex.: partida de um voo, no fuso do aeroporto) -> UTC
" lv_hora_partida TYPE t e lv_fuso_aeroporto (fuso horário) vêm dos dados do voo
CONVERT DATE cl_abap_context_info=>get_system_date( )
        TIME lv_hora_partida
        TIME ZONE lv_fuso_aeroporto
  INTO UTCLONG DATA(lv_partida_utc).
```

> **Exemplo clássico:** a duração de um voo entre aeroportos de fusos diferentes só fica correta depois de converter partida e chegada para UTC e subtrair os dois instantes.

## Regras de Ouro para Tipos

| Cenário | Tipo Recomendado | Tipo a Evitar | Por quê? |
| :---- | :---- | :---- | :---- |
| **Dinheiro** | Packed (P) | Float (F) | Float tem imprecisão binária (0.1 virou 0.0999). |
| **Contadores** | Integer (I) | Packed (P) | Inteiros são processados mais rápido pela CPU. |
| **Texto** | String | Char (C) | String economiza memória e evita truncamento. |
| **IDs (Mat/Cli)** | Char/Numc | Integer | IDs podem ter zeros à esquerda que Inteiro remove. |

## Glossário Técnico

* **Type Casting (Conversão de Tipo):** Processo de transformar o valor de uma variável de um tipo de dado (ex: String) para outro (ex: Inteiro). Pode ser Implícito (feito automaticamente pelo compilador) ou Explícito (ordenado pelo desenvolvedor).  

* **Implicit Conversion (Conversão Implícita):** Quando o ABAP converte automaticamente os tipos na atribuição (=). É conveniente para prototipagem, mas perigoso em produção pois esconde arredondamentos e perdas de precisão.  

* **Explicit Conversion (CONV):** Uso do operador construtor CONV para forçar a conversão de forma clara. É a prática recomendada no ABAP Moderno para garantir a legibilidade e a intenção do código.  

* **Overflow (Estouro):** Erro de tempo de execução (Dump) que ocorre quando um número é grande demais para caber na variável de destino (Exceção: CX_SY_CONVERSION_OVERFLOW).  

* **Truncation (Truncamento):** Perda de dados que ocorre quando uma string longa é movida para uma variável de texto mais curta. O final da string é descartado silenciosamente.  

* **Alpha Conversion:** Rotina padrão do SAP (CONVERSION_EXIT_ALPHA) usada para adicionar zeros à esquerda (IN) ou remover zeros (OUT) em campos numéricos armazenados como caracteres (ex: 000123).

## Quiz de Fixação

1. O que acontece se eu tentar converter a string 'ABC' para um tipo Inteiro (I) usando o operador CONV?  
  R: Ocorrerá um erro em tempo de execução (Dump) do tipo CX_SY_CONVERSION_NO_NUMBER. Letras não podem ser convertidas matematicamente para números inteiros. Em código produtivo, devemos sempre envolver conversões de fontes externas em blocos TRY...CATCH.  

2. Qual a diferença fundamental de comportamento entre os tipos C (Char) e STRING?  
  R: O tipo C tem tamanho fixo (alocado estaticamente). Se o texto for menor que o tamanho, ele preenche o resto com espaços em branco à direita. O tipo STRING tem tamanho dinâmico e cresce conforme necessário, economizando memória para textos curtos e permitindo textos muito longos sem corte.
  
3. Como devo converter o valor '100' para o formato '0000000100' (formato padrão de banco de dados para materiais e clientes) usando String Templates?  
  R: Utilizando a opção de formatação ALPHA = IN. A sintaxe correta dentro do template é: `|{ '100' ALPHA = IN WIDTH = 10 }|`. Isso instrui o sistema a aplicar a rotina de conversão Alpha para adicionar os zeros à esquerda. O `WIDTH` é necessário aqui porque, sem ele, o resultado mantém o tamanho do operando (o literal `'100'` tem apenas 3 posições).
