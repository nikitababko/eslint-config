interface RuntimeContext {
  process: NodeJS.Process;
}

const context: RuntimeContext = { process };

export = context;
