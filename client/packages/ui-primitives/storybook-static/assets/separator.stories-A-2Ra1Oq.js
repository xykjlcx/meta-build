import{j as e}from"./jsx-runtime-BjG_zV1W.js";import{c as j}from"./utils-BQHNewu7.js";import{r as S}from"./index-B3e6rcmj.js";import{P as z}from"./index-Tk7B4GT7.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-JG1J0hlI.js";import"./index-DuVyFFjR.js";var O="Separator",d="horizontal",g=["horizontal","vertical"],f=S.forwardRef((a,n)=>{const{decorative:s,orientation:t=d,...h}=a,c=E(t)?t:d,N=s?{role:"none"}:{"aria-orientation":c==="vertical"?c:void 0,role:"separator"};return e.jsx(z.div,{"data-orientation":c,...N,...h,ref:n})});f.displayName=O;function E(a){return g.includes(a)}var P=f;function r({className:a,orientation:n="horizontal",decorative:s=!0,...t}){return e.jsx(P,{"data-slot":"separator",decorative:s,orientation:n,className:j("shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",a),...t})}r.__docgenInfo={description:"",methods:[],displayName:"Separator",props:{orientation:{defaultValue:{value:"'horizontal'",computed:!1},required:!1},decorative:{defaultValue:{value:"true",computed:!1},required:!1}}};const b={title:"Primitives/Separator",component:r,parameters:{layout:"centered"},tags:["autodocs"]},o={render:()=>e.jsxs("div",{className:"w-[300px]",children:[e.jsx("div",{className:"text-sm font-medium",children:"标题"}),e.jsx(r,{className:"my-4"}),e.jsx("div",{className:"text-sm text-muted-foreground",children:"内容区域"})]})},i={render:()=>e.jsxs("div",{className:"flex h-5 items-center space-x-4 text-sm",children:[e.jsx("span",{children:"首页"}),e.jsx(r,{orientation:"vertical"}),e.jsx("span",{children:"文档"}),e.jsx(r,{orientation:"vertical"}),e.jsx("span",{children:"源码"})]})};var l,m,p;o.parameters={...o.parameters,docs:{...(l=o.parameters)==null?void 0:l.docs,source:{originalSource:`{
  render: () => <div className="w-[300px]">
      <div className="text-sm font-medium">标题</div>
      <Separator className="my-4" />
      <div className="text-sm text-muted-foreground">内容区域</div>
    </div>
}`,...(p=(m=o.parameters)==null?void 0:m.docs)==null?void 0:p.source}}};var u,v,x;i.parameters={...i.parameters,docs:{...(u=i.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <div className="flex h-5 items-center space-x-4 text-sm">
      <span>首页</span>
      <Separator orientation="vertical" />
      <span>文档</span>
      <Separator orientation="vertical" />
      <span>源码</span>
    </div>
}`,...(x=(v=i.parameters)==null?void 0:v.docs)==null?void 0:x.source}}};const q=["Horizontal","Vertical"];export{o as Horizontal,i as Vertical,q as __namedExportsOrder,b as default};
