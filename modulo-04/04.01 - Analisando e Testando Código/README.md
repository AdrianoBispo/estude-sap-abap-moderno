# Analisando e Testando Código

![Infográfico - A Triade da Qualidade de Código ABAP Moderno](./04.01_A_Triade_da_Qualidade_ABAP.png)

> **Comece pelos slides: [Analisando e testando código](./04.01_Analisando_e_testando_código.pptx)**
>
> Material complementar em PDF: [Dominando a Qualidade de Código no ABAP Moderno para S/4HANA](./04.01_Qualidade_ABAP_do_Funcional_ao_Robusto.pdf)
>
> **Referência oficial (ABAP Keyword Documentation):** [ABAP Unit](https://help.sap.com/docs/abap-cloud/abap-keywords/abap-unit)

## Objetivos de Aprendizagem

- Diferenciar tecnicamente e conceitualmente **Análise Estática** (ATC/Code Inspector) de **Análise Dinâmica** (Unit Tests, Profiling), compreendendo o momento certo de aplicar cada uma no ciclo de vida do desenvolvimento (ALM).  

- Utilizar o **ABAP Test Cockpit (ATC)** para identificar e corrigir proativamente problemas de sintaxe moderna, gargalos de performance, falhas de segurança e conformidade com o *Clean Core*.  

- Escrever classes de **Teste Unitário (ABAP Unit)** robustas, aplicando o padrão **AAA (Arrange, Act, Assert)** e compreendendo o ciclo de vida dos métodos de configuração (setup, teardown).  

- Executar e interpretar rastreamentos de **ABAP Profiling** no Eclipse para identificar o consumo de recursos (CPU vs. Banco de Dados) e otimizar rotinas críticas.

- Analisar o acesso ao banco com o **SQL Trace** e gerar testes ABAP Unit com o **Joule**, revisando o resultado.

## 1. A Tríade da Qualidade de Código: De "Funciona" para "Robusto"

No desenvolvimento de software moderno, especialmente em ambientes ERP críticos como o S/4HANA, "funcionar na minha máquina" não é suficiente. Um código pode produzir o resultado correto hoje, mas ser impossível de manter amanhã ou causar falhas quando o volume de dados aumentar.

A qualidade de código no ABAP apoia-se em três pilares fundamentais, frequentemente automatizados em esteiras de CI/CD (Integração Contínua):

1. **Conformidade (Compliance) -> ATC:** O código segue as regras da empresa e da SAP? Ele é seguro? Ele está pronto para a nuvem?  

2. **Correção (Correctness) -> ABAP Unit:** O código faz exatamente o que a regra de negócio pede? Se uma linha for alterada hoje, causará regressão?  

3. **Performance -> ABAP Profiling:** O código é eficiente? Ele consome memória excessiva ou faz chamadas desnecessárias ao banco?

## 2. Análise Estática: ABAP Test Cockpit (ATC)

O ATC atua como um "inspetor de qualidade" automatizado. Ele utiliza a engine do *Code Inspector (SCI)* para ler seu código fonte sem executá-lo, procurando por padrões conhecidos de má programação, vulnerabilidades de segurança ou sintaxe obsoleta.

### O que o ATC verifica (Categorias Principais):

* **Sintaxe e Modernização:** Uso de comandos obsoletos (ex: `MOVE`, `COMPUTE`, `CALL METHOD`) em vez das novas sintaxes (Inline, Expressions).  

* **Performance (HANA):** Detecta *SELECTs dentro de LOOPs* (o pecado capital da performance), leitura de tabelas inteiras sem filtro e índices ausentes.  

* **Segurança:** Falta de verificação de autorização (`AUTHORITY-CHECK`) antes de ações críticas ou vulnerabilidades de injeção de SQL (SQL Injection) em SQL dinâmico.  

* **Robustez:** Variáveis declaradas mas não usadas (Dead Code), ou tipos incompatíveis que podem causar *Dumps* em tempo de execução.  

* **Cloud Readiness:** Verifica se o código utiliza objetos não liberados ou acessa diretamente o sistema operacional, o que é proibido no ABAP Cloud.

### Gerenciando Descobertas e Isenções (Pragmas e Pseudo-Comentários)

Às vezes, o ATC aponta um erro que, naquele contexto específico, é intencional ou inevitável.

* **Quick Fixes (`Ctrl+1`):** No ADT, muitos erros (como falta de ordenação no `SELECT`) podem ser corrigidos automaticamente pela ferramenta.  

* **Pragmas:** Para silenciar um aviso falso-positivo, usamos pragmas (comandos ##...). Exemplos: `##NO_TEXT` indica que um literal de texto propositalmente não precisa de tradução; `##NEEDED` indica que uma variável declarada é necessária mesmo sem uso aparente.  
``` ABAP
  DATA(lv_dummy) = 'Teste' ##NO_TEXT. " Ignora aviso de hardcoded text
  DATA lv_unused TYPE i ##NEEDED.     " Ignora aviso de variável não utilizada
```

## 3. Análise Dinâmica: ABAP Unit Tests

Enquanto o ATC olha a *forma*, o ABAP Unit olha a *função*. O Teste Unitário é uma rede de segurança que permite refatorar e evoluir o sistema sem medo de quebrar funcionalidades existentes.

### Anatomia de uma Classe de Teste

As classes de teste são **Classes Locais** especiais definidas dentro da classe global (na aba "Local Test Classes" do ADT), marcadas com a cláusula `FOR TESTING`. Elas não são transportadas para produção como código executável, mas garantem a qualidade antes do transporte.

* **Configurações da Classe (RISK LEVEL e DURATION):**
  * **RISK LEVEL HARMLESS:** O teste é seguro. Não faz COMMIT no banco, não altera configurações do sistema. (Obrigatório para testes automáticos).  

  * **RISK LEVEL DANGEROUS/CRITICAL:** O teste pode alterar dados reais. Geralmente evitado ou usado apenas em ambientes de sandbox controlados.  

  * **DURATION SHORT:** O teste deve ser rápido. O limite de tempo de cada categoria (SHORT/MEDIUM/LONG) é configurável no sistema; se for excedido, o framework aborta o teste.

#### **O Ciclo de Vida do Teste (Fixtures)**

Para garantir que cada teste seja independente (isolado), o framework oferece métodos especiais:

1. **class_setup:** Roda uma vez antes de todos os testes da classe (ex: carregar dados estáticos pesados).  

2. **setup:** Roda **antes de cada método** de teste. Usado para criar uma nova instância da classe a ser testada (limpar a memória).  

3. **teardown:** Roda **após cada método** de teste. Usado para limpar recursos ou desfazer alterações.  

4. **class_teardown:** Roda uma vez ao final de tudo.

## 4. Análise de Performance: ABAP Profiling

Às vezes, o código está correto e passa no ATC, mas o usuário reclama de lentidão. O "olhômetro" é péssimo para julgar performance. O **ABAP Profiler** (integrado ao ADT) é a ferramenta científica para isso.

* **Como funciona:**
  1. Você inicia o Profiling no ADT para um usuário ou processo.  
  2. Executa a ação no sistema (Fiori, Console, Transação).  
  3. Para o Profiling e analisa o arquivo de rastreamento (Trace File).

* **O que analisar no Trace:**
  * **Hit List:** Quais métodos foram chamados mais vezes? (Ex: um método pequeno chamado 1 milhão de vezes pode ser o gargalo).  

  * **Gross Time vs. Net Time:** Tempo total gasto no método (incluindo chamadas filhas) vs. tempo gasto processando a lógica do próprio método.  

  * **Database Accesses:** Mostra exatamente quais SELECTs foram feitos, quantas linhas retornaram e quanto tempo o banco demorou. É aqui que descobrimos o problema "N+1" (muitos selects pequenos).

## 5. Exemplo Prático: Teste Unitário com Cenário Negativo

Vamos expandir o exemplo da calculadora para incluir um teste de sucesso e um teste de falha (cenário negativo), demonstrando o uso de asserções.

### Classe de Produção (zcl_calc):

``` ABAP
CLASS zcl_calc DEFINITION PUBLIC FINAL CREATE PUBLIC.  
  PUBLIC SECTION.  
    "! Método para dividir dois números  
    "! @parameter iv_a | Dividendo  
    "! @parameter iv_b | Divisor  
    "! @parameter rv_result | Resultado da divisão  
    "! @raising cx_sy_zerodivide | Se o divisor for zero  
    METHODS dividir  
      IMPORTING iv_a TYPE i iv_b TYPE i  
      RETURNING VALUE(rv_result) TYPE p LENGTH 10 DECIMALS 2  
      RAISING   cx_sy_zerodivide.  
ENDCLASS.

CLASS zcl_calc IMPLEMENTATION.  
  METHOD dividir.  
    " Se iv_b for 0, o kernel ABAP dispara cx_sy_zerodivide automaticamente  
    rv_result = iv_a / iv_b.  
  ENDMETHOD.  
ENDCLASS.
```

### Classe de Teste (Aba "Local Test Classes" no ADT):

``` ABAP
CLASS ltcl_test_calc DEFINITION FINAL FOR TESTING  
  DURATION SHORT  
  RISK LEVEL HARMLESS.

  PRIVATE SECTION.  
    " CUT = Class Under Test (O objeto que vamos testar)  
    DATA: mo_cut TYPE REF TO zcl_calc.

    " Fixture: Prepara o ambiente antes de CADA teste  
    METHODS setup.

    " Casos de Teste  
    METHODS test_divisao_sucesso FOR TESTING.  
    METHODS test_divisao_por_zero FOR TESTING.  
ENDCLASS.

CLASS ltcl_test_calc IMPLEMENTATION.

  METHOD setup.  
    " Garante uma instância nova e limpa para cada teste  
    mo_cut = NEW #( ).  
  ENDMETHOD.

  METHOD test_divisao_sucesso.  
    " Padrão AAA: Arrange (Preparar), Act (Agir), Assert (Verificar)  
      
    " Act  
    TRY.  
        DATA(lv_result) = mo_cut->dividir( iv_a = 10 iv_b = 2 ).  
    CATCH cx_sy_zerodivide.  
        cl_abap_unit_assert=>fail( msg = 'Não deveria lançar exceção aqui' ).  
    ENDTRY.

    " Assert  
    cl_abap_unit_assert=>assert_equals(  
      act = lv_result  " Actual (O que o código devolveu)  
      exp = 5          " Expected (O que a matemática diz)  
      msg = 'Divisão de 10 / 2 deve ser 5'  
      tol = '0.01'     " Tolerância para números decimais  
    ).  
  ENDMETHOD.

  METHOD test_divisao_por_zero.  
    " Testando se o código FALHA corretamente quando deve falhar  
      
    TRY.  
        mo_cut->dividir( iv_a = 10 iv_b = 0 ).  
          
        " Se chegou aqui, o código NÃO lançou erro, o que está ERRADO para este teste  
        cl_abap_unit_assert=>fail( msg = 'Deveria ter lançado exceção de divisão por zero' ).  
          
    CATCH cx_sy_zerodivide.  
        " Se caiu aqui, o teste passou! O erro era esperado.  
    ENDTRY.  
  ENDMETHOD.

ENDCLASS.
```

## 6. Analisando o Acesso ao Banco: SQL Trace

O Profiling (seção 4) mostra **se** o banco é o gargalo. O **SQL Trace** mostra **quais** instruções SQL custam caro: quantas vezes cada tabela foi acessada, quantos registros vieram e quanto tempo levou, inclusive o SQL nativo que chegou ao banco.

1. **Ativar:** No Project Explorer, botão direito no projeto → `SQL Trace...` → `Activate`.
2. **Executar:** Rode o cenário (ex.: a classe como console app com `F9`).
3. **Desativar:** `SQL Trace...` → `Deactivate`, e depois `View Trace Directory`.
4. **Analisar:** O resultado abre no **Technical Monitoring Cockpit** (no navegador). Filtre pela coluna `Program` com o nome da sua classe e ordene por `Accessed Records` ou `Duration`.

**Restrições:** Apenas um usuário por instância pode ligar o trace de cada vez (desligue logo após o uso) e, ativado pelo ADT, ele não aceita filtros de gravação. Em sistemas on-premise/Private Edition, a transação clássica equivalente é a `ST05`.

> **Padrão típico encontrado:** centenas de `SELECT SINGLE` de 1 registro dentro de um `LOOP`. A correção costuma ser um único `SELECT` para a tabela interna (ou um `JOIN`, veja a lição 04.04) seguido de leitura em memória.

## 7. Gerando Testes ABAP Unit com o Joule

O Joule for Developers acelera a escrita de testes. No editor, botão direito → `Joule → Start Chat for ABAP Unit`:

* **Generate Tests:** Gera métodos de teste para métodos selecionados da classe global ou de uma classe local.

* **Explain `<classe de teste>`:** Explica testes existentes, aponta *test smells* e os padrões usados.

* **Find Test-Unfriendly Dependencies:** Identifica dependências que dificultam o teste e sugere **test doubles** para isolá-las.

O resultado é um ponto de partida: refatore o código gerado para o padrão da equipe e confirme que os testes verificam a regra de negócio, e não apenas a implementação atual.

## Comparativo Detalhado: ATC vs ABAP Unit

| Característica | ATC (Test Cockpit) | ABAP Unit |
| :---- | :---- | :---- |
| **Tipo de Análise** | Estática (Lê o código). | Dinâmica (Roda o código). |
| **O que detecta?** | Erros de sintaxe, performance estrutural, segurança, convenções de nome. | Lógica de negócio incorreta, bugs de cálculo, falhas de fluxo. |
| **Responsabilidade** | O sistema verifica automaticamente (Qualidade passiva). | O Desenvolvedor escreve os cenários (Qualidade ativa). |
| **Execução** | Na liberação da tarefa ou manual. | Manual (`Ctrl + Shift + F10`) ou agendada (Nightly). |
| **Bloqueio** | Pode impedir a liberação da Request (Transporte). | Erros de teste não bloqueiam transporte por padrão (mas deveriam). |

## Glossário Técnico

* **Static Analysis (Análise Estática):** Verificação do código fonte em repouso (sem execução). Foca em sintaxe, convenções, segurança e conformidade (Clean Core). Ferramenta: ATC.  

* **Dynamic Analysis (Análise Dinâmica):** Verificação do comportamento do código em execução. Foca em lógica de negócio, fluxo de dados e consumo de recursos. Ferramentas: ABAP Unit, Profiler.  

* **ATC (ABAP Test Cockpit):** Cockpit central de qualidade da SAP. Permite configurar variantes de verificação (Check Variants) e pode ser integrado ao sistema de transportes para bloquear código ruim.  

* **ABAP Unit:** Framework nativo de testes unitários (família xUnit). Permite a criação de testes de regressão automatizados que rodam em milissegundos.  

* **CUT (Code Under Test):** O objeto específico (classe/método) que está sendo testado.  

* **Test Fixture (Setup/Teardown):** Métodos especiais que configuram o estado inicial antes de um teste e limpam o estado após o teste, garantindo isolamento.  

* **Code Coverage (Cobertura de Código):** Métrica que indica qual porcentagem do seu código produtivo foi efetivamente executada pelos seus testes unitários. Uma cobertura alta reduz o risco de bugs não detectados.  

* **Mocking (Test Double):** Técnica de substituir dependências complexas (como acesso a banco de dados ou chamadas de API externa) por objetos simulados (Mocks) dentro do teste unitário, para testar a lógica isoladamente.

## Quiz de Fixação

1. Qual é a função primária da classe cl_abap_unit_assert e cite dois de seus métodos principais?  
  R: Ela fornece os métodos estáticos para validar os resultados dos testes. Se a condição falhar, ela interrompe o teste e reporta o erro. Métodos principais: assert_equals (verifica se dois valores são iguais) e assert_bound (verifica se uma referência de objeto é válida/instanciada).  

2. O que significa definir uma classe de teste com RISK LEVEL HARMLESS e por que isso é importante?  
  R: Significa que o teste é inofensivo e seguro para rodar em qualquer ambiente (inclusive produtivo, embora não recomendado). Ele garante que o teste não fará alterações persistentes no banco de dados (COMMIT) nem afetará configurações do sistema. Se o teste tentar fazer isso, o framework o abortará imediatamente.  

3. Durante uma análise de Profiling, você percebe que o tempo de banco de dados (Database Time) é muito maior que o tempo de ABAP (CPU Time). O que isso geralmente indica e onde você deve procurar o problema?  
  R: Isso indica que a aplicação está gastando a maior parte do tempo esperando o banco de dados responder. O problema geralmente está em SELECTs ineficientes (falta de índice, leitura de colunas desnecessárias) ou, muito frequentemente, no problema "N+1" (fazer um SELECT dentro de um LOOP). O desenvolvedor deve olhar a aba "Database Accesses" do Profiler.  

4. Para silenciar um erro do ATC que você sabe ser um falso-positivo (ou uma exceção permitida), o que você deve usar no código?  
  R: Você deve usar um Pragma (código iniciado por ##, ex: ##NO_TEXT) ou um Pseudo-Comentário (comentário especial #EC...), dependendo do tipo de mensagem de erro, para instruir o ATC a ignorar aquela linha específica.
