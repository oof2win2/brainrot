import { AutoRouter } from "itty-router"
import FrameRouter from "./frame"
import AiRouter from "./ai"

const router = AutoRouter()

router.all("/webhooks/frame/*", FrameRouter.fetch)
router.all("/ai/*", AiRouter.fetch)

export default router
