/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-restricted-syntax */
// const { analyzeSourceFile } = require('web-component-analyzer');
// const ts = require('typescript');

// // read in local config??

// const program = ts.createProgram(['src/components/core/embed/embed.component.ts'], {
//   target: ts.ScriptTarget.ESNext,
//   module: ts.ModuleKind.ES2015,
//   experimentalDecorators: true,
//   skipLibCheck: true,
// });

// const checker = program.getTypeChecker();

// for (const sourceFile of program.getSourceFiles()) {
//   if (sourceFile.fileName === 'src/components/core/embed/embed.component.ts') {
//     ts.forEachChild(sourceFile, (node) => visit(node, checker));
//     // const result = analyzeSourceFile(sourceFile, { program, ts });
//     // const prop = result.componentDefinitions[0].declaration.members[0].node;
//     // console.log(checker.getTypeAtLocation(prop).getSymbol());
//   }
// }

// function visit(node, checker) {
//   if (ts.isDecorator(node)) {
//     console.log(node);
//   }

//   if (ts.isClassDeclaration(node)) {
//     node.members.forEach((mem) => console.log(mem.name.escapedText));
//   }

//   if (ts.isImportDeclaration(node)) {
//     // console.log(node.importClause)
//     // for (let i = 0, n = namedImport.elements.length; i < n; i++) {
//     //   const imp = namedImport.elements[i];
//     //   console.log(`Import: ${imp.getText()}`);
//     //   // Get Type
//     //   const type = checker.getTypeAtLocation(imp);
//     //   console.log('Location', type.location);
//     //   const symbol = type.getSymbol();
//     //   console.log('Has parent:', symbol && !!symbol.parent);
//     //   if (!symbol) continue;
//     //   // Full name
//     //   console.log(`Name: ${checker.getFullyQualifiedName(symbol)}`);
//     //   // Get the declarations (can be multiple), and print them
//     //   console.log('Declarations: ');
//     //   type.getSymbol().getDeclarations().forEach((d) => console.log(d.getText()));
//     //   console.log('===============');
//     // }
//   }
// }
