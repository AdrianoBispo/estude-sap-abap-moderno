# Projetando Código Orientado a Objetos Eficaz

![Infográfico - Princípios para um Código ABAP OO Eficaz](./02.07_Principios_para_um_Codigo_ABAP_OO_Eficaz.png)

> **Comece pelos slides: [Projetando código orientado a objetos eficaz](./02.07_Projetando_código_orientado_a_objetos_eficaz.pptx)**
>
> Material complementar em PDF: [Dominando os Pilares do Código Flexível e Resiliente para S/4HANA, RAP e Clean Core](./02.07_De_Construtor_a_Arquiteto_ABAP_Moderno.pdf)
>
> **Referência oficial (ABAP Keyword Documentation):** [ABAP Objects](https://help.sap.com/docs/abap-cloud/abap-keywords/abap-objects)

## Objetivos de Aprendizagem

- Aplicar o princípio de **Desacoplamento** utilizando **Interfaces Globais**, compreendendo como elas atuam como contratos firmes entre diferentes partes do sistema, permitindo a substituição de componentes sem quebrar a aplicação.  

- Diferenciar estrategicamente **Composição** ("Tem um") de **Herança** ("É um"), sabendo identificar quando a herança cria um acoplamento rígido indesejado e quando a composição oferece maior flexibilidade.  

- Implementar o padrão de projeto **Factory Method** para centralizar a lógica de criação de objetos, facilitando a manutenção e permitindo a injeção de dependências dinâmica.  

- Substituir o tratamento de erro procedural antigo (baseado em sy-subrc) por **Class-Based Exceptions** (CX_*), aproveitando a hierarquia de exceções para criar um fluxo de erro robusto e rico em informações.

## 1. Interfaces: O Contrato do Código

Muitos desenvolvedores ABAP iniciam na Orientação a Objetos focando excessivamente em classes (ZCL_...) e herança, negligenciando o poder das Interfaces (ZIF_...). No entanto, em arquiteturas de software maduras, programar voltado para interfaces, e não para implementações, é um sinal de senioridade.

### Herança vs. Interface: A Batalha da Flexibilidade

* **Herança (Inheritance):** É um relacionamento rígido e estático. Segue a lógica "É um" (Is-a).  
  * *Exemplo:* "Um Cachorro **é um** Animal".  
  * *Limitação:* O ABAP suporta apenas herança simples. Uma classe só pode ter uma "mãe". Se você herda de ZCL_ANIMAL, não pode herdar de ZCL_AMIGO ao mesmo tempo. Além disso, mudanças na superclasse afetam todas as subclasses, o que pode introduzir bugs colaterais (Fragile Base Class Problem).  

* **Interface:** É um relacionamento flexível e comportamental. Segue a lógica "Faz algo" (Can-do / Behaves-as).  
  * *Exemplo:* "Um Cachorro **faz** Latido" (Implementa ZIF_LATIDOR). "Um Cachorro **é** Amigável" (Implementa ZIF_AMIGO).  
  * *Vantagem:* Uma classe pode implementar N interfaces. Isso permite que um objeto desempenhe múltiplos papéis dentro do sistema dependendo do contexto em que é utilizado.

* **Por que usar Interfaces no RAP e Clean Core?** Interfaces são a chave para o **Polimorfismo** e o **Desacoplamento**.

  1. **Intercambiabilidade:** Se seu código depende de ZIF_LOG, você pode trocar a implementação de "Log em Banco" para "Log em Arquivo" sem alterar uma única linha do código consumidor.  
  
  2. **Testabilidade:** Para criar Testes Unitários (ABAP Unit), precisamos frequentemente "fingir" o comportamento de dependências complexas (como acesso ao banco de dados). Se seu código usa interfaces, você pode facilmente injetar uma classe "Mock" ou "Stub" durante o teste. Se usar classes concretas, isso se torna muito difícil.

## 2. O Padrão Factory (Fábrica)

Um dos maiores inimigos da manutenção é o acoplamento forte criado pelo uso indiscriminado dos comandos `CREATE OBJECT` ou `NEW zcl_classe( )` espalhados por todo o código.

Quando você escreve `DATA(obj) = NEW zcl_calculadora_v1( )`, seu código fica "casado" com a versão 1 da calculadora para sempre. Se amanhã você precisar usar a `zcl_calculadora_v2` baseada em uma configuração do usuário, terá que caçar e alterar todos os lugares onde o `NEW` foi usado.

### A Solução: Factory Method

A "Fábrica" é uma classe (ou método estático) cuja única responsabilidade é decidir qual objeto criar e como criá-lo. O consumidor não sabe qual classe concreta está recebendo; ele sabe apenas que receberá alguém que obedece a uma Interface.

``` ABAP
CLASS zcl_travel_factory DEFINITION PUBLIC.  
  PUBLIC SECTION.  
    " O método retorna a INTERFACE, não a classe concreta.  
    " Isso esconde a complexidade da implementação real.  
    CLASS-METHODS: get_calculator  
      IMPORTING iv_country TYPE land1  
      RETURNING VALUE(ro_calc) TYPE REF TO zif_travel_calc.  
ENDCLASS.

CLASS zcl_travel_factory IMPLEMENTATION.  
  METHOD get_calculator.  
    " Lógica de decisão centralizada:  
    " Se precisarmos mudar a classe de cálculo para o Brasil, mudamos APENAS aqui.  
    CASE iv_country.  
      WHEN 'BR'.  
        ro_calc = NEW zcl_travel_calc_br( ).  
      WHEN 'US'.  
        ro_calc = NEW zcl_travel_calc_us( ).  
      WHEN OTHERS.  
        ro_calc = NEW zcl_travel_calc_global( ).  
    ENDCASE.  
  ENDMETHOD.  
ENDCLASS.
```

## 3. Exceções Baseadas em Classe (CX_*)

> Esta seção é uma visão geral. A definição de classes de exceção, mensagens T100 e o tratamento completo estão na lição **02.08**.

O tratamento de erros no ABAP evoluiu drasticamente. O modelo antigo usava `EXCEPTIONS error = 1` e verificava a variável de sistema `sy-subrc`.

* **Problema do Modelo Antigo:** O erro é mudo. O número 1 não diz *por que* o erro ocorreu, não carrega texto, não carrega valores de variáveis no momento do erro e não diz onde (pilha de chamadas) o erro foi originado.

No ABAP Moderno, usamos **Classes de Exceção**, que são objetos ricos em informação herdados da raiz `CX_ROOT`.

### A Hierarquia de Exceções

1. **CX_STATIC_CHECK (Checada):**  
   * **Comportamento:** O compilador *obriga* o desenvolvedor a tratar (TRY...CATCH) ou propagar (RAISING) a exceção.  
   * **Uso:** Erros de negócio previsíveis onde o programa consumidor deve ter uma chance de se recuperar (ex: "Saldo Insuficiente", "Cliente Bloqueado").  

2. **CX_DYNAMIC_CHECK (Verificada em Runtime):**  
   * **Comportamento:** O compilador não obriga o tratamento. Só em tempo de execução, se a exceção ocorrer e não for tratada nem declarada no `RAISING`, o sistema dispara `CX_SY_NO_HANDLER` (Dump se não tratada).  
   * **Uso:** Erros que podem ser evitados com verificações prévias (pré-condições). A maioria das exceções predefinidas do runtime é desse tipo (ex: "Divisão por Zero" — `CX_SY_ZERODIVIDE`, "Referência Nula" — `CX_SY_REF_IS_INITIAL`, `CX_SY_ITAB_LINE_NOT_FOUND`).  

3. **CX_NO_CHECK (Não Checada):**  
   * **Comportamento:** O tratamento é opcional e a exceção é implicitamente declarada em todas as interfaces. Se não tratada, gera um Dump.  
   * **Uso:** Erros que podem ocorrer a qualquer momento e não podem ser tratados localmente de forma útil (ex: "Falta de Memória", estados inconsistentes do sistema).

### Disparando uma Exceção Rica

Ao disparar uma exceção, podemos passar parâmetros para explicar o erro.

``` ABAP
IF iv_amount < 0.  
  " RAISE EXCEPTION cria o objeto de erro e interrompe o fluxo imediatamente  
  RAISE EXCEPTION TYPE zcx_travel_error  
    EXPORTING  
      textid    = zcx_travel_error=>negative_amount " Mensagem específica T100  
      mv_amount = iv_amount  " Passamos o valor inválido para log/análise  
      previous  = lx_prev_exception. " Encadeamento de erros (opcional)  
ENDIF.
```

## 4. Exemplo Prático: Refatoração para OO Limpo

Vamos transformar um código procedural, cheio de IFs e dependências rígidas, em um design orientado a objetos robusto utilizando o padrão **Strategy**.

* **Cenário:** Precisamos calcular o desconto de uma viagem.
  * Clientes **VIP** recebem 20% de desconto.  
  * Clientes **Standard** não recebem desconto.  
  * No futuro, novos tipos de clientes (ex: "Partner") podem surgir.

### Passo A: A Interface (O Contrato)

Primeiro, definimos *o que* precisa ser feito, ignorando *como*.

``` ABAP
INTERFACE zif_discount_strategy PUBLIC.  

  " Tipo completo: parâmetros RETURNING não aceitam tipos genéricos (como 'p' sozinho)  
  TYPES ty_amount TYPE p LENGTH 15 DECIMALS 2.  

  " Qualquer classe que queira ser uma estratégia de desconto  
  " deve saber executar este método.  
  METHODS calculate  
    IMPORTING iv_price TYPE ty_amount  
    RETURNING VALUE(rv_discount) TYPE ty_amount.  

ENDINTERFACE.
```

### Passo B: As Implementações (Polimorfismo)

Criamos classes pequenas e focadas para cada regra de negócio.

``` ABAP
" Estratégia para VIP  
CLASS zcl_discount_vip DEFINITION PUBLIC.  
  PUBLIC SECTION.  
    INTERFACES zif_discount_strategy.  
ENDCLASS.

CLASS zcl_discount_vip IMPLEMENTATION.  
  METHOD zif_discount_strategy~calculate.  
    " Regra isolada: VIP ganha 20%  
    rv_discount = iv_price * '0.2'.   
  ENDMETHOD.  
ENDCLASS.

" Estratégia para Standard  
CLASS zcl_discount_std DEFINITION PUBLIC.  
  PUBLIC SECTION.  
    INTERFACES zif_discount_strategy.  
ENDCLASS.

CLASS zcl_discount_std IMPLEMENTATION.  
  METHOD zif_discount_strategy~calculate.  
    " Regra isolada: Standard ganha 0  
    rv_discount = 0.  
  ENDMETHOD.  
ENDCLASS.
```

### Passo C: O Consumo (Injeção de Dependência e Factory Simples)

O programa principal (Consumidor) não contém a lógica de cálculo. Ele apenas orquestra. Ele não sabe se está calculando para VIP ou Standard; ele confia na Interface.

``` ABAP
CLASS zcl_main_process IMPLEMENTATION.  
  METHOD process_booking.  
    " Definimos a variável com o tipo da INTERFACE, não da classe concreta  
    DATA: lo_strategy TYPE REF TO zif_discount_strategy.

    " 1. Lógica de Criação (Poderia estar numa classe Factory separada)  
    IF iv_customer_type = 'VIP'.  
      lo_strategy = NEW zcl_discount_vip( ).  
    ELSE.  
      lo_strategy = NEW zcl_discount_std( ).  
    ENDIF.

    " 2. Execução Polimórfica  
    " O método 'calculate' se comporta de maneira diferente dependendo  
    " de qual objeto está dentro de 'lo_strategy'.  
    DATA(lv_discount) = lo_strategy->calculate( 1000 ).  
      
    out->write( |Desconto aplicado: { lv_discount }| ).  
  ENDMETHOD.  
ENDCLASS.
```

## Tabela de Decisão: Herança vs Interface

| Cenário | Usar Herança (INHERITING FROM) | Usar Interface (INTERFACES) |
| :---- | :---- | :---- |
| **Relacionamento Conceitual** | "É um" (Carro é um Veículo) | "Faz algo" / "Possui comportamento" (Carro é Dirigível) |
| **Objetivo Principal** | Reutilizar código existente da classe mãe para evitar duplicação. | Definir um contrato comum para classes distintas conversarem. |
| **Acoplamento** | **Alto/Forte**. Subclasses quebram se a mãe mudar. | **Baixo/Fraco**. A implementação pode mudar livremente desde que respeite o contrato. |
| **Multiplicidade** | **Não**. ABAP só permite 1 superclasse. | **Sim**. Uma classe pode implementar N interfaces. |

## Glossário Técnico Expandido

* **Interface (ZIF):** Um artefato de desenvolvimento que contém apenas assinaturas de métodos (definições), sem implementação. Serve como um contrato que obriga as classes implementadoras a fornecerem a lógica real. Permite o desacoplamento entre quem chama (consumidor) e quem executa (provedor).  

* **Polymorphism (Polimorfismo):** Capacidade de objetos de classes diferentes (ex: zcl_discount_vip e zcl_discount_std) responderem à mesma mensagem (chamada de método definida na Interface) de maneiras diferentes. É o pilar da flexibilidade em OO.  

* **Factory Pattern:** Padrão de criação onde a instância exata de um objeto é decidida em tempo de execução por uma classe "fábrica", em vez de ser fixada no código do consumidor. Facilita a manutenção e a introdução de novas variantes sem alterar o código existente.  

* **Exception Class (CX):** Classes usadas para gerenciar erros no ABAP Moderno. Elas transportam o contexto do erro (TextID, atributos, call stack) do ponto de falha até o manipulador (CATCH).  

* **Separation of Concerns (Separação de Preocupações):** Princípio de design onde cada classe ou módulo deve ter uma responsabilidade única e clara. No exemplo, a classe VIP só sabe calcular desconto VIP; ela não sabe sobre banco de dados ou impressão.

## Quiz de Fixação

1. Qual é a principal vantagem de usar RAISE EXCEPTION TYPE zcx... em vez de MESSAGE 'Erro' TYPE 'E' dentro de uma classe de negócio?  
  R: A exceção baseada em classe é um objeto que pode ser capturado (TRY...CATCH) e tratado programaticamente nas camadas superiores da aplicação. Uma mensagem do tipo 'E' (Error) geralmente interrompe o processamento abruptamente ou é difícil de capturar de forma estruturada, comportando-se mais como uma interface de usuário do que como um controle de fluxo. Além disso, a exceção CX carrega atributos detalhados sobre o erro.  

2. Por que dizemos que "Programar para Interfaces" facilita a criação de Testes Unitários?  
  R: Porque permite a Injeção de Dependência. Se o seu código depende de uma Interface ZIF_CLIENTE_DAO em vez da classe concreta ZCL_CLIENTE_DAO, você pode, durante o teste, injetar uma classe falsa (Mock) que implementa a mesma interface, mas retorna dados fixos de memória, isolando o teste do banco de dados real.  

3. Em que situação devo usar uma exceção que herda de CX_NO_CHECK?  
  R: Exceções CX_NO_CHECK devem ser usadas para erros técnicos graves que podem ocorrer a qualquer momento e onde não se espera que o programa consumidor consiga se recuperar ou tratar o erro localmente (ex: falta de memória, estados inconsistentes do sistema). Erros evitáveis por pré-condições (como divisão por zero) pertencem a CX_DYNAMIC_CHECK. Elas não obrigam o uso de TRY...CATCH e geralmente resultam em um Dump informativo se não tratadas no topo da pilha.
