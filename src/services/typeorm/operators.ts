import { Raw } from "typeorm";

/**
 * a typeorm operator that checks if at least one string from an array is in a simple-array column.
 * simple-array column is a column that is stored as a string array in the database.
 */
export const ArrayIn = (array: number[] | string[] | undefined) =>
  array && array.length > 0 ? Raw((alias) => `string_to_array(${alias}, ',') && ARRAY[:...array]`, { array }) : undefined;
