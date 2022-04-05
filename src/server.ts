import Router from '@koa/router'
import Koa from 'koa'
import koaBodyparser from 'koa-bodyparser'
import serve from 'koa-static'
import { getApiKey } from './api-key'
import { writeConfigYaml, readConfigYaml } from './config-yaml'
import { createInitialTransaction, createConfigFileAndAddress, runLauncher } from './launcher'
import { BeeManager } from './lifecycle'
import { resolvePath } from './path'
import { port } from './port'
import { getStatus } from './status'
import { rebuildElectronTray } from './electron'

export function runServer() {
    const app = new Koa()
    app.use(serve(resolvePath('static')))
    app.use(async (context, next) => {
        context.set('Access-Control-Allow-Origin', `http://localhost:${port.value}`)
        context.set('Access-Control-Allow-Credentials', 'true')
        context.set(
            'Access-Control-Allow-Headers',
            'Content-Type, Content-Length, Authorization, Accept, X-Requested-With'
        )
        context.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS')
        await next()
    })
    app.use(async (context, next) => {
        const { authorization } = context.headers
        if (authorization !== getApiKey()) {
            context.status = 401
            context.body = 'Unauthorized'
            return
        }
        await next()
    })
    app.use(koaBodyparser())
    const router = new Router()
    router.get('/status', context => {
        context.body = getStatus()
    })
    router.post('/setup/address', async context => {
        await createConfigFileAndAddress()
        context.body = getStatus()
    })
    router.post('/setup/transaction', async context => {
        await createInitialTransaction()
        rebuildElectronTray()
        context.body = getStatus()
    })
    router.post('/config', context => {
        writeConfigYaml(context.request.body)
        context.body = readConfigYaml()
    })
    router.post('/restart', async context => {
        BeeManager.stop()
        await BeeManager.waitForSigtermToFinish()
        runLauncher()
        context.body = { success: true }
    })
    app.use(router.routes())
    app.use(router.allowedMethods())
    app.listen(port.value)
}