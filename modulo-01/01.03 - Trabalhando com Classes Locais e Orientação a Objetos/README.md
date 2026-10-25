# Trabalhando com Classes Locais e Orientação a Objetos

![Infográfico - Classes Locais](./01.03_Classes_Locais.png)

> **Comece pelos slides: [Trabalhando com Classes Locais e Orientação a Objetos no ABAP](./01.03_Trabalhando_com_Classes_Locais_OO_no_ABAP.pdf)**

## Objetivos de Aprendizagem

- Distinguir claramente entre **Classes Globais** e **Classes Locais**, compreendendo os casos de uso ideais para cada uma.  
- Dominar a anatomia de uma classe: separar a **Definição** (Interface/Contrato) da **Implementação** (Lógica/Código).  
- Aplicar estrategicamente as seções de visibilidade (`PUBLIC`, `PROTECTED`, `PRIVATE`) para garantir o encapsulamento e segurança do código.  
- Utilizar a sintaxe moderna de instanciação com o operador `NEW`, incluindo a passagem de parâmetros para o construtor.  
- Entender a diferença entre membros de **Instância** e membros **Estáticos**.

## 1. Classes Globais vs. Classes Locais: Onde codificar?

No ecossistema ABAP, a Orientação a Objetos (OO) é a espinha dorsal do desenvolvimento moderno (RAP). Embora a sintaxe seja idêntica, o escopo de uso difere:

* **Classes Globais (Global Classes - Prefixo ZCL_):**  
  * **Definição:** Criadas através do ABAP Development Tools (ADT/Eclipse) ou `SE24`. São objetos de repositório independentes.  
  * **Visibilidade:** Visíveis por todo o sistema SAP. Qualquer programa, função ou outra classe pode instanciá-las.  
  * **Uso:** Lógica de negócio reutilizável, APIs públicas, Entidades de Negócio.  
* **Classes Locais (Local Classes - Prefixo LCL_):**  
  * **Definição:** Definidas *dentro* de um artefato maior (como um Programa Executável, uma Function Group ou, o mais comum, dentro da aba "Local Types" de uma Classe Global).  
  * **Visibilidade:** Restrita. Elas só existem dentro do artefato que as contém. Uma classe local definida dentro da classe ZCL_A não pode ser vista pela classe ZCL_B.  
  * **Uso:**  
    * **Classes Auxiliares (Helpers):** Para quebrar uma lógica complexa interna sem poluir o repositório global com classes que só servem para uma tarefa específica.  
    * **Testes Unitários (ABAP Unit):** Este é o uso mais crítico. Todos os testes unitários são escritos como classes locais (FOR TESTING) que exercitam e verificam o comportamento da classe principal.

## 2. A Anatomia de uma Classe: Contrato vs. Ação

Uma classe ABAP não é um bloco monolítico. Ela é dividida em duas partes obrigatórias que funcionam como uma promessa e seu cumprimento.

### A. DEFINITION (A Promessa / Contrato)

Aqui descrevemos a "interface" da classe. Definimos os tipos de dados, as constantes e as assinaturas dos métodos (parâmetros de entrada e saída). Nenhuma linha de lógica executável (como `IF`, `LOOP`) entra aqui.

``` ABAP
CLASS lcl_exemplo DEFINITION.  
  PUBLIC SECTION.  
    DATA: mv_nome TYPE string.      " Atributo de Instância  
    CLASS-DATA: gv_contador TYPE i. " Atributo Estático (Compartilhado)  
      
    METHODS: constructor IMPORTING iv_nome TYPE string. " Método Especial  
    METHODS: executar.  
ENDCLASS.
```

### B. `IMPLEMENTATION` (A Ação / Lógica)

Aqui escrevemos o código ABAP real. Cada método declarado na `DEFINITION` deve ter sua correspondente implementação aqui.

``` ABAP
CLASS lcl_exemplo IMPLEMENTATION.  
  METHOD constructor.  
    mv_nome = iv_nome.  
    gv_contador = gv_contador + 1. " Incrementa contador global da classe  
  ENDMETHOD.

  METHOD executar.  
    " Lógica de negócio...  
  ENDMETHOD.  
ENDCLASS.
```

### Seções de Visibilidade (Encapsulamento)

O encapsulamento é vital para manutenção. Se tudo for público, qualquer desenvolvedor pode alterar variáveis internas da sua classe, causando bugs inesperados.

1. **PUBLIC SECTION:** A vitrine da loja. Métodos e atributos que o mundo externo precisa acessar. Define a API estável da classe.
  
2. **PROTECTED SECTION:** A área da família. Acessível pela própria classe e por suas classes filhas (herança). Usado para permitir que subclasses reutilizem lógica interna sem expô-la ao mundo.
  
3. `PRIVATE SECTION`: O cofre. Acessível *apenas* pela própria classe. É onde escondemos a complexidade. Se você mudar a lógica de um método privado, tem a garantia de que nenhum código externo quebrará, pois ninguém de fora consegue chamá-lo.

## 3. Instanciação Moderna: O Operador `NEW`

