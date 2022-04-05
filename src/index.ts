import { shell } from 'electron'
import { getApiKey } from './api-key'
import { runElectronTray } from './electron'
import { runLauncher } from './launcher'
import { findFreePort, port } from './port'
import { runServer } from './server'
import { getStatus } from './status'

async function main() {
    await findFreePort()
    runServer()
    runElectronTray()
    if (getStatus().status === 2) {
        runLauncher()
    } else {
        shell.openExternal(`http://localhost:${port.value}/installer/?v=${getApiKey()}`)
    }
}

main()