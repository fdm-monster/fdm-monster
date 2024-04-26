export interface NotifyFileListChangedParams {
  action: ActionType;
  item: Item;
  source_item: SourceItem;
}

export const actionType = [
  "create_file",
  "create_dir",
  "delete_file",
  "delete_dir",
  "move_file",
  "move_dir",
  "modify_file",
  "root_update",
] as const;
export type ActionType = typeof actionType[number];

export interface Item {
  path: string;
  root: string;
  size: number;
  modified: number;
  permissions: string;
}

export interface SourceItem {
  path: string;
  root: string;
}
