import { authenticate } from "@/middleware/authenticate";
import { before, route } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { PrintCompletionSocketIoTask } from "@/tasks/print-completion.socketio.task";
import { IPrintHistoryService } from "@/services/interfaces/print-history.interface";

@route(AppConstants.apiRoute + "/print-completion")
@before([authenticate()])
export class PrintCompletionController {
  constructor(
    private readonly printHistoryService: IPrintHistoryService,
    private readonly printCompletionSocketIoTask: PrintCompletionSocketIoTask,
  ) {
  }
}
