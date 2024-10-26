export interface GcodeDto {
  commands: CommandList;
}

export interface CommandList {
  [key: string]: CommandHelp;
}

export interface CommandHelp {
  help: string | never;
}
