FROM node:20-slim

WORKDIR /

COPY package*.json ./

RUN npm install 

COPY . . 

RUN npm run build 
# CMD ["bash", "-c", "npm run seed && npm run start"]
# CMD [ "npm", "run", "start" ]
# CMD [ "node", "--max-old-space-size=6144", "dist/main.js" ] #6gb
CMD [ "node", "--max-old-space-size=3584", "dist/main.js" ]

