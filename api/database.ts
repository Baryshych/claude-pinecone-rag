import {Pinecone} from '@pinecone-database/pinecone';
import {Document} from "langchain/document";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import {OpenAIEmbeddings, ChatOpenAI} from "@langchain/openai";
import {PineconeStore} from '@langchain/pinecone';
import {formatDocumentsAsString} from "langchain/util/document";
import {PromptTemplate} from "@langchain/core/prompts";
import {
    RunnableMap,
    RunnableSequence,
    RunnablePassthrough,
} from "@langchain/core/runnables";
import {StringOutputParser} from "@langchain/core/output_parsers";
import {v4 as uuidv4} from 'uuid';
import 'dotenv/config'

export const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);

const embedding_model = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
    dimensions: 768
})

export const createPineconeIndex = async () => {
    const indexes = await pinecone.listIndexes().then(response => response.indexes);
    const indexExists = indexes.find(i => i.name === process.env.PINECONE_INDEX);

    if (!indexExists) {
        await pinecone.createIndex({
            name: process.env.PINECONE_INDEX,
            dimension: 768,
            spec: {
                serverless: {
                    region: "us-east-1",
                    cloud: "aws",
                },
            },
            waitUntilReady: true,
            suppressConflicts: true,
        });
        console.log("Pinecone index created.");
    } else {
        console.log("Pinecone index already exists.");
    }
};

export const updatePineconeIndex = async (document) => {

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 256,
            chunkOverlap: 10,
        });

        const content = document.content;
        const meta = document.metadata;

        console.log(`Processing document: ${meta.title}`);
        const docOutput = await splitter.splitDocuments([
            new Document({pageContent: content}),
        ]);
        console.log(`Split document into ${docOutput.length} chunks.`);
        const metadata = {...meta, chunksSize: docOutput.length}
        const embeddings = await embedding_model.embedDocuments(docOutput.map(o => o.pageContent));

        console.log(`${docOutput.length} chunks embedded.`);
        const vectors = []
        for (let i = 0; i < embeddings.length; i++) {
            vectors[i] = {
                id: uuidv4(),
                values: embeddings[i],
                metadata: {...metadata, text_content: docOutput[i].pageContent}
            }
        }
        console.log(`Uploading ${vectors.length} vectors to Pinecone.`);

        await pineconeIndex.upsert(vectors);
        console.log("Pinecone index updated with document vectors.");

        return {vectors, metadata}
    }
;

export const queryPineconeIndex = async (query) => {
    const vectorstore = await PineconeStore.fromExistingIndex(embedding_model, {pineconeIndex, maxConcurrency: 5})
    const retriever = vectorstore.asRetriever();
    const model = new ChatOpenAI({model: "gpt-4o-mini"});

    const prompt =
        PromptTemplate.fromTemplate(`Answer the question based only on the following context:
            {context}

               Question: {question}`);
    const chain = RunnableSequence.from([
        {
            context: (input) => formatDocumentsAsString(input.context),
            question: new RunnablePassthrough(),
        },
        prompt,
        model,
        new StringOutputParser(),
    ]);

    let ragChainWithSource = new RunnableMap({
        steps: { context: retriever },
    });

    ragChainWithSource = ragChainWithSource.assign({ answer: chain });


    return await ragChainWithSource.invoke(query);
};


