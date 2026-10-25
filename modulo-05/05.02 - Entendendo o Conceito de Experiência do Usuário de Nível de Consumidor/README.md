# Entendendo o Conceito de Experiência do Usuário de Nível de Consumidor

![Infográfico - Os 5 Princípios do SAP Fiori](./05.02_Os_5_Principios_do_SAP_Fiori.png)

> **Comece pelos slides: [A Grande Virada: Da Função à Experiência](./05.02_Fiori_Redefinindo_o_Papel_do_Desenvolvedor.pdf)**

## Objetivos de Aprendizagem

- Explicar e exemplificar os **5 Princípios de Design do SAP Fiori** (Role-Based, Adaptive, Simple, Coherent, Delightful), aplicando-os na avaliação de interfaces.  

- Compreender a mudança fundamental de paradigma de sistemas "Transacionais" (Focados em Funções/SAP GUI) para sistemas "Baseados em Intenção" (Focados no Usuário/Fiori).  

- Identificar o papel central do **SAP Fiori Launchpad** não apenas como um menu, mas como um "Shell" de serviços integrados (Busca, Notificações, Navegação).  

- Justificar economicamente por que a consistência visual reduz o Custo Total de Propriedade (TCO), minimizando a necessidade de treinamento e erros operacionais.

## 1. Adeus SAP GUI, Olá Experiência de Consumidor

Durante décadas, o SAP foi sinônimo de eficiência no processamento de dados, mas também de telas cinzentas, densas e complexas (o famoso SAP GUI). O design era focado na **Funcionalidade**: "Como colocamos todos os campos possíveis em uma única tela para que o usuário não precise trocar de transação?". Isso resultou em transações "monstro" como a `VA01` (Criar Ordem de Venda) ou `ME21N` (Criar Pedido de Compra), que exigiam meses de treinamento para serem dominadas. O usuário precisava memorizar códigos de transação (T-Codes) e navegar por dezenas de abas.

* **A Revolução Mobile e a Expectativa do Usuário:** Com a ascensão dos smartphones e aplicativos de consumo (como Uber, Airbnb, Instagram), o perfil do usuário corporativo mudou. Ele passou a se perguntar: "Por que eu consigo reservar um hotel na Ásia em 3 cliques no meu celular, mas preciso de 15 cliques e 4 abas para pedir uma caneta no sistema da empresa?".

* **Consumer-Grade UX (Experiência de Nível de Consumidor):** O conceito de Consumer-Grade UX significa elevar o padrão do software corporativo para igualar a intuitividade e a estética dos aplicativos pessoais.

  * **Zero Training:** O objetivo é que o software seja tão intuitivo que não exija manuais.  
  
  * **Foco na Tarefa:** Em vez de expor todas as funções, expõe-se apenas o necessário para aquele momento.  
  
  * **Estética:** O visual agradável reduz a fadiga e aumenta a satisfação no trabalho.

## 2. Os 5 Princípios do SAP Fiori

Para garantir que essa qualidade não fosse apenas cosmética, a SAP definiu uma filosofia de design rigorosa. Todo aplicativo S/4HANA (seja padrão ou desenvolvido por você) deve seguir os 5 princípios do Fiori:

### 1. Role-Based (Baseado em Papéis)

O sistema antigo era "Baseado em Funções": todos viam a mesma transação `VA01`, fosse um Diretor ou um Estagiário. O Fiori decompõe essas transações monolíticas. Agora no Fiori o aplicativo é desenhado para *quem* vai usá-lo, não para *o que* ele faz tecnicamente.

* **Exemplo:** Em vez de uma tela gigante de "Pedidos", temos apps separados:  
  
  * "Aprovar Pedidos" (Para o Gerente - Simples, rápido).  
  * "Monitorar Atendimento de Pedidos" (Para o Logístico - Analítico, detalhado).  
  * "Criar Pedido de Venda Rápido" (Para o Vendedor de Campo - Mobile, poucos campos).  

* **Resultado:** O usuário só vê o que é relevante para o seu trabalho, reduzindo o ruído cognitivo.

### 2. Adaptive (Adaptável)

O trabalho moderno não acontece apenas na mesa do escritório. Acontece no chão de fábrica, no cliente, no aeroporto.

