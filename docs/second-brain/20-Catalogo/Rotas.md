# Rotas e metadados

Extração de todos os `page.*`, `route.*` e metadados previstos no App Router. Grupos entre parênteses são removidos do URL; parâmetros dinâmicos são preservados. O proxy é a referência de acesso; guards nesta tabela são apenas evidência local.

[[10-Mapas/Arquitetura-e-navegacao]] · [[10-Mapas/Auth-perfis-e-RLS]] · [[20-Catalogo/Indice]]

| URL | Tipo | Fonte | Guards reconhecidos |
| --- | --- | --- | --- |
| /acesso-negado | página | [[20-Catalogo/Arquivos/app--acesso-negado--page.tsx--a54b09b7\|app/acesso-negado/page.tsx]] | conferir proxy/chamadores |
| /administracao | página | [[20-Catalogo/Arquivos/app--administracao--page.tsx--12d4a78e\|app/administracao/page.tsx]] | requireAccount |
| /agenda-aluno | página | [[20-Catalogo/Arquivos/app--agenda-aluno--page.tsx--67e31ad7\|app/agenda-aluno/page.tsx]] | requireAccount |
| /agenda-institucional | página | [[20-Catalogo/Arquivos/app--agenda-institucional--page.tsx--665ee5f3\|app/agenda-institucional/page.tsx]] | getCurrentAccount |
| /api/anexos/[id] | GET | [[20-Catalogo/Arquivos/app--api--anexos--_id_--route.ts--82884916\|app/api/anexos/[id]/route.ts]] | conferir proxy/chamadores |
| /api/health | GET | [[20-Catalogo/Arquivos/app--api--health--route.ts--949aae3a\|app/api/health/route.ts]] | conferir proxy/chamadores |
| /api/maisa/actions/service-request | POST | [[20-Catalogo/Arquivos/app--api--maisa--actions--service-request--route.ts--6b3a268f\|app/api/maisa/actions/service-request/route.ts]] | getCurrentAccount |
| /api/maisa/chat | POST | [[20-Catalogo/Arquivos/app--api--maisa--chat--route.ts--536ca7da\|app/api/maisa/chat/route.ts]] | getCurrentAccount |
| /aplicativos | página | [[20-Catalogo/Arquivos/app--aplicativos--page.tsx--ed2ef3c9\|app/aplicativos/page.tsx]] | getCurrentAccount |
| /atalhos | página | [[20-Catalogo/Arquivos/app--atalhos--page.tsx--a1b8d2a5\|app/atalhos/page.tsx]] | requireAccount |
| /auditoria | página | [[20-Catalogo/Arquivos/app--auditoria--page.tsx--094b3726\|app/auditoria/page.tsx]] | requireAccount |
| /auth/callback | GET | [[20-Catalogo/Arquivos/app--auth--callback--route.ts--7394a541\|app/auth/callback/route.ts]] | conferir proxy/chamadores |
| /auth/confirm | GET | [[20-Catalogo/Arquivos/app--auth--confirm--route.ts--0680a588\|app/auth/confirm/route.ts]] | conferir proxy/chamadores |
| /auth/error | página | [[20-Catalogo/Arquivos/app--auth--error--page.tsx--ce963852\|app/auth/error/page.tsx]] | conferir proxy/chamadores |
| /auth/signout | POST | [[20-Catalogo/Arquivos/app--auth--signout--route.ts--653c5c5d\|app/auth/signout/route.ts]] | auth.getClaims |
| /auxilios | página | [[20-Catalogo/Arquivos/app--auxilios--page.tsx--4814ae03\|app/auxilios/page.tsx]] | requireAccount |
| /avaliacoes | página | [[20-Catalogo/Arquivos/app--avaliacoes--page.tsx--3ffcab5e\|app/avaliacoes/page.tsx]] | requireAccount |
| /base-conhecimento | página | [[20-Catalogo/Arquivos/app--base-conhecimento--page.tsx--689c3cf3\|app/base-conhecimento/page.tsx]] | requireAccount |
| /boletim | página | [[20-Catalogo/Arquivos/app--boletim--page.tsx--2adc429c\|app/boletim/page.tsx]] | requireAccount |
| /buscar | página | [[20-Catalogo/Arquivos/app--buscar--page.tsx--b831ec8c\|app/buscar/page.tsx]] | getCurrentAccount |
| /campus/[slug] | página | [[20-Catalogo/Arquivos/app--campus--_slug_--page.tsx--f3e708c2\|app/campus/[slug]/page.tsx]] | conferir proxy/chamadores |
| /campus | página | [[20-Catalogo/Arquivos/app--campus--page.tsx--53e7875b\|app/campus/page.tsx]] | conferir proxy/chamadores |
| /diario-professor | página | [[20-Catalogo/Arquivos/app--diario-professor--page.tsx--f81b97c9\|app/diario-professor/page.tsx]] | requireAccount |
| /disciplinas | página | [[20-Catalogo/Arquivos/app--disciplinas--page.tsx--0b46f307\|app/disciplinas/page.tsx]] | requireAccount |
| /documentos-academicos/[id] | página | [[20-Catalogo/Arquivos/app--documentos-academicos--_id_--page.tsx--e52ffa4b\|app/documentos-academicos/[id]/page.tsx]] | requireAccount |
| /documentos-academicos | página | [[20-Catalogo/Arquivos/app--documentos-academicos--page.tsx--f568891a\|app/documentos-academicos/page.tsx]] | requireAccount |
| /documentos | página | [[20-Catalogo/Arquivos/app--documentos--page.tsx--07584aa9\|app/documentos/page.tsx]] | conferir proxy/chamadores |
| /editais/agenda | GET | [[20-Catalogo/Arquivos/app--editais--agenda--route.ts--d85c5e53\|app/editais/agenda/route.ts]] | conferir proxy/chamadores |
| /editais | página | [[20-Catalogo/Arquivos/app--editais--page.tsx--76770ae1\|app/editais/page.tsx]] | conferir proxy/chamadores |
| /ensino | página | [[20-Catalogo/Arquivos/app--ensino--page.tsx--f8ee3568\|app/ensino/page.tsx]] | requireAccount |
| /estagios | página | [[20-Catalogo/Arquivos/app--estagios--page.tsx--c2337c8e\|app/estagios/page.tsx]] | requireAccount |
| /estudante | página | [[20-Catalogo/Arquivos/app--estudante--page.tsx--53a71d71\|app/estudante/page.tsx]] | requireAccount |
| /extensao | página | [[20-Catalogo/Arquivos/app--extensao--page.tsx--ed893a3d\|app/extensao/page.tsx]] | conferir proxy/chamadores |
| /gestao-academica | página | [[20-Catalogo/Arquivos/app--gestao-academica--page.tsx--cbfd7b6c\|app/gestao-academica/page.tsx]] | requireAccount |
| /horarios | página | [[20-Catalogo/Arquivos/app--horarios--page.tsx--8c8f8ca6\|app/horarios/page.tsx]] | requireAccount |
| /ifos | página | [[20-Catalogo/Arquivos/app--ifos--page.tsx--fdae91bb\|app/ifos/page.tsx]] | requireAccount |
| /importar-calendario | página | [[20-Catalogo/Arquivos/app--importar-calendario--page.tsx--589ee80c\|app/importar-calendario/page.tsx]] | requireAccount |
| /importar-dados-academicos/lotes/[id] | página | [[20-Catalogo/Arquivos/app--importar-dados-academicos--lotes--_id_--page.tsx--54aa0ee7\|app/importar-dados-academicos/lotes/[id]/page.tsx]] | requireAccount |
| /importar-dados-academicos | página | [[20-Catalogo/Arquivos/app--importar-dados-academicos--page.tsx--24d2bead\|app/importar-dados-academicos/page.tsx]] | requireAccount |
| /login | página | [[20-Catalogo/Arquivos/app--login--page.tsx--b49ea5cf\|app/login/page.tsx]] | conferir proxy/chamadores |
| /maisa | página | [[20-Catalogo/Arquivos/app--maisa--page.tsx--572894ee\|app/maisa/page.tsx]] | requireAccount |
| /manifest.webmanifest | metadado | [[20-Catalogo/Arquivos/app--manifest.ts--7f9b511b\|app/manifest.ts]] | conferir proxy/chamadores |
| /minhas-turmas | página | [[20-Catalogo/Arquivos/app--minhas-turmas--page.tsx--b9a7fb28\|app/minhas-turmas/page.tsx]] | requireAccount |
| /modelo-vinculos-institucionais | GET | [[20-Catalogo/Arquivos/app--modelo-vinculos-institucionais--route.ts--38e9ec0e\|app/modelo-vinculos-institucionais/route.ts]] | conferir proxy/chamadores |
| /monitoramento | página | [[20-Catalogo/Arquivos/app--monitoramento--page.tsx--1082a09e\|app/monitoramento/page.tsx]] | requireAccount |
| /noticias | página | [[20-Catalogo/Arquivos/app--noticias--page.tsx--8596ff2f\|app/noticias/page.tsx]] | getCurrentAccount |
| /notificacoes | página | [[20-Catalogo/Arquivos/app--notificacoes--page.tsx--5d21d45d\|app/notificacoes/page.tsx]] | requireAccount |
| /nova-senha | página | [[20-Catalogo/Arquivos/app--nova-senha--page.tsx--dbb5e073\|app/nova-senha/page.tsx]] | requireAccount |
| /opengraph-image | metadado | [[20-Catalogo/Arquivos/app--opengraph-image.tsx--871907c2\|app/opengraph-image.tsx]] | conferir proxy/chamadores |
| /oportunidades | página | [[20-Catalogo/Arquivos/app--oportunidades--page.tsx--59da9efc\|app/oportunidades/page.tsx]] | conferir proxy/chamadores |
| / | página | [[20-Catalogo/Arquivos/app--page.tsx--6efdf509\|app/page.tsx]] | requireAccount |
| /painel-institucional | página | [[20-Catalogo/Arquivos/app--painel-institucional--page.tsx--8a3a2fda\|app/painel-institucional/page.tsx]] | requireAccount |
| /pendencias | página | [[20-Catalogo/Arquivos/app--pendencias--page.tsx--19f5c1f8\|app/pendencias/page.tsx]] | requireAccount |
| /perfil | página | [[20-Catalogo/Arquivos/app--perfil--page.tsx--66a95806\|app/perfil/page.tsx]] | requireAccount |
| /personalizacao | página | [[20-Catalogo/Arquivos/app--personalizacao--page.tsx--f67abb58\|app/personalizacao/page.tsx]] | requireAccount |
| /pesquisa | página | [[20-Catalogo/Arquivos/app--pesquisa--page.tsx--cf19cfe6\|app/pesquisa/page.tsx]] | conferir proxy/chamadores |
| /pessoas | página | [[20-Catalogo/Arquivos/app--pessoas--page.tsx--7ab1d215\|app/pessoas/page.tsx]] | requireAccount |
| /portal-evolucao | página | [[20-Catalogo/Arquivos/app--portal-evolucao--page.tsx--9d477698\|app/portal-evolucao/page.tsx]] | conferir proxy/chamadores |
| /preferencias-notificacoes | página | [[20-Catalogo/Arquivos/app--preferencias-notificacoes--page.tsx--e34cc0e2\|app/preferencias-notificacoes/page.tsx]] | requireAccount |
| /processos | página | [[20-Catalogo/Arquivos/app--processos--page.tsx--5c96f151\|app/processos/page.tsx]] | requireAccount |
| /projetos | página | [[20-Catalogo/Arquivos/app--projetos--page.tsx--e6bd5451\|app/projetos/page.tsx]] | requireAccount |
| /publicacoes/[id] | página | [[20-Catalogo/Arquivos/app--publicacoes--_id_--page.tsx--d6372d6d\|app/publicacoes/[id]/page.tsx]] | getCurrentAccount |
| /recuperar-senha | página | [[20-Catalogo/Arquivos/app--recuperar-senha--page.tsx--1e8b143e\|app/recuperar-senha/page.tsx]] | conferir proxy/chamadores |
| /reportar-erro | página | [[20-Catalogo/Arquivos/app--reportar-erro--page.tsx--519e3546\|app/reportar-erro/page.tsx]] | requireAccount |
| /robots.txt | metadado | [[20-Catalogo/Arquivos/app--robots.ts--3105602f\|app/robots.ts]] | conferir proxy/chamadores |
| /servicos | página | [[20-Catalogo/Arquivos/app--servicos--page.tsx--c3f43d63\|app/servicos/page.tsx]] | conferir proxy/chamadores |
| /sitemap.xml | metadado | [[20-Catalogo/Arquivos/app--sitemap.ts--68c980f6\|app/sitemap.ts]] | conferir proxy/chamadores |
| /solicitacoes | página | [[20-Catalogo/Arquivos/app--solicitacoes--page.tsx--7c6440f8\|app/solicitacoes/page.tsx]] | requireAccount |
| /tcc | página | [[20-Catalogo/Arquivos/app--tcc--page.tsx--347ad926\|app/tcc/page.tsx]] | requireAccount |
| /transparencia | página | [[20-Catalogo/Arquivos/app--transparencia--page.tsx--906370d6\|app/transparencia/page.tsx]] | conferir proxy/chamadores |
| /usuarios | página | [[20-Catalogo/Arquivos/app--usuarios--page.tsx--ec7d8ca0\|app/usuarios/page.tsx]] | requireAccount |
| /verificar-documento | página | [[20-Catalogo/Arquivos/app--verificar-documento--page.tsx--2d957014\|app/verificar-documento/page.tsx]] | conferir proxy/chamadores |
| /vinculos-institucionais | página | [[20-Catalogo/Arquivos/app--vinculos-institucionais--page.tsx--3c749cdf\|app/vinculos-institucionais/page.tsx]] | requireAccount |
