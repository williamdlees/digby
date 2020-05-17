export class ColumnPredicate {
  field: string;
  predicates: {
    field: string;
    op: string,
    value: string,
  }[];
  sort: {
    order: string,
  };
}