* **O Conceito:** O aplicativo deve se adaptar ao dispositivo, não o contrário. Ele deve oferecer uma experiência fluida seja num monitor 4K, num tablet ou num smartphone.

* **Técnica:** Uso de layouts responsivos (como o SAPUI5 ou Fiori Elements) que reorganizam colunas, escondem detalhes menos importantes e transformam tabelas em listas conforme a tela diminui ("Mobile First").

### 3. Simple (Simples)

Simples não significa "básico" ou "sem recursos". Significa "livre de complexidade desnecessária".

* **Regra 1-1-3:** Um usuário, Um caso de uso, Três telas no máximo.  
* **Foco no Essencial:** Se um campo é usado em apenas 1% dos casos, ele não deve estar na tela principal. Ele deve estar escondido ou em uma aba "Avançado". O Fiori prioriza o "Caminho Feliz" (Happy Path), tornando as tarefas rotineiras extremamente rápidas.

### 4. Coherent (Coerente)

A incoerência é a maior causa de erros de usuário. Se no `App A` o botão de salvar é verde e fica em cima, e no `App B` é azul e fica embaixo, o usuário precisa reaprender a usar o sistema a cada tela.

* **O Conceito:** Todos os apps devem falar a mesma língua visual e comportamental.  
* **Padrões:** O botão de "Ação Principal" (Salvar, Enviar) fica sempre no canto inferior direito. A barra de busca fica sempre no topo. O filtro funciona igual em todos os relatórios. Isso cria **memória muscular** digital.

### 5. Delightful (Agradável)

Software corporativo não precisa ser chato. Um sistema que é prazeroso de usar aumenta a produtividade e a adoção.

* **O Conceito:** Criar uma conexão emocional com o usuário.  
* **Elementos:** Uso de animações suaves para transição de telas (dando feedback de que o sistema está trabalhando), gráficos bonitos, tipografia clara e feedback instantâneo (mensagens de sucesso amigáveis). O sistema deve fazer o usuário se sentir inteligente e eficiente.

## 3. O Fiori Launchpad: O Ponto Único de Entrada

No passado, a área de trabalho de um usuário SAP era fragmentada: ícone do SAP Logon, link do Portal RH, link do CRM Web, link do BI.

No S/4HANA, o SAP Fiori Launchpad (FLP) unifica tudo. Ele não é apenas um menu; é um "Shell" inteligente.

* **Tiles (Blocos Dinâmicos):** Diferente de ícones estáticos, os Tiles podem mostrar informações em tempo real ("KPIs"). Um tile de "Aprovações Pendentes" pode mostrar o número "5" em vermelho, alertando o usuário sem que ele precise entrar no app.

* **Enterprise Search:** Uma barra de pesquisa global (estilo Google) no topo da tela. O usuário pode digitar "Parafuso" ou "Pedido 4500" e o sistema busca em todos os objetos de negócio indexados no HANA, eliminando a necessidade de saber qual transação usar para ver um material.  

* **Notificações:** Um centro de notificações centralizado (sino no topo) que avisa sobre tarefas, aprovações ou alertas de sistema, similar a uma rede social.  

* **Spaces and Pages:** A nova forma de organizar o conteúdo. Em vez de uma página infinita de ícones, o conteúdo é estruturado em "Espaços" (Abas por área de negócio, ex: Vendas, Estoque) e "Páginas" (Layouts curados de apps relevantes).

## 4. Por que a Consistência Importa para o Desenvolvedor?

Como desenvolvedor ABAP/RAP, você pode pensar: *"Eu sou backend, a UI não é problema meu"*. **Este é um erro estratégico.** No mundo Clean Core, o desenvolvedor é responsável pela entrega da funcionalidade ponta a ponta.

Se você criar um aplicativo customizado (Z) que ignora os padrões do Fiori (ex: usa cores fora da paleta, posiciona botões de forma criativa ou usa terminologia diferente), você quebra a experiência **Coerente**.

- **O Custo da Inconsistência (TCO - Total Cost of Ownership):**

  1. **Custo de Treinamento:** Se seu app funciona diferente do padrão, a empresa precisa criar um manual específico e treinar os usuários só para ele. Se ele segue o padrão Fiori Elements, o usuário já sabe usá-lo intuitivamente.  
  
  2. **Erros de Usuário:** Mudanças de padrão causam confusão. O usuário clica em "Cancelar" achando que é "Salvar" porque a posição mudou.  
  
  3. **Manutenção:** Apps fora do padrão são mais difíceis de manter e adaptar a novas versões do design system da SAP.

