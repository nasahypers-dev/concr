// @concr/shared runs in Hermes (React Native), browsers and Node. It must not depend on DOM or
// Node type libraries, so the few timer globals it uses are declared here with the common shape.
declare function setTimeout(handler: () => void, timeout?: number): number;
declare function clearTimeout(handle: number | undefined): void;
declare function setInterval(handler: () => void, timeout?: number): number;
declare function clearInterval(handle: number | undefined): void;
