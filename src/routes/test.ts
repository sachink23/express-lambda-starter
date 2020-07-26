import express from 'express';

const router = express.Router();

router.all('/', (req, res) => {
    res.json({
        message: 'test works!',
        query: req.query,
        body: req.body
    });
});

export {
    router
};
