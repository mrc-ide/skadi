const doc = `
Usage:
  builder <path-to-config>
`;

import { docopt } from "docopt";

export const processArgs = (argv: string[] = process.argv) => {
    const opts = docopt(doc, { argv: argv.slice(2), exit: false });
    const configPath = opts["<path-to-config>"] as string;
    return { configPath };
};
