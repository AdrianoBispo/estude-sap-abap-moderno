# Guia de Estudo SAP ABAP Moderno

![Infográfico - A Evolução do ABAP](./Infografico_Geral_A_Evolucao_do_ABAP.png)

> Este repositório é um guia completo para desenvolvedores com conhecimento em outras linguagens (JavaScript, Java, C#, Python, etc.), profissionais SAP que desejam aprender ABAP e desenvolvedores ABAP experientes em busca de atualização. Aqui você encontra um caminho estruturado e prático, do básico ao avançado, para dominar a programação ABAP em ambientes modernos como **SAP BTP**, **SAP S/4HANA** e **ABAP Cloud**.

## Estrutura do Repositório

O conteúdo está organizado em módulos progressivos:

| Módulo | Descrição Detalhada |
| :--- | :--- |
| **[Módulo 1: Iniciando a Jornada no Desenvolvimento ABAP Moderno](./modulo-01/README.md)** | Introdução abrangente à linguagem ABAP Moderna. Aprenda a criar pacotes, objetos e aplicações, entenda a estrutura de software, técnicas de programação, classes locais, manipulação de dados (SQL e tabelas internas) e atualizações via Business Objects. Introdução ao conceito **ABAP RESTful Application Programming Model (RAP)**. |
| **[Módulo 2: Modelagem de Dados com ABAP Dictionary e CDS](./modulo-02/README.md)** | Conceitos fundamentais do **ABAP Dictionary** e definição de tabelas; criação e gerenciamento de **views** com **ABAP Core Data Services (CDS)**; modelagem de relacionamentos; aplicação de lógica SQL e **Metadata Extensions**; controle de acesso; objetos de modelagem e ciclo de vida de serviços. |
| **[Módulo 3: Introdução à Criação de um Aplicativo SAP Fiori Elements com Base em um Serviço OData V4 RAP](./modulo-03/README.md)** | Desenvolvimento de aplicações **SAP Fiori Elements** baseadas em serviços **OData V4** (RAP), utilizando **SAP Business Application Studio** e **SAP Fiori Tools**. |
| **[Módulo 4: Programação ABAP Intermediária](./modulo-04/README.md)** | Testes e análise com **ABAP Test Cockpit (ATC)**; testes unitários e **ABAP Profiling**; tipos de dados e conversões; manipulação de strings; performance com **Code Pushdown** e **Tabelas Internas**; verificações de autorização; orientação a objetos; tratamento de exceções e documentação. |
| **[Módulo 5: Praticando a extensibilidade do Clean Core para SAP S/4HANA Cloud](./modulo-05/README.md)** | Desenvolvimento de extensões seguindo o conceito **Clean Core**: preservação do núcleo, facilitação de atualizações e compatibilidade com o **ABAP Cloud Development Model**. |

## Organização e Nomenclatura dos Arquivos

Para garantir a organização, a rastreabilidade e a sequência lógica de leitura dos arquivos do projeto, foi então definida a seguinte **Regra de Nomenclatura Hierárquica**: **`DD.SS_Slug_Descritivo`**

1. **DD (Diretório Principal)**: Dois dígitos representando a pasta raiz.
2. **SS (Subdiretório)**: Dois dígitos representando a subpasta.
3. **Slug Descritivo**: O nome original ou simplificado do tópico, separado por underlines para legibilidade.

## Como Contribuir

Contribuições são bem-vindas! Se você encontrar erros, tiver sugestões de melhoria ou quiser adicionar novo conteúdo, siga estes passos:

1.  **Fork** este repositório.
2.  Crie uma nova **branch** para sua feature (`git checkout -b feature/nova-feature`).
3.  Faça suas alterações e **commit** (`git commit -m 'feat: Adiciona nova feature'`).
4.  Envie para a sua branch (`git push origin feature/nova-feature`).
5.  Abra um **Pull Request**.

## Links Úteis
  
  ### Documentação Oficial
  - [ABAP - Keyword Documentation](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABENABAP.html)
  - [ABAP RESTful Application Programming Model](https://help.sap.com/docs/abap-cloud/abap-rap/abap-restful-application-programming-model?locale=en-US&version=sap_btp)

  ### Aprenda Praticando - Tutoriais Oficiais da SAP
  - [Tutorial SAP - Crie um aplicativo de viagem com SAP Fiori Elements baseado no serviço OData V4 RAP](https://developers.sap.com/tutorials/abap-environment-extend-cds-view.html)
  - [Tutorial SAP - Estenda um Core Data Services Personalizado no Ambiente ABAP](https://developers.sap.com/tutorials/abap-environment-extend-cds-view.html)
  - [Tutorial SAP - Crie um aplicativo de Manutenção de Tabelas baseado em SAP Fiori](https://developers.sap.com/mission.abap-dev-factory-calendar.html)
  - [Tutorial SAP - \[RAP100\] - Construa um App SAP Fiori Usando o ABAP RESTful Application Programming Model](https://developers.sap.com/mission.sap-fiori-abap-rap100.html)
  - [Tutorial SAP - Use o Mockserver e a Biblioteca de Teste OPA com SAP Fiori Elements para aplicações OData V4](https://developers.sap.com/group.fiori-elements-mockserver-opa.html)
  - [Tutorial SAP - Trabalhe com projetos de adaptação SAPUI5 para fazer alterações e estender o código-fonte de uma variante de aplicação SAP Fiori no SAP S/4HANA Cloud Public Edition](https://developers.sap.com/group.sapui5-adaptation-projects.html)

## Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

_Todo conteúdo presente nesse repositório foi gerado pelo Notebook LM com base nos cursos da jornada de aprendizagem [**"Acquiring Core ABAP Skills"**](https://learning.sap.com/learning-journeys/acquire-core-abap-skills) da plataforma SAP Learning (plataforma de aprendizagem oficial da SAP)._
