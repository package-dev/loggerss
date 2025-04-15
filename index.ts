import io, { Socket } from 'socket.io-client'
class Logger {
    //@ts-ignore
    private socket: Socket;
    constructor() {

    }
    init(host: string, auth = {}) {
        this.socket = io(host, {
            reconnection: true,
            reconnectionDelay: 3000,
            reconnectionAttempts: Infinity,
            transports: ['websocket'],
            auth: {
                key: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                ...auth
            }
        })
        this.socket.on('connect', async () => {
            console.log('Logger connected');
        })
        this.socket.on('message', (message) => {
            console.debug('Received:', message);
            this.socket.send('Hello from server');
        });
        this.socket.on('reply', (msg) => {
            console.debug('->Received reply:', msg);
        });
        this.socket.on('connect_error', (err) => {
            console.error('->Connection error:', err.message);
        });
        this.socket.on("disconnect", (reason) => {
            console.debug('->disconnect')
        });
        return this.socket
    }
    on(event: string, callback: (...args: any[]) => void) {
        this.socket.on(event, callback);
    }
    emit(event: string, ...args: any[]) {
        this.socket.emit(event, ...args);
    }
    connect() {
        this.socket.connect();
    }
    disconnect() {
        this.socket.disconnect()
    }
    log(action: string = "none", msg: any) {
        try {


            let data: Record<string, any> = {}
            data.timestamp = new Date().toISOString()
            data.msg = JSON.stringify(msg)
            if (typeof action == "string") data.action = action
            else data.action = "none"
            this.emit('log', data)
        } catch (error) {
            console.debug('errorlog', error)
        }
    }
}
const logger = new Logger()
// logger.init('http://192.168.1.7:3000')
export default logger
// 