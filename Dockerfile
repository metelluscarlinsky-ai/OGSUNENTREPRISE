FROM node:18-alpine
WORKDIR /app

# 1. Kopye package.json yo anvan pou enstale depandans yo (sa fè build la pi vit)
COPY server/package*.json ./server/

# 2. Enstale depandans yo andedan dosye server a
RUN cd server && npm install --production

# 3. Kopye tout rès kòd la (tou de server ak public)
COPY server ./server
COPY public ./public

# 4. Mete w andedan dosye server a pou l ka kouri
WORKDIR /app/server

EXPOSE 10000
CMD ["node", "server.js"]
