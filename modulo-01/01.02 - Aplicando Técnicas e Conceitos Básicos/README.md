# Aplicando Técnicas e Conceitos Básicos

![Infográfico - Um Guia Rápido do Sintaxe](./01.02_Um_Guia_Visual_de_Boas_Praticas.png)

> **Comece pelos slides: [ABAP Moderno: Escreva Menos, Realize Mais](./01.02_ABAP_Moderno_Escreva_Menos_Realize_Mais.pdf)**
>
> **Referência oficial (ABAP Keyword Documentation):** [Constructor Operators for Constructor Expressions](https://help.sap.com/docs/abap-cloud/abap-keywords/constructor-operators-for-constructor-expressions)

## Objetivos de Aprendizagem

- Dominar o uso de **Declarações Inline** para variáveis e *Field Symbols*, compreendendo regras de escopo, inferência de tipos complexos e o impacto na legibilidade do código.  
- Manipular textos de forma avançada utilizando **String Templates**, explorando formatações de data, número, conversão ALPHA, alinhamento e chamadas de métodos embutidas.  
- Aplicar estruturas de controle de fluxo modernas, substituindo lógicas verbosas por operadores construtores como **`COND`**, **`SWITCH`** e introduzindo o uso de **`LET`** para variáveis auxiliares.  
- Utilizar o operador **`VALUE`** para construção rápida de estruturas e tabelas.  
- Utilizar funções embutidas para operações de string e lógica booleana, alinhando-se aos princípios de *Clean Code* e evitando a criação de variáveis globais desnecessárias.

- Depurar programas no **ABAP Debugger** do ADT, usando breakpoints, navegação passo a passo e inspeção de variáveis.

## 1. Declarações de Variáveis: O Jeito Moderno (Inline Declarations)

A introdução das declarações em linha (Inline Declarations) na versão 7.40 foi um verdadeiro divisor de águas para a linguagem ABAP. No modelo clássico, a separação rígida entre a declaração de dados (DATA) no topo do código e a lógica de execução forçava o desenvolvedor a um constante "sobe e desce" na tela para verificar tipos e tamanhos de variáveis.

No ABAP Moderno, a filosofia é clara: **Declare onde você usa.** Isso aproxima a definição da variável do seu contexto de uso, facilitando a leitura e a refatoração.

### Inferência de Tipo e Detalhes Técnicos

O operador de declaração inline DATA(...) não é mágica; ele instrui o compilador a deduzir o tipo de dados com base estritamente no lado direito da atribuição.

* Variáveis Elementares e Literais:  
  Ao atribuir literais, o sistema assume tipos padrão que podem precisar de atenção.  
``` ABAP
  DATA(lv_text) = 'Texto'.      " Infere tipo c (char) de tamanho fixo baseado no texto  
  DATA(lv_string) = `Texto`.    " Infere tipo string (dinâmico) devido à crase  
  DATA(lv_number) = 100.        " Infere i (inteiro)
```

* Estruturas e Objetos (O Grande Ganho de Produtividade):  
  Imagine chamar um método de uma BAPI ou classe standard que retorna uma estrutura complexa com 50 campos ou mais. Antigamente, você teria que abrir a SE11, verificar a estrutura de retorno, declarar uma work area manualmente e só então chamar o método.  
  Com declaração inline, o compilador faz o trabalho pesado:  
``` ABAP
  " O sistema cria ls_result automaticamente com a estrutura exata do retorno  
  DATA(ls_result) = lo_objeto->get_complex_data( ).

  " Funciona inclusive para tabelas internas  
  SELECT * FROM flight_schedule INTO TABLE @DATA(lt_flights).
```

* Casting durante a Declaração:  
  Às vezes, a inferência automática não é suficiente (ex: o método retorna uma referência genérica, como `TYPE REF TO object`, mas você sabe que é um objeto específico). Você pode combinar inline com casting:  
``` ABAP
  DATA(lo_alv) = CAST cl_gui_alv_grid( lo_container->get_content( ) ).
```

### Field Symbols Inline e Performance

Também podemos declarar ponteiros (Field Symbols) diretamente em loops. Isso não apenas economiza linhas, mas incentiva o uso de referências em vez de cópias de valor, o que é crucial para performance em grandes tabelas.

* **Comparativo de Memória:**  
``` ABAP
  " Clássico (WORK AREA): Copia todo o conteúdo da linha para uma nova área de memória.  
  " Lento para estruturas largas.  
  LOOP AT lt_tabela INTO DATA(ls_copia).   
  ENDLOOP.

  " Moderno (FIELD-SYMBOL): Cria apenas um ponteiro para a linha existente.  
  " Muito mais rápido e permite modificar a tabela diretamente.  
  LOOP AT lt_tabela ASSIGNING FIELD-SYMBOL(<fs_linha>).  
    <fs_linha>-status = 'X'.  
  ENDLOOP.
```

**Nota Crítica sobre Escopo:** É um erro comum pensar que uma variável declarada inline dentro de um bloco IF ou LOOP deixa de existir quando o bloco fecha. No ABAP, o escopo é o **método** (ou form/function) inteiro.

``` ABAP
IF lv_condition = abap_true.  
  DATA(lv_temp) = 5.  
ENDIF.

" A variável lv_temp AINDA EXISTE aqui e pode ser acessada, o que pode causar bugs  
" se o desenvolvedor não estiver atento. Mantenha a disciplina de nomes!  
lv_temp = 10. 
```

## 2. Manipulação de Strings: String Templates

O comando `CONCATENATE` era limitado, verboso e difícil de ler quando envolvia muitas variáveis e espaços. Os **String Templates**, delimitados por barras verticais (`| ... |`), trouxeram o poder das linguagens modernas para o ABAP.

### Interpolação, Cálculos e Chamadas de Método

A grande vantagem é a capacidade de realizar processamento *dentro* da string. Qualquer expressão ABAP válida pode ser colocada entre chaves `{ ... }`.

``` ABAP
DATA(lv_nome) = 'Ana'.  
DATA(lv_sobrenome) = 'Silva'.

" Concatenação limpa (Espaços são respeitados literalmente)  
DATA(lv_completo) = |Prezado cliente: { lv_nome } { lv_sobrenome }|.

" Lógica embutida: Chamando métodos funcionais dentro do texto  
DATA(lv_log) = |O usuário { lo_user->get_name( ) } acessou em { cl_abap_context_info=>get_system_time( ) }|.

" Expressões condicionais embutidas  
DATA(lv_status_txt) = |O aluno foi { COND #( WHEN lv_nota > 7 THEN 'Aprovado' ELSE 'Reprovado' ) }|.
```

### Opções de Formatação (Formatting Options)

Os templates suportam parâmetros de formatação que eliminam a necessidade de chamar Functions Modules de conversão externas (como CONVERSION_EXIT_...).

* Datas e Números (Internacionalização):  
  O ABAP ajusta automaticamente o formato baseando-se nas configurações do usuário logado.  
``` ABAP
  DATA(lv_hoje) = cl_abap_context_info=>get_system_date( ).

  " Formato Técnico (YYYY-MM-DD)  
  out->write( |Data ISO: { lv_hoje DATE = ISO }| ).   

  " Formato do Usuário (ex: 31.12.2023 no Brasil, 12/31/2023 nos EUA)  
  out->write( |Data User: { lv_hoje DATE = USER }| ). 

  " Formato de Moeda: CURRENCY define as casas decimais pela moeda.
  " Atenção: com tipo i, o separador decimal é INSERIDO conforme a moeda
  " (5000 com BRL viraria 50,00). Por isso usamos um tipo p com 2 decimais.
  DATA lv_salary TYPE p LENGTH 15 DECIMALS 2 VALUE '5000.00'.  
  out->write( |Salário: { lv_salary CURRENCY = 'BRL' NUMBER = USER }| ). " 5.000,00
```

* Conversão ALPHA (Zeros à Esquerda):  
  Essencial para chaves de banco de dados (ex: Cliente, Material, Documento).  
``` ABAP
  DATA(lv_matnr) = '123'.

  " ALPHA = IN: Adiciona zeros (Output: 000000000000000123)  
  " Sem WIDTH, o resultado mantém o tamanho do operando ('123' tem 3 posições
  " e continuaria '123'); por isso informamos o tamanho desejado.
  DATA(lv_db_format) = |{ lv_matnr ALPHA = IN WIDTH = 18 }|. 

  " ALPHA = OUT: Remove zeros (Output: 123)  
  DATA(lv_screen_format) = |{ lv_db_format ALPHA = OUT }|. 
```

* Alinhamento e Preenchimento (Padding):  
  Útil para gerar arquivos de texto posicional (CNAB, layouts bancários).  
``` ABAP
  " Alinha à direita, largura 10, preenche com zero: '00000Texto'  
  out->write( |{ 'Texto' WIDTH = 10 ALIGN = RIGHT PAD = '0' }| ). 
```

## 3. Estruturas de Controle e Operadores Construtores

Além de modernizar o `IF` e `CASE` com operadores simbólicos (`=`, `<>`, `<=`), o ABAP moderno introduziu **Operadores Construtores**. Eles permitem "construir" resultados complexos em uma única linha de comando.

### Operador COND (O "IF" Funcional)

Usado para atribuir valores baseados em condições. Diferente do `IF`, ele deve retornar um resultado para ser atribuído.

* **Antigo (Verboso):**  
``` ABAP
  IF lv_idade < 12.  
    lv_fase = 'Criança'.  
  ELSEIF lv_idade < 18.  
    lv_fase = 'Adolescente'.  
  ELSE.  
    lv_fase = 'Adulto'.  
  ENDIF.
```

* Moderno (Conciso):  
  Com declaração inline o tipo do resultado precisa ser explícito (aqui, `string`). O `#` ("infira o tipo pelo contexto") só pode ser usado quando o destino já tem tipo conhecido (ex: `lv_fase = COND #( ... )` com `lv_fase` declarada antes).  
``` ABAP
  DATA(lv_fase) = COND string( WHEN lv_idade < 12 THEN 'Criança'  
                               WHEN lv_idade < 18 THEN 'Adolescente'  
                               ELSE 'Adulto' ).
```

### Operador SWITCH (O "CASE" Funcional)

Ideal quando a decisão é baseada em valores específicos de uma única variável.

``` ABAP
DATA(lv_cor_semaforo) = SWITCH string( lv_status  
                          WHEN 'S' THEN 'Verde'   " Success  
                          WHEN 'E' THEN 'Vermelho'" Error  
                          WHEN 'W' THEN 'Amarelo' " Warning  
                          ELSE 'Cinza' ).         " Default
```

### Expressão `LET` (Variáveis Locais Temporárias)

Uma das adições mais poderosas. O `LET` permite definir variáveis auxiliares dentro de um construtor (`COND`, `SWITCH`, `VALUE`) que só existem durante aquela operação. Isso evita poluir o código com variáveis temporárias globais.

``` ABAP
" Calcula desconto baseado na média de compras, sem criar variável para a média  
DATA(lv_discount) = COND i(   
    LET media = ( lv_compra1 + lv_compra2 ) / 2   
    IN   
    WHEN media > 1000 THEN 20  
    WHEN media > 500  THEN 10  
    ELSE 0 ).
```

### Operador VALUE (Construção de Estruturas)

Permite inicializar estruturas e tabelas internas de uma vez só.

``` ABAP
TYPES: BEGIN OF ty_user,  
         id   TYPE i,  
         name TYPE string,  
       END OF ty_user.

" Cria e preenche a estrutura em uma linha  
DATA(ls_user) = VALUE ty_user( id = 1 name = 'João' ).
```

### Funções Predicativas

O ABAP clássico exigia truques para verificar condições booleanas.

* **`xsdbool( log_exp )`**: Retorna `abap_true ('X')` ou `abap_false (' ')` baseado em uma expressão lógica.  
``` ABAP
  " Passa 'X' para o método se a idade for maior que 18  
  lo_class->set_adult_flag( xsdbool( lv_age >= 18 ) ).
```

* **`line_exists( ... )`**: Verifica se uma linha existe numa tabela interna sem precisar fazer um `READ TABLE` e checar o `sy-subrc`.  
``` ABAP
  IF line_exists( lt_users[ id = 99 ] ).  
    " Usuário existe...  
  ENDIF.
```

## 4. Exemplo Prático: Calculadora Robusta com Histórico

Este exemplo expandido utiliza `SWITCH` para a lógica, `VALUE` para manipular tabelas internas e String Templates avançados.

``` ABAP
CLASS zcl_basic_concepts DEFINITION  
  PUBLIC  
  FINAL  
  CREATE PUBLIC .

  PUBLIC SECTION.  
    INTERFACES if_oo_adt_classrun .  
      
    " Definindo tipos locais para o exemplo  
    TYPES: BEGIN OF ty_log,  
             operation TYPE string,  
             val1      TYPE i,  
             val2      TYPE i,  
             result    TYPE decfloat34,  
             timestamp TYPE timestampl,  
           END OF ty_log,  
           tt_log TYPE STANDARD TABLE OF ty_log WITH EMPTY KEY.

  PROTECTED SECTION.  
  PRIVATE SECTION.  
ENDCLASS.

CLASS zcl_basic_concepts IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.

    " 1. Setup de Variáveis  
    DATA(lv_num1) = 10.  
    DATA(lv_num2) = 5.  
    DATA(lv_operation) = 'DIV'.   
    DATA lt_history TYPE tt_log.

    " 2. Lógica com Operador SWITCH e Tratamento de Exceção Inline  
    " decfloat34 garante alta precisão para cálculos financeiros/científicos  
    DATA(lv_result) = SWITCH decfloat34( lv_operation  
                        WHEN 'SUM' THEN lv_num1 + lv_num2  
                        WHEN 'SUB' THEN lv_num1 - lv_num2  
                        WHEN 'MULT' THEN lv_num1 * lv_num2  
                        WHEN 'DIV' THEN   
                            " Condicional aninhado para evitar dump de divisão por zero  
                            COND #( WHEN lv_num2 <> 0   
                                    THEN lv_num1 / lv_num2   
                                    ELSE 0 )   
                        ELSE -1 ).

    " 3. Validação  
    IF lv_result = -1 AND lv_operation <> 'SUM' AND lv_operation <> 'SUB'.  
       out->write( |Erro Crítico: Operação '{ lv_operation }' desconhecida.| ).  
       RETURN.  
    ENDIF.

    " 4. Saída Formatada  
    " NUMBER = USER formata conforme perfil do usuário (ex: 1.000,00)  
    out->write( |Resultado da { lv_operation }: { lv_result NUMBER = USER }| ).

    " 5. Uso do Operador VALUE com BASE para adicionar à tabela  
    " Adiciona uma nova linha à tabela lt_history preservando o conteúdo existente (BASE)  
    GET TIME STAMP FIELD DATA(lv_now).  
      
    lt_history = VALUE #( BASE lt_history   
                        ( operation = lv_operation   
                          val1      = lv_num1   
                          val2      = lv_num2   
                          result    = lv_result  
                          timestamp = lv_now ) ).

    " 6. Iteração com DO e LET  
    out->write( '--- Tabuada Dinâmica ---' ).  
    DO 3 TIMES.  
        " LET define variáveis auxiliares para tornar o template mais limpo  
        out->write( |Cálculo { sy-index }: {   
            COND string( LET fator = sy-index   
                             calc  = lv_num1 * fator   
                         IN   
                         WHEN calc > 15 THEN |{ calc } (Alto)|   
                         ELSE |{ calc } (Baixo)| ) }| ).  
    ENDDO.

  ENDMETHOD.

ENDCLASS.
```

## 5. Depurando um Programa ABAP (Debugger)

Escrever código moderno não elimina bugs. Para investigar um comportamento inesperado, defina um **breakpoint** e execute o programa normalmente: quando a execução chega ao breakpoint, o ADT abre a perspectiva **Debug**.

* **Criar/remover breakpoint:** Duplo clique na margem esquerda do editor (ou botão direito → `Toggle Breakpoint`). O objeto precisa estar ativado.

* **Breakpoints são do usuário e persistentes:** Continuam ativos mesmo após sair e entrar de novo no ADT. Desative ou remova os que não usa mais.

### Navegação

| Tecla | Função | Quando usar |
| :--- | :--- | :--- |
| `F5` | Step Into | Executar uma instrução por vez, entrando em métodos chamados |
| `F6` | Step Over | Executar a linha sem entrar no método chamado |
| `F7` | Step Return | Concluir o método atual e voltar a quem chamou |
| `F8` | Resume | Seguir até o próximo breakpoint (ou até o fim) |
| `Shift+F8` | Run to Line | Executar até a linha do cursor |
| `Shift+F12` | Jump to Line | Pular linhas ou voltar, **sem** desfazer alterações em variáveis |

### Breakpoints Especiais

* **Statement Breakpoint:** Para em toda execução de uma instrução (ex.: todo `CLEAR`), onde quer que ela esteja.

* **Exception Breakpoint:** Para sempre que uma exceção específica é levantada, tratada ou não.

* **Conditional Breakpoint:** Só para quando a condição for verdadeira (ex.: `sy-index > 20` dentro de um `DO`).

* **Watchpoint:** Acompanha uma variável e para quando o valor dela muda.

Na view **Variables** você inspeciona estruturas e tabelas internas e, se tiver autorização, altera valores durante a depuração para testar hipóteses.

## Tabela Comparativa: Sintaxe Clássica vs. Moderna

| Conceito | ABAP Clássico (Legacy) | ABAP Moderno (Recomendado) |
| :---- | :---- | :---- |
| **Declaração** | `DATA: lv_val TYPE i.` | `DATA(lv_val) = 10.` |
| **Ponteiro** | `FIELD-SYMBOLS <fs> TYPE any.` | `ASSIGNING FIELD-SYMBOL(<fs>).` |
| **Concatenação** | `CONCATENATE a b INTO c.` | `DATA(c) = \|{ a } { b }\|.` |
| **Condicional** | `IF a EQ b.` | `IF a = b.` |
| **Atribuição Lógica** | Bloco `IF`/`ELSE` de várias linhas | `DATA(x) = COND #( WHEN a > b ... ).` |
| **Estrutura** | `ls_data-campo = val.` (linha a linha) | `ls_data = VALUE #( campo = val ).` |
| **Conversão Alpha** | `CALL FUNCTION 'CONVERSION_EXIT_ALPHA_INPUT'` | `DATA(lv_db_format) = \|{ lv_matnr ALPHA = IN WIDTH = 18 }\|.` (Adiciona zeros. Output: 000000000000000123) e `DATA(lv_screen_format) = \|{ lv_db_format ALPHA = OUT }\|.` (Remove zeros. Output: 123) |
| **Verificar Tabela** | `READ TABLE ... TRANSPORTING NO FIELDS` | `IF line_exists( ... )`. |

## Glossário Técnico

* **Inline Declaration (DATA(...)):** Recurso do ABAP 7.40+ que delega a definição do tipo de dados ao compilador no momento da atribuição. Melhora a fluidez da codificação, mas exige atenção ao escopo da variável, que persiste até o final do método.  
* **String Templates (|...|):** Mecanismo avançado de manipulação de strings que suporta interpolação de variáveis {var}, chamadas de métodos, expressões lógicas e formatação (data, número, alpha) diretamente no literal de texto.  
* **Constructor Operators (COND, SWITCH, VALUE):** Família de operadores funcionais que permitem construir valores, estruturas ou tabelas em uma única instrução, substituindo blocos procedurais extensos de IF/CASE/LOOP.  
* **LET Expression:** Cláusula usada dentro de operadores construtores para definir variáveis locais temporárias. Essencial para evitar cálculos repetitivos e melhorar a legibilidade de expressões complexas.  
* **xsdbool:** Função embutida que converte o resultado de uma expressão lógica (True/False do Kernel) para o tipo ABAP `abap_bool ('X' ou ' ')`, permitindo o uso de lógica booleana em parâmetros de métodos.  
* **Type Inference (Inferência de Tipo):** Capacidade do compilador de determinar automaticamente o tipo técnico (ex: `I`, `STRING`, `TYPE REF TO`) de uma nova variável baseando-se no valor ou objeto à direita da atribuição.


## Quiz de Fixação

1. Qual é a principal vantagem de usar String Templates (`|...|`) em vez de `CONCATENATE`, além da legibilidade?  
  R: String Templates oferecem opções de formatação embutidas e expressões. É possível converter formatos de data (`DATE = ISO`), números (`NUMBER = USER`), realizar conversões Alpha (`ALPHA = IN/OUT`) e até executar lógica (`COND`, chamadas de método) diretamente dentro da string, eliminando variáveis auxiliares.

2. O operador `COND` pode substituir qualquer comando IF?  
  R: Não. O `COND` é um operador construtor, projetado para retornar um valor a ser atribuído a uma variável ou passado como parâmetro. Ele substitui a lógica de IF usada para atribuição de valores. Para controle de fluxo de execução (ex: chamar métodos diferentes, sair de um loop ou encerrar o programa), o comando IF tradicional ainda é necessário.

3. Qual a função da expressão `LET` dentro de um construtor `COND` ou `VALUE`?  
  R: A expressão `LET` permite definir variáveis locais temporárias válidas apenas dentro daquele construtor. Isso é útil para armazenar resultados intermediários de cálculos ou chamadas de métodos, evitando que sejam recalculados múltiplas vezes dentro das condições `WHEN`, melhorando a performance e a clareza.

4. O que acontece com uma variável declarada inline (`DATA(...)`) dentro de um loop `DO` ou `LOOP` após o término do loop?  
  R: A variável permanece acessível. No ABAP, o escopo de uma variável inline é o bloco de processamento atual (método, função ou form). Ela não "morre" ao final do loop. Reutilizar o mesmo nome de variável em loops subsequentes pode levar a erros de tipo ou valor residual se não for gerenciado com cuidado (ex: usando `CLEAR`).

## Links de Demonstrações

- [Como Comentar e Descomentar um código ABAP](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_BE9803D7D14C7EAB:demo)
- [Como Iniciar o Debugger](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_42BD2588C06F3CA6:demo)
- [Como controlar a Execução do Código](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_645B252C3E912386:demo)
- [Como analisar os conteúdos dos objetos de dados](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_6624D135F97CCBAC:demo)