Usar **SAP Fiori Elements** é a estratégia mais segura. O framework garante que seu aplicativo siga rigorosamente as diretrizes da SAP, seja responsivo e acessível, protegendo o investimento da empresa.

## Os 5 Princípios (Mnemônico RASCD)

* **R**ole-Based (Baseado em Papéis): Decompor complexidade em apps focados na função do usuário.  
* **A**daptive (Adaptável): Responsividade total (Desktop, Tablet, Mobile).  
* **S**imple (Simples): Foco no essencial, regra 1-1-3.  
* **C**oherent (Coerente): Mesma aparência e comportamento em todo o sistema.  
* **D**elightful (Agradável): Conexão emocional, feedback visual, performance.

## Glossário Técnico

* **SAP Fiori:** O sistema de design (Design System) oficial da SAP para todas as aplicações modernas. Define regras estritas de visual, comportamento, navegação e interação para garantir consistência.
 
* **Consumer-Grade UX:** Filosofia de design que aplica os padrões de usabilidade e estética de softwares de consumo de massa (Apple, Google) ao software empresarial, priorizando a facilidade de uso, a curva de aprendizado zero e a satisfação do usuário.

* **Launchpad:** O shell (casca) web baseado em navegador que hospeda todos os aplicativos Fiori. Fornece serviços transversais essenciais como autenticação, navegação entre apps, pesquisa global (Enterprise Search), notificações e personalização de tema.

* **Enterprise Search:** Ferramenta de busca global poderosa integrada ao Launchpad. Permite encontrar objetos de negócio (Clientes, Materiais, Faturas) indexados no banco de dados HANA através de palavras-chave, sem precisar navegar em menus.

* **Spaces and Pages:** Estrutura moderna de organização do layout do Launchpad. Um Usuário tem acesso a **Espaços** (que aparecem como abas no topo, ex: "Contabilidade"), que contêm uma ou mais **Páginas**, que por sua vez organizam os **Tiles** em seções lógicas.

* **Tile (Bloco):** O ponto de entrada visual para um aplicativo no Launchpad. Pode ser estático (apenas ícone e texto) ou dinâmico (exibindo contadores, gráficos ou KPIs em tempo real).

## Quiz de Fixação

Q1: Qual princípio do SAP Fiori dita que um aplicativo deve reorganizar seu layout automaticamente (ex: mover colunas, transformar tabelas em listas) para funcionar bem tanto em um monitor desktop de 27 polegadas quanto em um smartphone?  
  R: O princípio Adaptive (Adaptável). Ele exige que a interface seja responsiva e ofereça uma experiência de uso viável independente do tamanho da tela ou do dispositivo de entrada (mouse vs toque).  

Q2: Por que a mudança de um design "Baseado em Funções" (SAP GUI) para "Baseado em Papéis" (Fiori) é considerada fundamental para a produtividade?  
  R: Porque ela elimina o ruído cognitivo. No design antigo, o usuário recebia uma transação monolítica com centenas de campos e opções irrelevantes para ele. No design baseado em papéis, a tarefa é quebrada em aplicativos menores e específicos, mostrando ao usuário apenas os dados e ações necessários para a sua função específica naquele momento.  

Q3: Do ponto de vista econômico (TCO), qual é a principal desvantagem de um desenvolvedor criar uma interface "Freestyle" que não segue os padrões de design do SAP Fiori (Princípio da Coerência)?  
  R: O aumento do custo de treinamento e suporte. Se a interface for inconsistente com o resto do sistema, os usuários não conseguirão aplicar seu conhecimento prévio (memória muscular), exigindo treinamento específico para aquele app e aumentando a probabilidade de erros operacionais e chamados de suporte.

## Links de Demonstrações

- [Crie uma aplicação SAP Fiori](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?show=project!PR_E638047297BCDEB3:uebung)
- [Crie uma experiência do usuário (UX) usando o SAP Build Apps.](https://learnsap.enable-now.cloud.sap/pub/mmcp/index.html?show=project!PR_B483C3DF4A2E1B9A:uebung)
