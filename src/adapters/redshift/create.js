const R = require('ramda');
const {
  DEFAULT_TABLE, DEFAULT_COLUMN,
  generateCreate, generatePrimaryKey,
  generateTableOptions, generateColumns
} = require('../../operations/create');


const translate = (table) => {
  const normaliseTuple = ([ field, value ]) => {
    const fnByField = {
      columns: R.map(R.merge(DEFAULT_COLUMN)),
      default: R.identity
    };
    const transformation = fnByField[field] || fnByField['default'];
    return R.set(R.lensProp(field), transformation(value), {});
  };

  const normalise = R.pipe(
    R.merge(DEFAULT_TABLE),
    R.toPairs,
    R.map(normaliseTuple),
    R.mergeAll
  );

  const normalisedTable = normalise(table);

  const [
    createStatement,
    columnsStatement,
    pKeyStatement,
    optionsStatement,
  ] = R.map((fn) => fn(normalisedTable), [
    generateCreate,
    generateColumns,
    generatePrimaryKey,
    generateTableOptions
  ]);

  const hasContent = R.complement(R.isEmpty);

  const polish = R.pipe(
    R.filter(R.identity),
    R.join('\n')
  );

  return polish([
    ...createStatement,
    hasContent(columnsStatement) ? '(' : '',
    columnsStatement.join(',\n'),
    pKeyStatement,
    hasContent(columnsStatement) ? ')' : '',
    optionsStatement,
    hasContent(columnsStatement) ? ';' : '',
  ]);
};

module.exports = translate;
