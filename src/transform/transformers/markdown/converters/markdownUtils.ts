const escapeMarkdownTableColumn = (text: string) =>
  text.replace(/\r?\n/g, ' ').replace(/\|/g, '∣');

const createRow = (row: RowData) => {
  const content: string[] = ['| '];

  row.columns.forEach(c => {
    content.push(c.text);
    content.push(' | ');
  });

  return content.join('').trim();
};

const normalizeColumCount = (rows: RowData[]) => {
  let columnCount = 0;

  rows.forEach(r => {
    if (r.columns.length > columnCount) {
      columnCount = r.columns.length;
    }
  });

  rows.forEach(r => {
    while (r.columns.length < columnCount) {
      r.columns.push({
        text: '',
        width: 0,
      });
    }
  });
};

const normalizeColumnWidth = (rows: RowData[]) => {
  const columnCount = rows[0].columns.length;

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    let longestText = 0;

    rows.forEach(r => {
      const col = r.columns[columnIndex];
      if (col.text.length > longestText) {
        longestText = col.text.length;
      }
    });

    rows.forEach(r => {
      const col = r.columns[columnIndex];
      col.width = longestText;
      while (col.text.length < longestText) {
        col.text += ' ';
      }
    });
  }
};

const createBorder = (th: RowData) => {
  const border: RowData = {
    columns: [],
    isHeader: false,
  };

  th.columns.forEach(c => {
    const borderCol: ColumnData = {
      text: '',
      width: c.width,
    };
    while (borderCol.text.length < borderCol.width) {
      borderCol.text += '-';
    }
    border.columns.push(borderCol);
  });

  return createRow(border);
};

const createTable = (rows: RowData[]) => {
  const content: string[] = [];
  if (rows.length === 0) {
    return content;
  }

  normalizeColumCount(rows);
  normalizeColumnWidth(rows);

  const th = rows.find(r => r.isHeader);
  if (th) {
    const headerRow = createRow(th);
    content.push(headerRow);
    content.push(createBorder(th));
  }

  const tds = rows.filter(r => !r.isHeader);
  tds.forEach(td => {
    content.push(createRow(td));
  });

  return content;
};

interface ColumnData {
  text: string;
  width: number;
}

interface RowData {
  columns: ColumnData[];
  isHeader?: boolean;
}

export class MarkdownTable {
  private rows: RowData[] = [];

  addHeader(data: string[]): void {
    this.addRow(data, true);
  }

  addRow(data: string[], isHeader = false): void {
    const columns: ColumnData[] = [];

    data.forEach(text => {
      const col: ColumnData = {
        text: escapeMarkdownTableColumn(text),
        width: text.length,
      };
      columns.push(col);
    });

    this.rows.push({
      columns,
      isHeader,
    });
  }

  toMarkdown(): string[] {
    return createTable(this.rows);
  }
}
