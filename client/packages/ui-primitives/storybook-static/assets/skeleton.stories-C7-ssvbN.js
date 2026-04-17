import{j as e}from"./jsx-runtime-BjG_zV1W.js";import{c as h}from"./utils-BQHNewu7.js";function s({className:u,...N}){return e.jsx("div",{"data-slot":"skeleton",className:h("animate-pulse rounded-md bg-accent",u),...N})}s.__docgenInfo={description:"",methods:[],displayName:"Skeleton"};const w={title:"Primitives/Skeleton",component:s,parameters:{layout:"centered"},tags:["autodocs"]},a={render:()=>e.jsx(s,{className:"h-4 w-[250px]"})},r={render:()=>e.jsxs("div",{className:"flex items-center space-x-4",children:[e.jsx(s,{className:"h-12 w-12 rounded-full"}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(s,{className:"h-4 w-[250px]"}),e.jsx(s,{className:"h-4 w-[200px]"})]})]})},c={render:()=>e.jsxs("div",{className:"space-y-2",children:[e.jsx(s,{className:"h-4 w-full"}),e.jsx(s,{className:"h-4 w-4/5"}),e.jsx(s,{className:"h-4 w-3/5"})]})};var n,t,o;a.parameters={...a.parameters,docs:{...(n=a.parameters)==null?void 0:n.docs,source:{originalSource:`{
  render: () => <Skeleton className="h-4 w-[250px]" />
}`,...(o=(t=a.parameters)==null?void 0:t.docs)==null?void 0:o.source}}};var l,m,d;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:`{
  render: () => <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
}`,...(d=(m=r.parameters)==null?void 0:m.docs)==null?void 0:d.source}}};var p,i,x;c.parameters={...c.parameters,docs:{...(p=c.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
}`,...(x=(i=c.parameters)==null?void 0:i.docs)==null?void 0:x.source}}};const f=["Default","CardSkeleton","TextBlock"];export{r as CardSkeleton,a as Default,c as TextBlock,f as __namedExportsOrder,w as default};
