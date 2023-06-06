import { existsSync } from 'fs';
import { readdir, stat, writeFile } from 'fs/promises';

import { PathNode } from './src/path-tree.interface';
import { basename, join, resolve } from 'path';

const endBranch = String.fromCharCode(9492); // └
const midBranch = String.fromCharCode(9500); // ├
const verticalBranch = String.fromCharCode(9474); // │
const horizontalBranch = String.fromCharCode(9472); // ─

async function runner(node: PathNode): Promise<void> {
  const curStat = await stat(node.absolutePath);

  if (curStat.isDirectory()) {
    const files = await readdir(node.absolutePath);

    for (const file of files) {
      const curPath = join(node.absolutePath, file);
      const absolutePath = resolve(curPath);
      const name = basename(absolutePath);

      const newNode: PathNode = {
        current: name,
        absolutePath,
        children: [],
      };
      node.children.push(newNode);

      await runner(newNode);
    }
  }
}

function createTree(node: PathNode): string {
  const children = node.children.flatMap((child, idx) => {
    const childElement: string[] = [];
    const isLast = idx === node.children.length - 1;
    const prefixBranch = isLast ? endBranch : midBranch;

    if (child.children.length !== 0) {
      const childTree = createTree(child);
      childElement.push(
        ...childTree
          .split('\n')
          .map((element) => `${isLast ? ' ' : verticalBranch}  ${element}`)
      );
    }

    return [
      `${prefixBranch}${horizontalBranch} ${child.current}`,
      ...childElement,
    ];
  });

  return children.join('\n');
}

async function pathCreator(root: string, output: string): Promise<void> {
  if (!root) {
    console.error('Arguments Need: <root>');
    return;
  }

  if (!output) {
    console.error('Arguments Need: <output>');
    return;
  }

  const rootPathExists = existsSync(root);

  if (!rootPathExists) {
    console.error(`Root path is not exists: ${root}`);
    return;
  }

  const outputFileExists = existsSync(output);

  if (outputFileExists) {
    const outputFileStat = await stat(output);

    if (!outputFileStat.isFile()) {
      console.error(`Output file is not file: ${output}`);
      return;
    }
  }

  const absolutePath = resolve(root);

  const node: PathNode = {
    current: basename(absolutePath),
    absolutePath,
    children: [],
  };

  await runner(node);

  const tree = createTree(node);
  await writeFile(output, `${node.current}\n${tree}`);
}

pathCreator(process.argv[2], process.argv[3]);
