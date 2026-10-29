# Definindo e Trabalhando com Classes de Exceção

![Infográfico - Guia Rápido: Exceções Modernas em ABAP OO](./02.08_Guia_Rapido_Excecoes_Modernas_em_ABAP_OO.png)

> **Comece pelos slides: [Definindo e usando classes de exceção](./02.08_Definindo_e_usando_classes_de_exceção.pptx)**
>
> Material complementar em PDF: [Tratamento Avançado de Exceções ABAP OO](./02.08_Tratamento_Avançado_de_Exceções_ABAP_OO.pdf)
>
> **Referência oficial (ABAP Keyword Documentation):** [Class-Based Exceptions](https://help.sap.com/docs/abap-cloud/abap-keywords/class-based-exceptions)

## Objetivos de Aprendizagem

- Projetar e implementar uma **Classe de Exceção Global** customizada, integrando-a com a interface de mensagens **T100** para suporte a tradução e parâmetros dinâmicos.  

- Distinguir com precisão arquitetural as três categorias de exceção: **Static Check** (Obrigatória), **Dynamic Check** (Híbrida) e **No Check** (Técnica), aplicando cada uma no cenário de negócio correto.  

- Utilizar o comando **RAISE EXCEPTION** de forma avançada, passando parâmetros de mensagem, atributos de erro e encadeando exceções anteriores (PREVIOUS).  

- Construir blocos robustos de tratamento de erro com **TRY...CATCH**, utilizando hierarquia de classes (CX_ROOT) e garantindo a liberação segura de recursos com o bloco **CLEANUP**.

## 1. Categorias de Exceção: Quem deve tratar?

No ABAP OO, nem todo erro é igual. Ao criar uma classe de exceção (ZCX_...), a escolha da superclasse define o "contrato de tratamento" entre quem lança o erro e quem consome o método.

* **CX_STATIC_CHECK (Verificação Estática - Checked Exception):**  
  * **Definição:** O compilador verifica em tempo de design se a exceção está sendo tratada.  
  * **Uso Ideal:** Erros de negócio previsíveis e recuperáveis. Ex: "Cliente Bloqueado", "Saldo Insuficiente", "Arquivo não encontrado". O consumidor do método *deve* saber que isso pode acontecer e preparar uma contingência.  
  * **Regra:** Se um método lança essa exceção, você é **obrigado** a envolver a chamada num TRY...CATCH ou propagar o erro adicionando RAISING na assinatura do seu método. Se esquecer, o código não ativa.  

* **CX_NO_CHECK (Sem Verificação - Unchecked Exception):**  
  * **Definição:** O compilador ignora a verificação. O erro pode ocorrer a qualquer momento e subir a pilha até derrubar o programa (Dump).  
  * **Uso Ideal:** Erros técnicos graves que podem ocorrer a qualquer momento e onde a recuperação é improvável ou impossível no ponto da chamada. Ex: "Memória Cheia", estados inconsistentes do sistema.  
  * **Regra:** O tratamento é opcional. Geralmente, deixamos esses erros subirem até uma camada global de tratamento de exceções (Global Exception Handler) para logar e abortar graciosamente.  

* **CX_DYNAMIC_CHECK (Verificação Dinâmica):**  
  * **Definição:** Híbrido. O compilador não obriga o tratamento; a verificação ocorre em runtime: se a exceção for disparada e não for tratada nem declarada no `RAISING` do procedimento, o sistema dispara `CX_SY_NO_HANDLER` (Dump se não tratada).  
  * **Uso:** Erros que podem ser evitados com verificações prévias (pré-condições). A maioria das exceções predefinidas do runtime é desse tipo: `CX_SY_ZERODIVIDE` (Divisão por Zero), `CX_SY_REF_IS_INITIAL` (Referência Nula), `CX_SY_CONVERSION_NO_NUMBER`, `CX_SY_ITAB_LINE_NOT_FOUND`.

## 2. Mensagens T100: Falando a língua do usuário

Uma exceção vazia (CX_ERRO_GENERICO) não ajuda ninguém. O usuário precisa saber *o que* aconteceu. No passado, usávamos textos hardcoded ("Erro ao salvar"), o que impedia a tradução.

No ABAP moderno, a melhor prática é vincular a exceção a uma **Message Class (Transação SE91)** usando a interface IF_T100_MESSAGE.

* **Vantagens:**
  1. **Tradução:** As mensagens da SE91 são traduzíveis via SE63. O sistema exibe o erro no idioma de logon do usuário automaticamente.  
  2. **Parâmetros:** Suporte a placeholders (&1, &2, &3, &4) que são substituídos por atributos da classe de exceção em tempo de execução (ex: "Viagem &1 não encontrada").  
  3. **Busca:** Facilita encontrar onde a mensagem é usada (Where-Used List).

## 3. Exemplo Prático: Criando e Disparando

Vamos criar uma exceção de negócio rica para o cenário de "Saldo Insuficiente".

### Passo A: Definição da Classe (ADT)

Criamos a classe `ZCX_NO_FUNDS` herdando de `CX_STATIC_CHECK`. No ADT, ao adicionar a interface `IF_T100_MESSAGE`, ele gera um ID de texto especial.

``` ABAP
CLASS zcx_no_funds DEFINITION  
  PUBLIC  
  INHERITING FROM cx_static_check  
  FINAL  
  CREATE PUBLIC .

  PUBLIC SECTION.  
    INTERFACES if_t100_message .  
    INTERFACES if_t100_dyn_msg . " Permite usar a sintaxe MESSAGE ... RAISE

    " Atributo público para guardar o valor que causou o erro.  
    " Isso permite que quem capturou o erro (CATCH) leia o valor para exibir ou logar.  
    DATA mv_amount TYPE p LENGTH 15 DECIMALS 2 .

    " Definição da Chave da Mensagem (Constante estruturada)  
    " Mapeia a mensagem 001 da classe ZFINANCE_MSG para os atributos da classe  
    CONSTANTS:  
      BEGIN OF funds_error,  
        msgid TYPE symsgid VALUE 'ZFINANCE_MSG',  
        msgno TYPE symsgno VALUE '001', " Texto na SE91: Saldo insuficiente. Valor: &1  
        attr1 TYPE scx_attrname VALUE 'MV_AMOUNT', " &1 será substituído por MV_AMOUNT  
        attr2 TYPE scx_attrname VALUE '',  
        attr3 TYPE scx_attrname VALUE '',  
        attr4 TYPE scx_attrname VALUE '',  
      END OF funds_error .

    METHODS constructor  
      IMPORTING  
        !textid   LIKE if_t100_message=>t100key OPTIONAL  
        !previous LIKE previous OPTIONAL  
        !amount   TYPE p OPTIONAL .  
ENDCLASS.

CLASS zcx_no_funds IMPLEMENTATION.  
  METHOD constructor.  
    " Chama o construtor da superclasse (vital para gerenciar a pilha de erros)  
    super->constructor( previous = previous ).  
      
    " Salva o valor recebido no atributo da instância  
    me->mv_amount = amount.  
      
    " Lógica para definir qual mensagem exibir  
    CLEAR me->textid.  
    IF textid IS INITIAL.  
      if_t100_message~t100key = if_t100_message=>default_textid.  
    ELSE.  
      if_t100_message~t100key = textid.  
    ENDIF.  
  ENDMETHOD.  
ENDCLASS.
```

### Passo B: Disparando a Exceção (Raise)

Dentro da classe de negócio, verificamos a condição e, se falhar, lançamos a bomba.

``` ABAP
METHOD debit_account.  
  IF iv_amount > mv_balance.  
    " Dispara a exceção preenchendo a variável mv_amount e escolhendo a mensagem específica  
    RAISE EXCEPTION TYPE zcx_no_funds  
      EXPORTING  
        textid = zcx_no_funds=>funds_error " Usa a constante definida na classe  
        amount = iv_amount.                " Passa o valor que falhou  
  ENDIF.  
    
  " Se não falhou, prossegue...  
  mv_balance = mv_balance - iv_amount.  
ENDMETHOD.
```

### Passo C: Tratando a Exceção (Try/Catch)

O consumidor do método deve estar preparado para lidar com o erro.

``` ABAP
TRY.  
    lo_account->debit_account( 500 ).

  CATCH zcx_no_funds INTO DATA(lx_error).  
    " lx_error agora é uma instância do objeto de erro.  
      
    " 1. Obtém o texto formatado e traduzido  
    DATA(lv_msg) = lx_error->get_text( ).  
    out->write( |Erro de Negócio: { lv_msg }| ).  
      
    " 2. Acessa os atributos internos para lógica de recuperação  
    " Ex: Se o valor for baixo, tenta tirar do cheque especial  
    out->write( |Valor da tentativa: { lx_error->mv_amount }| ).

  CATCH cx_root INTO DATA(lx_generic).  
    " Polimorfismo: Captura qualquer outro erro não previsto (técnico)  
    out->write( 'Erro técnico grave e desconhecido.' ).

  CLEANUP.  
    " O bloco CLEANUP é executado sempre que uma exceção ocorre e SAI deste bloco TRY  
    " mas NÃO é capturada pelos CATCHs locais (ou seja, está subindo a pilha).  
    " Ideal para fechar conexões, limpar memória ou reverter estados globais.  
    out->write( 'Limpando recursos críticos antes de abortar...' ).  
ENDTRY.
```

*Observação:* como o `CATCH cx_root` acima captura qualquer exceção, neste exemplo específico o bloco `CLEANUP` nunca seria executado. Ele só faz sentido quando alguma exceção pode escapar deste `TRY` (ou seja, quando não há um `CATCH` que a capture localmente).

## 4. A Interface Moderna `IF_T100_DYN_MSG`

No ABAP 7.50+, a SAP introduziu uma interface ainda mais flexível. Ela permite disparar exceções usando a sintaxe clássica de MESSAGE (que os desenvolvedores amam pela simplicidade) convertida automaticamente em Objeto de Exceção.

**Sintaxe de Disparo Simplificada:**

``` ABAP
" Dispara exceção baseada na mensagem de sistema atual ou valores literais  
" O sistema cria a instância da exceção ZCX_GENERIC_ERROR e preenche a T100 automaticamente  
RAISE EXCEPTION TYPE zcx_generic_error  
  MESSAGE ID 'ZMSG'   
  TYPE 'E'   
  NUMBER '001'   
  WITH 'Parametro1' 'Parametro2'.
```

## Comparativo: Tipos de Checagem

| Tipo (CX_...) | Classificação | Obrigatório Tratar? | Exemplo de Uso |
| :---- | :---- | :---- | :---- |
| **STATIC_CHECK** | Checada (Checked) | **Sim** (O compilador cobra na ativação). | Regras de Negócio (Cliente não existe, Saldo baixo). O consumidor deve saber lidar. |
| **NO_CHECK** | Não Checada (Unchecked) | **Não** (O compilador ignora). | Erros Técnicos graves (ex: falta de memória). Geralmente não recuperáveis localmente. |
| **DYNAMIC_CHECK** | Híbrida | Não (Mas a declaração no `RAISING` é verificada em runtime). | Erros evitáveis por pré-condições (Divisão por zero, Referência nula, Linha não encontrada). |

## Glossário Técnico

* **Exception Class (Classe de Exceção):** Uma classe ABAP global ou local que herda direta ou indiretamente de CX_ROOT. Ela encapsula o estado de um erro (mensagem, variáveis, pilha de chamadas) e o transporta do ponto de falha até o manipulador.  

* **RAISE EXCEPTION:** Comando ABAP usado para interromper o fluxo normal de processamento e sinalizar que um erro ocorreu, instanciando uma classe de exceção.  

* **TRY...CATCH:** Bloco de controle estruturado usado para capturar e tratar exceções. O código "perigoso" fica no bloco TRY, e a lógica de recuperação fica nos blocos CATCH.  

* **CLEANUP:** Bloco opcional dentro da estrutura TRY que é executado quando uma exceção ocorre e o fluxo está saindo do bloco atual para um manipulador superior. É usado para restaurar a consistência do sistema (ex: fechar arquivos, liberar bloqueios).  

* **IF_T100_MESSAGE:** Interface padrão que permite vincular uma classe de exceção a mensagens armazenadas na tabela T100 (transação `SE91`), habilitando suporte nativo a tradução e substituição de parâmetros dinâmicos (&1).  

* **PREVIOUS (Inner Exception):** Atributo presente em todas as exceções que permite o "Encadeamento de Exceções". Se você capturar um erro técnico (CX_SQL_ERROR) e quiser relançá-lo como um erro de negócio (ZCX_ORDER_ERROR), você passa o erro original no parâmetro PREVIOUS para não perder o rastro da causa raiz.

## Quiz de Fixação

1. Qual é a consequência imediata no momento da compilação se eu chamar um método que levanta uma exceção CX_STATIC_CHECK e não colocar um bloco TRY...CATCH ou adicionar RAISING na minha assinatura?  
  R: O código não será ativado e gerará um erro de sintaxe. O compilador ABAP impõe estritamente que exceções estáticas sejam tratadas ou propagadas explicitamente, garantindo a robustez do contrato da interface.  

2. Para que serve a interface `IF_T100_MESSAGE` em uma classe de exceção e qual problema ela resolve em relação ao uso de textos fixos?  
  R: Ela permite associar a exceção a uma Mensagem Standard (Tabela T100 / `SE91`). Isso resolve o problema da internacionalização, pois o texto da mensagem é recuperado no idioma de logon do usuário, e permite a substituição dinâmica de parâmetros (`&1`, `&2`) no texto do erro de forma estruturada.  

3. Em um bloco `TRY...CATCH`, qual é a diferença de comportamento entre o bloco CATCH e o bloco CLEANUP?  
  R: O bloco CATCH captura a exceção, "engole" o erro (a menos que seja relançado) e permite que o programa continue. O bloco CLEANUP é executado apenas quando a exceção NÃO é capturada localmente (está subindo para o chamador), servindo exclusivamente para limpar recursos (housekeeping) antes que o controle seja perdido.
