import { AutoRouter } from "itty-router"
import FrameRouter from "./frame"

const router = AutoRouter()

router.all("/webhooks/frame/*", FrameRouter.fetch)

export default router
