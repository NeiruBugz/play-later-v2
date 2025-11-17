export class QueryBuilder {
  private query: string = "";
  fields(fields: string[]): this {
    this.query += `fields ${fields.join(", ")};`;
    return this;
  }
  sort(field: string, order: "asc" | "desc" = "asc"): this {
    this.query += `sort ${field} ${order};`;
    return this;
  }
  where(condition: string): this {
    this.query += `where ${condition};`;
    return this;
  }
  limit(count: number): this {
    this.query += `limit ${count};`;
    return this;
  }
  offset(count: number): this {
    this.query += `offset ${count};`;
    return this;
  }
  search(term: string): this {
    this.query += `search "${term}";`;
    return this;
  }
  build(): string {
    return this.query.trim();
  }
}
