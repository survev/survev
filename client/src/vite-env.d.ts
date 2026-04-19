/// <reference types="vite/client" />

declare module "*.ejs" {
    function render(env: Record<string, any>);
    export default render;
}

declare module "virtual-atlases-*" {}
