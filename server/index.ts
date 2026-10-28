import { forgeRouter, writeContractFileToClient } from '@lifeforge/server-utils'

import * as schematicsRouter from './routes/schematics'

const routes = forgeRouter({
  schematics: schematicsRouter
})

writeContractFileToClient(routes, import.meta.dirname)

export default routes