A criação de objetos evoluiu para tornar o código mais fluído e legível.

### Sintaxe Antiga vs. Moderna

* **Antigo (`CREATE OBJECT`):** Exigia a declaração prévia da variável com o tipo exato, ocupando várias linhas.  
``` ABAP
  DATA: lo_cliente TYPE REF TO lcl_cliente.  
  CREATE OBJECT lo_cliente  
    EXPORTING  
      iv_id = '100'.
```

* **Moderno (`NEW`):** Permite instanciação inline. O tipo é inferido (`#`) ou explícito.  
``` ABAP
  " Tipo explícito + declaração inline  
  DATA(lo_cliente) = NEW lcl_cliente( iv_id = '100' ).

  " Inferência de tipo (#): só funciona se a variável já estiver tipada  
  DATA lo_outro TYPE REF TO lcl_cliente.  
  lo_outro = NEW #( iv_id = '200' ).

  " Uso direto em chamadas de método (sem variável auxiliar!)  
  lo_fatura->processar( io_cliente = NEW lcl_cliente( '100' ) ).
```

### O Método CONSTRUCTOR

Ao usar `NEW`, o método especial constructor da classe é chamado automaticamente.

* Ele é usado para **inicializar** o objeto (ex: carregar dados obrigatórios).  
* Se o construtor tiver parâmetros `IMPORTING`, eles devem ser passados dentro dos parênteses do `NEW ... ( )`.

## 4. Exemplo Prático Expandido: Calculadora de IMC com Estado

Neste exemplo avançado, criamos uma classe local que possui um **Construtor** para configurar a unidade de medida (Métrica ou Imperial) e mantemos o estado interno.

``` ABAP
" -----------------------------------------------------------------------  
" 1. DEFINIÇÃO DA CLASSE LOCAL  
" -----------------------------------------------------------------------  
CLASS lcl_bmi_service DEFINITION.  
  PUBLIC SECTION.  
    " Enumeração simples para tipos de unidade  
    CONSTANTS:  
      BEGIN OF co_unit,  
        metric   TYPE c LENGTH 1 VALUE 'M', " Metros/Kg  
        imperial TYPE c LENGTH 1 VALUE 'I', " Polegadas/Libras  
      END OF co_unit.

    TYPES: ty_bmi     TYPE p LENGTH 8 DECIMALS 2,
           " Tipo completo para os parâmetros: parâmetros RETURNING não aceitam
           " tipos genéricos (como 'p' sozinho) e literais só são convertidos
           " automaticamente para parâmetros com tipo completo.
           ty_measure TYPE p LENGTH 8 DECIMALS 2.

    " O Construtor define o estado inicial do objeto  
    METHODS: constructor  
      IMPORTING iv_unit_type TYPE c DEFAULT co_unit-metric.

    METHODS: calculate_bmi  
      IMPORTING  
        iv_weight     TYPE ty_measure  
        iv_height     TYPE ty_measure  
      RETURNING  
        VALUE(rv_bmi) TYPE ty_bmi.

  PRIVATE SECTION.  
    " Atributo privado para guardar a configuração da unidade  
    DATA: mv_unit_type TYPE c LENGTH 1.

    " Método auxiliar privado (Encapsulamento)  
    METHODS: convert_to_metric  
      IMPORTING iv_val        TYPE ty_measure  
                iv_type       TYPE c  
      RETURNING VALUE(rv_val) TYPE ty_measure.  
ENDCLASS.

" -----------------------------------------------------------------------  
" 2. IMPLEMENTAÇÃO DA CLASSE LOCAL  
" -----------------------------------------------------------------------  
CLASS lcl_bmi_service IMPLEMENTATION.

  METHOD constructor.  
    " Guarda a preferência de unidade na instância  
    mv_unit_type = iv_unit_type.  
  ENDMETHOD.

  METHOD calculate_bmi.  
    DATA: lv_weight_kg TYPE p DECIMALS 2,  
          lv_height_m  TYPE p DECIMALS 2.

    " Normaliza os dados baseando-se na configuração do objeto  
    IF mv_unit_type = co_unit-metric.  
      lv_weight_kg = iv_weight.  
      lv_height_m  = iv_height.  
    ELSE.  
      " Conversão simplificada para Imperial  
      lv_weight_kg = iv_weight * '0.4536'. " Libras para Kg  
      lv_height_m  = iv_height * '0.0254'. " Polegadas para Metros  
    ENDIF.

    " Proteção contra divisão por zero  
    IF lv_height_m <= 0.  
      rv_bmi = 0.  
      RETURN.  
    ENDIF.

    " Cálculo final (Sempre em métrico internamente)  
    rv_bmi = lv_weight_kg / ( lv_height_m * lv_height_m ).  
  ENDMETHOD.

  METHOD convert_to_metric.  
    " Implementação futura se necessário...  
    rv_val = iv_val.  
  ENDMETHOD.

ENDCLASS.

" -----------------------------------------------------------------------  
" 3. CLASSE GLOBAL (Consumidor)  
" -----------------------------------------------------------------------  
CLASS zcl_health_app DEFINITION  
  PUBLIC  
  FINAL  
  CREATE PUBLIC .

  PUBLIC SECTION.  
    INTERFACES if_oo_adt_classrun .  
ENDCLASS.

CLASS zcl_health_app IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.  
      
    " A. Instanciando configurado para sistema MÉTRICO (Padrão)  
    DATA(lo_metric_calc) = NEW lcl_bmi_service( ).   
      
    DATA(lv_bmi_br) = lo_metric_calc->calculate_bmi(   
        iv_weight = 80     " 80kg  
        iv_height = '1.80' " 1.80m  
    ).  
    out->write( |IMC (Brasil): { lv_bmi_br }| ).

    " B. Instanciando configurado para sistema IMPERIAL  
    " Passamos o parâmetro para o CONSTRUTOR aqui  
    DATA(lo_usa_calc) = NEW lcl_bmi_service(   
        iv_unit_type = lcl_bmi_service=>co_unit-imperial   
    ).

    DATA(lv_bmi_us) = lo_usa_calc->calculate_bmi(   
        iv_weight = 176  " ~80kg em libras  
        iv_height = 70   " ~1.78m em polegadas  
    ).  
    out->write( |IMC (USA): { lv_bmi_us }| ).

  ENDMETHOD.

ENDCLASS.
```

