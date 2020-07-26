import express from 'express';
import serverless from 'serverless-http';
import {router as testRouter} from './routes/test';

const app = express();

app.use(express.json());

app.use('/test', testRouter);

app.use((req, res) => {
    res.status(404).json({
        message: 'Not Found'
    });
});
const handler = serverless(app);
export {
    app,
    handler
};

