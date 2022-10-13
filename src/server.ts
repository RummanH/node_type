import Logging from './Logging';

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
import authorRoutes from './routes/Author';
const { config } = require('./config/config');

const router = express();

mongoose
    .connect(config.db_uri, { retryWrites: true, w: 'majority' })
    .then(() => {
        Logging.info('Connected to MongoDB');
        StartServer();
    })
    .catch((err: any) => {
        Logging.error(err);
    });

const StartServer = () => {
    router.use((req: any, res: any, next: any) => {
        Logging.info(
            `Incoming => [${req.method}] - Url: [${req.url}] -IP: [${req.socket.remoteAddress}]`
        );

        res.on('finish', () => {
            Logging.info(
                `Outgoing => [${req.method}] - Url: [${req.url}] -IP: [${req.socket.remoteAddress}] - Status: [${res.statusCode}]`
            );
        });

        next();
    });

    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    router.use((req: any, res: any, next: any) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        );

        if (req.method == 'OPTIONS') {
            res.header(
                'Access-Control-Allow-Methods',
                'PUT, POST, PATCH, DELETE, GET'
            );
            return res.status(200).json({});
        }

        next();
    });

    router.use('/authors', authorRoutes);

    router.get('/ping', (req: any, res: any, next: any) => {
        res.status(200).json({
            message: 'Pong'
        });
    });

    router.use((req: any, res: any, next: any) => {
        const error = new Error('Not found');
        Logging.error(error);

        res.status(404).json({ message: error.message });
    });

    http.createServer(router).listen(config.port, () => {
        Logging.info(`Server is running on port ${config.port}`);
    });
};
