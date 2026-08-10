# Dashboard de Frequencia Senac

Dashboard para acompanhamento de frequencia, atividades, relatorios, cadernos e ATA.

## Site

O GitHub Pages publica o arquivo `index.html`.

## Aplicativo Windows

O aplicativo usa Electron e recebe atualizacoes pelo GitHub Releases. A primeira
instalacao deve ser feita manualmente com o instalador da versao 1.1.1 ou mais
recente. Depois disso, novas versoes sao baixadas automaticamente.

## Publicar uma nova versao

1. Atualize e envie o `index.html` e os arquivos do aplicativo para a branch `main`.
2. Abra a aba **Actions** no repositorio.
3. Selecione **Publicar aplicativo Windows**.
4. Clique em **Run workflow**.
5. Informe uma versao maior que a anterior, como `1.1.2`.
6. Aguarde o workflow ficar verde.
7. Confira a nova versao na area **Releases**.

O workflow gera e publica automaticamente o instalador, o `latest.yml` e o
arquivo `.blockmap`. Nao coloque senhas ou tokens dentro do codigo: o workflow
usa o `GITHUB_TOKEN` temporario fornecido pelo proprio GitHub.
