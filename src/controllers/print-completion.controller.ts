import { authenticate, permission } from "@/middleware/authenticate";
import { GET, route, before } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { PERMS } from "@/constants/authorization.constants";
import { validateInput } from "@/handlers/validators";
import { PrintCompletionSocketIoTask } from "@/tasks/print-completion.socketio.task";
import { Request, Response } from "express";
import { IPrintHistoryService } from "@/services/interfaces/print-history.interface";
import { findPrinterCompletionSchema } from "@/controllers/validation/printer-completion-controller.validation";

@route(AppConstants.apiRoute + "/print-completion")
@before([authenticate()])
export class PrintCompletionController {
  constructor(
    private readonly printHistoryService: IPrintHistoryService,
    private readonly printCompletionSocketIoTask: PrintCompletionSocketIoTask
  ) {}

  /**
   * Not a production ready call, just for testing.
   */
  @GET()
  @route("/test")
  @before([permission(PERMS.PrintCompletion.List)])
  async test(req: Request, res: Response) {
    const result = await this.printHistoryService.loadPrintContexts();
    res.send(result);
  }

  @GET()
  @route("/contexts")
  @before([permission(PERMS.PrintCompletion.List)])
  contexts(req: Request, res: Response) {
    const contexts = this.printCompletionSocketIoTask.contexts;
    res.send(contexts);
  }

  @GET()
  @route("/:correlationId")
  @before([permission(PERMS.PrintCompletion.Default)])
  async findCorrelatedEntries(req: Request, res: Response) {
    const { correlationId } = await validateInput(req.params, findPrinterCompletionSchema);
    const result = await this.printHistoryService.findPrintLog(correlationId);
    res.send(result);
  }

  @GET()
  @route("/")
  @before([permission(PERMS.PrintCompletion.List)])
  async list(req: Request, res: Response) {
    const completions = await this.printHistoryService.listGroupByPrinterStatus();
    res.send(completions);
  }
}
