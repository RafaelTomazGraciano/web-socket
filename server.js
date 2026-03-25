const WebSocket = require("ws")
const Crypto =  require("node:crypto")

const wss = new WebSocket.Server({ port: 8080 })
let clients = []
const groups = {}
const messages = {}

wss.on("connection", (ws) => {
    
    console.log("Novo cliente conectado")
    clients.push(ws)

    ws.on("message", (message) => {
        let data = JSON.parse(message)

        if (data.type === "join") {

            ws.group = data.group

            if (!data.group in groups) {
                groups[data.group] = 0;
            } else {
                groups[data.group]++;
            }
            const clientUUID = Crypto.randomUUID()

            console.log(`Cliente ${clientUUID} entrou no grupo ${data.group}`)
            
            ws.send(JSON.stringify({
                type: "set-id",
                id: clientUUID
            }))
        }
        
        if (data.type === "msg") {
            console.log("Mensagem recebida:", data.msg)
            let msgId = crypto.randomUUID()
            messages[msgId] = {c: 0}
            clients.forEach(client => {
                if (client.group === data.group && client.id !== ws.id) {
                    client.send(JSON.stringify({
                        msg: data.msg,
                        msgId: msgId,
                        type: "msg"
                    }))
                }
            })
        }

        if (data.type === "ack") {
            console.log("Mensagem reconhecida por " + ws.id);
            messages[data.msgId].c++;
            if(groups[ws.group] === (messages[data.msgId].c+1)) {
                console.log(`Todos receberam mensagem de id ${data.msgId}`)
            }
        }
    })
    
    ws.on("close", () => {
        console.log("Cliente desconectado")
        groups[ws.group]--;
        clients = clients.filter(c => c !== ws)
    })
})
console.log("Servidor rodando em ws://localhost:8080")