## Tabela Comparativa: Visibilidade

| Seção | Acesso Interno | Acesso por Subclasses | Acesso Externo (Público) | Objetivo Principal |
| :---- | :---- | :---- | :---- | :---- |
| **PUBLIC** | ✅ | ✅ | ✅ | Definir a API de uso da classe. |
| **PROTECTED** | ✅ | ✅ | ❌ | Permitir extensão via herança. |
| **PRIVATE** | ✅ | ❌ | ❌ | Ocultar lógica interna (Segurança). |

## Glossário Técnico

* **Instance (Instância):** A concretização de uma classe na memória. Enquanto a classe é o projeto (blueprint), a instância é o objeto real com seus próprios dados. Múltiplas instâncias da mesma classe podem coexistir com dados diferentes.  
* **Constructor (Construtor):** Método especial (constructor) executado automaticamente no momento da criação do objeto (NEW). Usado para configurar o estado inicial e validar dependências obrigatórias.  
* **Static vs. Instance Members:**  
  * **Instance:** Pertence ao objeto individual (ex: Nome do Cliente). Cada objeto tem o seu.  
  * **Static (CLASS-DATA, CLASS-METHODS):** Pertence à classe inteira. Compartilhado por todas as instâncias (ex: Contador de quantos objetos foram criados).  
* **Encapsulation (Encapsulamento):** Pilar da OO que visa ocultar os detalhes de implementação (Private) e expor apenas uma interface segura (Public), protegendo a integridade dos dados internos.  
* **Method Signature:** A definição completa da interface de um método, incluindo seu nome e todos os parâmetros de entrada, saída e exceções.

## Quiz de Fixação

1. Qual a diferença fundamental entre a `DEFINITION` e a `IMPLEMENTATION` de uma classe?  
  R: A `DEFINITION` descreve o contrato da classe (quais métodos e atributos ela possui e sua visibilidade), servindo como um manual de uso. A `IMPLEMENTATION` contém o código ABAP real (a lógica) que dita como esses métodos funcionam internamente.
  
2. O que acontece se eu tentar acessar um atributo definido na `PRIVATE SECTION` a partir de um programa externo?  
  R: Ocorrerá um erro de sintaxe. O compilador ABAP impede o acesso direto a membros privados de fora da própria classe, garantindo o encapsulamento.
 
3. Para que serve o método constructor e quando ele é chamado?  
  R: Ele serve para inicializar o objeto, definindo valores padrão ou recebendo configurações iniciais. Ele é chamado automaticamente pelo sistema no momento em que o comando `NEW` (ou `CREATE OBJECT`) é executado.

4. Se eu alterar um atributo estático (`CLASS-DATA`) em uma instância da classe, o que acontece com as outras instâncias?  
  R: O valor muda para todas as instâncias. Atributos estáticos são compartilhados globalmente por todos os objetos daquela classe, pois residem na memória da classe, não na memória do objeto individual.

## Links de Demonstrações

- [Como Criar uma Classe Local Dentro de uma Classe Global](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_101F7AF901D991BF:demo)
- [Como criar instâncias de uma Classe ABAP](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_EA37F7B8BEAF78A0:demo)
- [Como Gerenciar Instâncias dentro de uma Tabela Interna](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_68826944F2FA597:demo)
- [Como Definir Métodos](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_D41C6BBE46D32482:demo)
- [Como Implementar Métodos](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_6BF8538B5A617BA1:demo)
- [Como Chamar Métodos](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_2DEC8B2FBF8684A2:demo)
- [Como Usar Atributos Privados](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_2EF94ED3881D7EAE:demo)
- [Como Definir um Construtor de Instância](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_AA201DE9A603868E:demo)
- [Como Depurar a Execução de Construtores](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_5189FB6B111ACAAE:demo)
