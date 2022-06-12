const makeWASocket = require("@adiwajshing/baileys").default
const qrcode = require("qrcode-terminal")
const { delay , useSingleFileAuthState } = require("@adiwajshing/baileys")
const { state, saveState } = useSingleFileAuthState('./family-session.json')
const fetch = require("node-fetch");

const startSock = async () => {
    const { version } = await fetchLatestBaileysVersion()
    const sock = makeWASocket({ version, printQRInTerminal: true, auth: state })
    sock.ev.on('messages.upsert', async m => await core(sock, m))

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update

        if (connection) { console.log("Connection Status: ", connection); }

        if (connection !== "close") return

        let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

        const DR = DisconnectReason

        if (reason === DR.badSession) { console.log(`Sessão corrompida. Apague ${connFileName} e leia o código QR.`); sock.logout(); return }
        if (reason === DR.connectionClosed) { console.log("Conexão encerrada. Reconectando..."); startSock(); return }
        if (reason === DR.connectionLost) { console.log("Conexão perdida com o servidor. Tentando reconectar..."); startSock(); return }
        if (reason === DR.connectionReplaced) { console.log("Sessão atual substituida pela nova aberta. Feche essa sessão primeiro."); sock.logout(); return }
        if (reason === DR.loggedOut) { console.log(`Sessão encerrada pelo celular. Apague ${connFileName} e leia o código QR.`); sock.logout(); return }
        if (reason === DR.restartRequired) { console.log("Reinio necessario. Reiniciando..."); startSock(); return }
        if (reason === DR.timedOut) { console.log("A conexão estourou o tempo limite, Reconectando..."); startSock(); return }

        sock.end(`Deu ruim: ${reason}|${lastDisconnect.error}`)
    })
    sock.ev.on('creds.update', saveState)
}

startSock()
