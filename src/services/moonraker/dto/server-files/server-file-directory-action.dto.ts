export interface ServerFileDirectoryMovedDto {
  item: Item;
  source_item: SourceItem;
  action: "move_file" | "move_dir" | string;
}

export interface ServerFileDirectoryActionDto {
  item: Item;
  action: "create_dir" | "delete_dir" | "create_file" | "modify_file" | "delete_file" | string;
}

export interface Item {
  path: string;
  root: string;
  modified: number;
  size: number;
  permissions: string;
}

export interface SourceItem {
  path: string;
  root: string;
}
