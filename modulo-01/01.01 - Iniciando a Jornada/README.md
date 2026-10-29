# Iniciando a Jornada

![Infográfico - A Evolução do ABAP](./01.01_A_Evolucao_do_ABAP.png)

> **Comece pelos slides: [Iniciando a Jornada: O Paradigma do ABAP Moderno](./01.01_ABAP_Cloud_Clean_Core_E_ADT.pdf)**
>
> **Referência oficial (ABAP Keyword Documentation):** [ABAP Language Versions](https://help.sap.com/docs/abap-cloud/abap-keywords/abap-language-versions)

## Objetivos de Aprendizagem

- Compreender a mudança de paradigma do _ABAP Clássico_ para o _ABAP Cloud_ e suas implicações na arquitetura de sistemas.  

- Identificar e configurar o ambiente de desenvolvimento moderno: _ABAP Development Tools (ADT)_ no _Eclipse_, entendendo suas vantagens sobre a `SE80`.  

- Entender a hierarquia de organização de software: _Componentes de Software, Pacotes e o papel do **abapGit**_.  

- Criar, ativar e executar a primeira aplicação ABAP ("Hello World") utilizando uma _Classe Global_ e a _Interface de Console_, abandonando o conceito de _Reports_ tradicionais.

- Conhecer o **Joule for Developers** (ABAP AI Capabilities) e usá-lo com senso crítico para explicar código, sugerir trechos e acelerar tarefas repetitivas.

## 1. Introdução ao Ambiente de Desenvolvimento Moderno

No ecossistema de desenvolvimento SAP tradicional, a transação **`SE80` (Object Navigator)** dentro do SAP GUI reinou soberana por décadas. No entanto, com a evolução para o **SAP BTP (Business Technology Platform)** e o **SAP S/4HANA Cloud**, o desenvolvimento mudou para uma abordagem mais aberta e padronizada pela indústria.

A ferramenta padrão agora é o **ADT (ABAP Development Tools)**, um conjunto de plugins oficiais da SAP instalados sobre a plataforma Eclipse.

### Por que abandonar o SAP GUI e adotar o ADT?

A transição para o Eclipse não é apenas estética; é funcional e necessária para o modelo de nuvem.

* **Velocidade e Refatoração:** O ADT oferece ferramentas de refatoração poderosas que não existem no SAP GUI. Você pode renomear métodos em todo o sistema, extrair constantes ou variáveis locais com um clique e formatar código automaticamente ("Pretty Printer" avançado).  

* **Suporte Exclusivo a Funcionalidades Cloud:** O desenvolvimento de **Core Data Services (CDS Views)**, **Behavior Definitions (RAP)** e a nova sintaxe de Service Binding são suportados **apenas** no ADT. Não é possível editar esses objetos via SAP GUI.  

* **Múltiplas Conexões e Projetos:** Diferente do SAP GUI, onde você está logado em um mandante por vez por janela, o ADT permite visualizar e comparar códigos de diferentes sistemas (ex: Desenvolvimento vs. Qualidade) lado a lado na mesma interface.  

* **Integração com Ferramentas Modernas:** O ADT integra-se nativamente com o **abapGit** (para versionamento de código descentralizado) e pipelines de CI/CD (Integração e Entrega Contínuas), fundamentais para práticas de DevOps.

## 2. O Conceito de ABAP Cloud e Clean Core

Antes de escrever qualquer linha de código, é crucial entender a filosofia por trás do **ABAP Cloud**. Este não é apenas "ABAP na Nuvem", mas sim um modelo de governança e restrição de linguagem.

### O Problema do Legado ("Spaghetti Code")

No ABAP Clássico, os desenvolvedores tinham "superpoderes" perigosos. Podiam ler qualquer tabela (mesmo as de configuração interna do SAP), modificar o comportamento padrão via modificações de núcleo e acessar o sistema operacional.

* **Consequência:** Quando a SAP lançava uma atualização (Upgrade), esses códigos personalizados quebravam, pois dependiam de estruturas internas que mudavam. Isso tornava os projetos de upgrade caros e demorados (o famoso "inferno da SPDD/SPAU").

### A Solução: Clean Core (Núcleo Limpo)

O **Clean Core** é a estratégia para garantir que o sistema ERP possa ser atualizado automaticamente (como seu smartphone atualiza o Android/iOS) sem quebrar as customizações. Para isso, o **ABAP Cloud** impõe restrições técnicas rigorosas:

1. **Language Version 5 (ABAP for Cloud Development):** O compilador bloqueia comandos obsoletos ou perigosos. Você não pode usar `CALL SCREEN` (Dynpros), `WRITE` (Listas clássicas), ou acesso direto a arquivos do servidor.  

2. **Released Objects (Objetos Liberados):** Esta é a "Regra de Ouro". Você só pode referenciar objetos SAP que foram explicitamente marcados como **APIs Públicas (Whitelisted)**.  
   * *Exemplo:* No clássico, líamos a tabela MARA para dados de material. No Cloud, isso gera erro de sintaxe. Devemos usar a CDS View pública I_Product, que é a "interface contrato" estável que a SAP garante que não mudará.  

3. **Acesso a Dados:** O acesso direto às tabelas SAP é restrito. Toda leitura de dados standard deve passar por CDS Views liberadas (suas próprias tabelas Z podem ser lidas normalmente), garantindo que as verificações de segurança e a lógica de negócio sejam respeitadas.

## 3. Estrutura de Organização do Código

A organização do código no ABAP moderno é mais rígida para facilitar o transporte e o desacoplamento.

### 1. Software Component (Componente de Software)

É o contêiner de nível mais alto. No ambiente On-Premise, é gerenciado via transações de transporte (`SE01`/`SE09`/`STMS`). No ambiente Cloud/BTP, o Componente de Software é frequentemente vinculado a um repositório **Git**. Isso permite que o código seja gerenciado com *branches*, *pull requests* e *code reviews* externos.

### 2. Package (Pacote)

O Pacote funciona como uma "pasta" ou "namespace", mas no ABAP moderno ele tem uma função vital de **Encapsulamento**.

* **Package Interface:** Um pacote pode definir quais de seus objetos são visíveis para outros pacotes.  
* **Use Access:** Um pacote consumidor deve declarar explicitamente que usa a interface do pacote provedor.  
* Isso impede que desenvolvedores usem classes ou tabelas "internas" de outros módulos indevidamente, forçando uma arquitetura limpa.  
* Todo objeto ABAP (Classes, Tabelas, CDS) deve pertencer a um pacote. Objetos locais ($TMP) não são transportáveis.

## 4. O Primeiro Programa: "Hello World" Moderno

Esqueça os comandos REPORT e WRITE. No ABAP Cloud, a lógica de apresentação (UI) é totalmente separada da lógica de backend. Não existem telas geradas pelo servidor ABAP (Dynpros).

Para testar lógica de backend, utilizamos uma **Classe ABAP Global** que implementa uma interface especial: `if_oo_adt_classrun`.

### Por que uma Interface?

A interface `if_oo_adt_classrun` funciona como um "contrato". Ela garante que sua classe tenha um método main que o ambiente ADT sabe chamar. É o equivalente ao public static void main do Java ou C#.

### Passo a Passo Detalhado

1. No ADT, clique com botão direito no seu Pacote > **New** > **ABAP Class**.  
2. Nomeie como `zcl_hello_world` (ou prefixo do seu usuário) e adicione uma descrição.  
3. Na aba de Interfaces, adicione `if_oo_adt_classrun`.  
4. Ative a classe (`Ctrl+F3`).  
5. Execute a classe pressionando `F9`.

### Análise do Código (Syntax Highlighting e Comentários)

``` ABAP
CLASS zcl_hello_world DEFINITION  
  PUBLIC  
  FINAL  
  CREATE PUBLIC .

  PUBLIC SECTION.  
    " A interface if_oo_adt_classrun marca esta classe como executável pelo console do Eclipse.  
    " Sem ela, não podemos rodar a classe diretamente com F9.  
    INTERFACES if_oo_adt_classrun .  
      
  PROTECTED SECTION.  
  PRIVATE SECTION.  
ENDCLASS.

CLASS zcl_hello_world IMPLEMENTATION.

  " Implementação do método MAIN da interface.  
  " Este é o ponto de entrada quando a classe é executada.  
  METHOD if_oo_adt_classrun~main.  
    
    " O objeto 'out' é uma instância injetada automaticamente pelo framework.  
    " Ele possui o método 'write', que substitui o antigo comando WRITE do ABAP Clássico.  
    " Isso envia o texto para a aba 'Console' no Eclipse.  
    out->write( 'Hello World! Bem-vindo ao ABAP Moderno.' ).  
      
    " Exemplo de uso de uma API liberada (Released Object)  
    " cl_abap_context_info é a classe padrão para obter dados do sistema (data, hora, usuário)  
    " substituindo as variáveis de sistema 'sy-datum' ou 'sy-uzeit' em muitos casos.  
    DATA(lv_date) = cl_abap_context_info=>get_system_date( ).  
      
    " Uso de String Templates (|...|) para concatenação moderna  
    out->write( |A data de hoje no servidor é: { lv_date DATE = ISO }| ).

  ENDMETHOD.

ENDCLASS.
```

## 5. Amplificando o Desenvolvimento com IA: Joule for Developers

O **Joule for Developers** (ABAP AI Capabilities) é o conjunto de ferramentas de IA generativa integrado ao ADT. Ele não substitui o conhecimento de ABAP: acelera tarefas repetitivas e ajuda a entender código existente. Sua disponibilidade depende do sistema e da licença.

* **Joule Chat:** Perguntas, explicações e exemplos de código em linguagem natural (`Window → Show View → Other... → Joule`).

* **Predictive Code Completion:** Sugestões em cinza ("ghost text") que aparecem quando você faz uma pausa na digitação, em classes, interfaces e programas. Pode ser ligada ou desligada na barra de ferramentas do ADT.

* **Explain:** Selecione um objeto ou um trecho de código e escolha `Joule → Explain` (ou `/explain` no chat). Ideal para entender código legado.

* **Outras capacidades:** Geração de testes ABAP Unit (veja a lição 04.01) e de testes para CDS, criação de um serviço OData de UI (RAP) do zero e sugestão de lógica RAP (determinations e validations).

Para colocar IA dentro das **suas** aplicações, existe o **ABAP AI SDK**, uma biblioteca ABAP para consumir modelos de linguagem (LLMs) via generative AI hub.

> **Regra de ouro:** os resultados da IA variam. Revise sempre o código gerado, confirme que ele atende ao requisito e passe-o pelo ATC antes de liberar.

## Pontos de Atenção: O Que Mudou? (Clássico vs. Moderno)

| Recurso | ABAP Clássico (Legacy/On-Premise) | ABAP Moderno (Cloud/RAP) |
| :---- | :---- | :---- |
| **IDE Principal** | SAP GUI (`SE80`, `SE38`, `SE11`) | Eclipse com ADT |
| **Saída de Texto** | Comando `WRITE 'Texto'`. | Método `out->write( 'Texto' )`. |
| **Tipo de Programa** | Report (`REPORT z...`) | Classe Global com `if_oo_adt_classrun` |
| **Leitura de Dados** | `SELECT * FROM tabela_sap` (Qualquer tabela) | `SELECT * FROM cds_view_liberada` (Apenas liberadas) |
| **Telas (UI)** | Dynpro / Web Dynpro | SAP Fiori (UI5 / Fiori Elements) |
| **Variáveis Sistema** | Uso livre de `sy-datum`, `sy-uname` | Uso de classes como `cl_abap_context_info` |

## Glossário Técnico

* **ADT (ABAP Development Tools):** IDE baseada em Eclipse, mandatória para desenvolvimento ABAP moderno (RAP, CDS, Cloud). Substitui a SE80.  

* **ABAP Cloud:** Modelo de desenvolvimento restrito focado em "Clean Core". Proíbe acesso direto ao sistema e obriga o uso de APIs liberadas.  

* **Clean Core:** Estratégia arquitetural da SAP para manter o núcleo do ERP livre de modificações diretas, garantindo que upgrades de software não quebrem extensões customizadas.  

* **Released Object (Objeto Liberado):** Artefatos SAP (Tabelas, Classes, CDS) marcados com um contrato de estabilidade (C1/C2). Apenas estes objetos podem ser usados em desenvolvimento ABAP Cloud.  

* **`if_oo_adt_classrun`:** Interface padrão para criar classes executáveis via console no ADT. Substitui a necessidade de criar Reports (SE38) para testes de lógica.  

* **String Templates (|...|):** Sintaxe moderna para manipulação de strings que permite interpolação de variáveis e formatação embutida dentro de barras verticais.  

* **abapGit:** Cliente Git para ABAP, permitindo importação/exportação de código e versionamento distribuído. Essencial para ambientes Cloud e BTP.

## Quiz de Fixação

1. Por que o comando WRITE e a criação de telas Dynpro não são suportados no modelo de desenvolvimento ABAP Cloud?  
  R: O ABAP Cloud separa estritamente o Backend do Frontend. O Backend (ABAP) deve fornecer apenas serviços e APIs (OData), enquanto o Frontend deve ser baseado em tecnologias web (SAP Fiori/UI5). Comandos como WRITE geram listas clássicas exibidas no SAP GUI, o que viola essa arquitetura e não é compatível com a nuvem.  

1. Um desenvolvedor tenta ler a tabela MARA (Mestre de Materiais) em um ambiente S/4HANA Cloud e recebe um erro de sintaxe. Qual é a causa e a solução?  
  R: A causa é que a tabela MARA não é um "Released Object" no modelo ABAP Cloud. O acesso direto a tabelas físicas internas é proibido para garantir o Clean Core. A solução é encontrar e utilizar a CDS View pública equivalente liberada pela SAP, como a I_Product.  

1. Qual é a função da interface if_oo_adt_classrun e por que ela é usada no lugar de Reports tradicionais?  
  R: Ela permite que uma classe global seja executada diretamente pelo console do ADT (Eclipse). É usada no lugar de Reports porque no ABAP Cloud não existem telas de seleção ou saída de lista clássica; a interface fornece uma maneira leve e padronizada de testar lógica de backend e exibir resultados simples.

## Links de Demonstrações

- [Como criar um ABAP Cloud Project](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_CFA821567D1C62AF:demo)
- [Como criar um ABAP Package](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_E85FDC0DEC83B2B8:demo)
- [Como criar seu primeiro app ABAP ('Hello World')](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?library=library.txt&show=project!PR_B569C1AE21873BA7:demo)
