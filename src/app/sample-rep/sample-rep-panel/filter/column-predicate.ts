export class ColumnPredicate {
  name: string;
  predicate: {
    field: string,
    op: string,
    op2: string,
    value: string,
  };
}
