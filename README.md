
  # Site com banco de dados

  Projeto React + Vite integrado ao Supabase.

  ## Rodando localmente

  Execute:

  ```bash
  npm install
  npm run dev
  ```

  O site abre em `http://localhost:5173`.

  ## Publicando no GitHub

  Dentro da pasta do projeto:

  ```bash
  git init
  git add .
  git commit -m "Primeira versao do site"
  git branch -M main
  git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
  git push -u origin main
  ```

  ## Publicando na Vercel

  1. Envie primeiro o projeto para o GitHub.
  2. Acesse https://vercel.com
  3. Clique em `Add New Project`
  4. Importe o repositório do GitHub
  5. A Vercel deve detectar `Vite` automaticamente
  6. Configure:
     - Build Command: `npm run build`
     - Output Directory: `dist`
  7. Clique em `Deploy`
  
