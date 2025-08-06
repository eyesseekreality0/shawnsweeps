import {
  Primitive
} from "./chunk-5Z3GQ24Q.js";
import {
  require_jsx_runtime
} from "./chunk-MHZWAHLZ.js";
import {
  require_react
} from "./chunk-BYIBYIM7.js";
import {
  __toESM
} from "./chunk-HXA6O6EE.js";

// node_modules/@radix-ui/react-visually-hidden/dist/index.mjs
var React = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var NAME = "VisuallyHidden";
var VisuallyHidden = React.forwardRef(
  (props, forwardedRef) => {
    return (0, import_jsx_runtime.jsx)(
      Primitive.span,
      {
        ...props,
        ref: forwardedRef,
        style: {
          // See: https://github.com/twbs/bootstrap/blob/master/scss/mixins/_screen-reader.scss
          position: "absolute",
          border: 0,
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          wordWrap: "normal",
          ...props.style
        }
      }
    );
  }
);
VisuallyHidden.displayName = NAME;
var Root = VisuallyHidden;

export {
  VisuallyHidden,
  Root
};
//# sourceMappingURL=chunk-LBIX7ZX3.js.map
