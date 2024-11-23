import { AutoRouter, cors } from "itty-router"
import FrameRouter from "./frame"
import AiRouter from "./ai"

const { preflight, corsify } = cors()

const router = AutoRouter({
    before: [preflight],  // add preflight upstream
    finally: [corsify],   // and corsify downstream
  })

router.all("/webhooks/frame/*", FrameRouter.fetch)
router.all("/ai/*", AiRouter.fetch)

export default router
