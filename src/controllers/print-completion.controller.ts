import { authenticate, permission } from "@/middleware/authenticate";
import { GET, route, before } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { PERMS } from "@/constants/authorization.constants";
import { validateInput } from "@/handlers/validators";
import { PrintCompletionSocketIoTask } from "@/tasks/print-completion.socketio.task";
import { Request, Response } from "express";
import { IPrintCompletionService } from "@/services/interfaces/print-completion.interface";

@route(AppConstants.apiRoute + "/print-completion")
@before([authenticate()])
export class PrintCompletionController {
  constructor(
    private readonly printCompletionService: IPrintCompletionService,
    private readonly printCompletionSocketIoTask: PrintCompletionSocketIoTask
  ) {}

  /**
   * Not a production ready call, just for testing.
   */
  @GET()
  @route("/test")
  @before([permission(PERMS.PrintCompletion.List)])
  async test(req: Request, res: Response) {
    const result = await this.printCompletionService.loadPrintContexts();
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
    const { correlationId } = await validateInput(req.params, { correlationId: "required|string" });
    const result = await this.printCompletionService.findPrintCompletion(correlationId);
    res.send(result);
  }

  @GET()
  @route("/")
  @before([permission(PERMS.PrintCompletion.List)])
  async list(req: Request, res: Response) {
    const completions = await this.printCompletionService.listGroupByPrinterStatus();
    res.send(completions);
  }
}
