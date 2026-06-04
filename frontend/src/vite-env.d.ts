/// <reference types="vite/client" />

// CSS Modules type declaration
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const styles: { readonly [key: string]: string };
  export default styles;
}
