import { forgeRouter, writeContractFileToClient } from '@lifeforge/server-utils'

const routes = forgeRouter({})

writeContractFileToClient(routes, import.meta.dirname)

export default routes
