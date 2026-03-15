// const login = {
//   printerURL: "http://localhost:7125",
//   apiKey: "null",
// };
// const result = await this.moonrakerClient.getServerFilesList(login);
// console.log(JSON.stringify(result.data.result));
// const token = await this.moonrakerClient.getAccessOneshotToken(login);
// console.log(JSON.stringify(token.data.result));
// const token = await this.moonrakerClient.getAccessApiKey(login);
// console.log(JSON.stringify(token.data.result));
// const result = await this.moonrakerClient.postMachineRestartService(login, "webcamd");
// console.log(result.data.result);
// const result = await this.moonrakerClient.getServerInfo(login);
// const result2 = await this.moonrakerClient.getGcodeStore(login);
// this.logger.log(`Got moonraker version ${result.data.result.api_version_string}`);
// this.logger.log(
//   `Got moonraker gcode store '${
//     result2.data.result.gcode_store.length > 0 ? result2.data.result.gcode_store[0].message : ""
//   }'`
// );
// try {
//   const result4 = await this.moonrakerClient.postPrintStart(
//     login,
//     "Groen_TurbineMerged_0.2mm_PLA_MK3S_8h14m - Copy (1) (1).gcode"
//   );
//   console.log(result4.data.result);
// } catch (e) {
//   console.error((e as AxiosError).response.data.error);
// }
// const result3 = await this.moonrakerClient.postGcodeScript(login, "G28");
// console.log(JSON.stringify(result3.data.result));
// fs.writeFileSync(
//   "objects.json",
//   JSON.stringify((await this.moonrakerClient.getPrinterObjectsQuery(login)).data.result.status, null, " ")
// );
// fs.writeFileSync(
//   "machine-info.json",
//   JSON.stringify((await this.moonrakerClient.getMachineSystemInfo(login)).data.result, null, " ")
// );
// fs.writeFileSync(
//   "objects.list.json",
//   JSON.stringify((await this.moonrakerClient.getPrinterObjectsList(login)).data.result.objects, null, "")
// );
// {
//   const result3 = await this.moonrakerClient.restartServer(login);
//   console.log(result3.data.result);
// }
