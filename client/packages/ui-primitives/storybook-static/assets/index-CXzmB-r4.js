import { o as a, r as s } from './index-B3e6rcmj.js';
import { u } from './index-BAgrSUEs.js';
var i = a[' useId '.trim().toString()] || (() => {}),
  d = 0;
function f(r) {
  const [t, o] = s.useState(i());
  return (
    u(() => {
      o((e) => e ?? String(d++));
    }, [r]),
    t ? `radix-${t}` : ''
  );
}
export { f as u };
