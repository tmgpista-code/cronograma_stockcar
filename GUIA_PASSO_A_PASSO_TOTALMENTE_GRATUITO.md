# Guia detalhado do zero: versão totalmente gratuita

## Modelo usado
- GitHub Pages para publicar o site
- Firebase Realtime Database para tarefas, membros, sessões e documentos
- arquivos de imagem e PDF dentro do próprio repositório GitHub, na pasta assets

## Etapa 1
Baixe este ZIP e extraia a pasta.

## Etapa 2
Renomeie `firebase-config.example.js` para `firebase-config.js`.

## Etapa 3
Crie o projeto no Firebase, registre o app web e copie os dados do `firebaseConfig` para o arquivo `firebase-config.js`.

## Etapa 4
Ative o Realtime Database e use estas regras no começo:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

## Etapa 5
Coloque seus logos em `assets/logos` e seus PDFs em `assets/docs`.

## Etapa 6
Suba tudo para um repositório público no GitHub.

## Etapa 7
Ative o GitHub Pages em Settings > Pages.
