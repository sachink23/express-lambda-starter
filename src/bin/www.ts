import {app} from '../app';

import * as http from 'http';

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '8000');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

// tslint:disable-next-line:typedef
function normalizePort(val: string) {
    const listenOnPort = parseInt(val, 10);

    if (isNaN(listenOnPort))
        return val;

    if (listenOnPort >= 0)
        return listenOnPort;

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

// tslint:disable-next-line:typedef
function onError(error: { syscall: string; code: any; }) {
    if (error.syscall !== 'listen')
        throw error;

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            // tslint:disable-next-line:no-console
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            // tslint:disable-next-line:no-console
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

// tslint:disable-next-line:typedef
function onListening() {
    const addr = server.address();
    if (addr) {
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        // tslint:disable-next-line:no-console
        console.log('Listening on ' + bind);
    }
}
