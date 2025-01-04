<p> NB: This version was made in approx 2 hours</p>
<p>There are two projects in this repo.</p>
**api** - backend
**client** - frontend

<p>Required ENVs are listed in `env.template` in projects folders</p>

## To launch the project: 
### backend: 
From the api folder: 
npm i
npx tsx api.ts 

### frontend:
From the client folder: 
npm i
npm run dev

## Considerations taken:
1. To limit number for embeddings calls I check for file existancy and send requests in bulk
2.  Errors are being handled in case of external API crashes
3. File type and size are limited

## What was not completed:
1. Python script
2. Entity extraction
3. Scores in source documents

## What to improve:
1. Check if file exists by hashsum
2. Tune the promt
3. Add custom retriever to catch scores from source docs
4. Create better chunks